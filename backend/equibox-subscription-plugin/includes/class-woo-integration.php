<?php

require_once __DIR__ . '/class-stripe-integration.php';

class Woo_Integration {
    public static function init() {
        error_log("=== Woo_Integration init method called ===");
        
        // Hook for manual order completion
        add_action('woocommerce_order_status_changed', [__CLASS__, 'handle_order_status_change'], 10, 4);
        
        // Keep existing payment complete hook for regular checkout
        add_action('woocommerce_payment_complete', [__CLASS__, 'handle_subscription_creation'], 10, 1);
    }
    
    public static function handle_order_status_change($order_id, $old_status, $new_status, $order) {
        error_log("=== Order Status Change ===");
        error_log("Order ID: " . $order_id);
        error_log("Old Status: " . $old_status);
        error_log("New Status: " . $new_status);
    
        // If the new status is 'completed', handle the subscription creation
        if ($new_status === 'completed') {
            error_log("Order marked as complete - creating subscription");
            self::handle_subscription_creation($order_id);
        }
    }
    
    public static function handle_subscription_creation($order_id) {
        error_log("Triggered handle_subscription_creation for Order ID: $order_id");

        $order = wc_get_order($order_id);
        error_log("WooCommerce Order Object: " . ($order ? print_r($order, true) : 'null'));

        if (!$order) {
            error_log("Invalid WooCommerce order ID: $order_id");
            return;
        }

        // Get customer details
        $customer_email = $order->get_billing_email();
        $customer_name = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();

        error_log("Customer details: Email - $customer_email, Name - $customer_name");

        global $wpdb;

        // Check if the product is a subscription
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            error_log("Processing product ID: $product_id");

            $product = wc_get_product($product_id);

            if (!$product) {
                error_log("Failed to retrieve product for order $order_id");
                continue;
            }

            $product_name = $product->get_name();
            error_log("Product name: $product_name");

            try {
                // Retrieve stripe_plan_id for the product
                $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
                    "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE name = %s",
                    $product_name
                ));
                error_log("Stripe plan ID for product '$product_name': " . ($stripe_plan_id ?: 'Not Found'));

                if (!$stripe_plan_id) {
                    error_log("No Stripe plan ID found for product '$product_name'. Skipping.");
                    continue;
                }

                $payment_method_id = get_post_meta($order_id, '_stripe_payment_method', true);
                error_log("Payment method ID for order $order_id: " . ($payment_method_id ?: 'Not Found'));

                if (!$payment_method_id) {
                    error_log("No payment method ID found for order $order_id");
                    continue;
                }

                // Create the subscription in Stripe
                error_log("Creating Stripe subscription for customer email: $customer_email");
                $subscription = Stripe_Integration::create_stripe_subscription(
                    $customer_email,
                    $customer_name,
                    $order_id,
                    $stripe_plan_id,
                    $payment_method_id
                );

                error_log("Stripe subscription created: " . print_r($subscription, true));

                // Save subscription details to the database
                self::save_subscription_to_db($order_id, $product_id, $subscription->customer, $subscription->id);

            } catch (Exception $e) {
                error_log("Error handling subscription creation for order $order_id: " . $e->getMessage());
            }
        }
    }

    public static function save_subscription_to_db($order_id, $product_id, $customer_id, $subscription_id) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'subscriptions';

        error_log("Saving subscription to database for Order ID: $order_id, Product ID: $product_id");

        $inserted = $wpdb->insert(
            $table_name,
            [
                'order_id' => $order_id,
                'product_id' => $product_id,
                'stripe_customer_id' => $customer_id,
                'stripe_subscription_id' => $subscription_id,
                'status' => 'active',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'last_payment_date' => current_time('mysql'),
                'payment_due_date' => date('Y-m-d H:i:s', strtotime('+1 month')),
            ]
        );

        if ($inserted === false) {
            error_log("Failed to save subscription to database for order ID: $order_id. DB Error: " . $wpdb->last_error);
            return false;
        }

        // Add meta to WooCommerce order
        update_post_meta($order_id, '_stripe_subscription_id', $subscription_id);
        update_post_meta($order_id, '_stripe_customer_id', $customer_id);

        error_log("Saved subscription to database for order $order_id");
        return true;
    }

    public static function handle_subscription_update($user_id, $plan_id) {
        global $wpdb;

        error_log("Updating subscription for User ID: $user_id, Plan ID: $plan_id");

        // Fetch plan details
        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT stripe_plan_id, name, price FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ));

        error_log("Fetched plan details: " . print_r($plan, true));

        // Fetch existing subscription
        $subscription = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscriptions WHERE user_id = %d",
            $user_id
        ));

        if (!$subscription) {
            error_log("No active subscription found for user ID: $user_id");
            return false;
        }

        // Update WooCommerce subscription product
        $product = wc_get_product($subscription->product_id);
        if ($product) {
            $product->set_name($plan->name);
            $product->set_regular_price($plan->price);
            $product->save();

            error_log("WooCommerce subscription updated for user ID: $user_id and plan ID: $plan_id");
        } else {
            error_log("WooCommerce product not found for subscription.");
        }

        // Sync with Stripe
        Stripe_Integration::update_stripe_subscription($subscription->stripe_subscription_id, $plan->stripe_plan_id);

        // Update database
        $updated = $wpdb->update("{$wpdb->prefix}subscriptions", [
            'plan_id' => $plan_id,
            'updated_at' => current_time('mysql'),
            'payment_due_date' => date('Y-m-d H:i:s', strtotime('+1 month')),
        ], ['user_id' => $user_id]);

        if ($updated === false) {
            error_log("Failed to update subscription in database for user ID: $user_id. DB Error: " . $wpdb->last_error);
            return false;
        }

        error_log("Subscription updated successfully for user ID: $user_id");
        return true;
    }

    public static function handle_subscription_cancellation($user_id) {
        global $wpdb;

        error_log("Cancelling subscription for User ID: $user_id");

        // Fetch existing subscription
        $subscription = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscriptions WHERE user_id = %d",
            $user_id
        ));

        if (!$subscription) {
            error_log("No active subscription found for user ID: $user_id");
            return false;
        }

        // Cancel Stripe subscription
        Stripe_Integration::cancel_stripe_subscription($subscription->stripe_subscription_id);

        // Update database
        $updated = $wpdb->update("{$wpdb->prefix}subscriptions", [
            'status' => 'canceled',
            'cancelled_at' => current_time('mysql'),
        ], ['user_id' => $user_id]);

        if ($updated === false) {
            error_log("Failed to cancel subscription in database for user ID: $user_id. DB Error: " . $wpdb->last_error);
            return false;
        }

        error_log("Subscription canceled successfully for user ID: $user_id");
        return true;
    }
}
