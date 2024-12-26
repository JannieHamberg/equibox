<?php

require_once __DIR__ . '/class-stripe-integration.php';

class Woo_Integration {
    public static function init() {
        // Hook into Woo payment complete action
        add_action('woocommerce_payment_complete', [__CLASS__, 'handle_subscription_creation'], 10, 1);
    }

    public static function handle_subscription_creation($order_id) {
        $order = wc_get_order($order_id);

        if (!$order) {
            error_log("Invalid WooCommerce order ID: $order_id");
            return;
        }

        // Get customer details
        $customer_email = $order->get_billing_email();
        $customer_name = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();

        global $wpdb;

        // Check if the product is a subscription
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $product = wc_get_product($product_id);

            if (!$product) {
                error_log("Failed to retrieve product for order $order_id");
                continue;
            }

            $product_name = $product->get_name();

            try {
                // Retrieve stripe_plan_id for the product
                $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
                    "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE name = %s",
                    $product_name
                ));

                if (!$stripe_plan_id) {
                    error_log("No Stripe plan ID found for product '$product_name'. Skipping.");
                    continue;
                }

                // Create the subscription in Stripe
                $subscription = Stripe_Integration::create_stripe_subscription(
                    $customer_email,
                    $customer_name,
                    $order_id,
                    $stripe_plan_id
                );

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
            error_log("Failed to save subscription to database for order ID: $order_id");
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

        // Fetch plan details
        $plan = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d", $plan_id));
        if (!$plan) {
            error_log("Plan not found for ID: $plan_id");
            return false;
        }

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
            error_log("Failed to update subscription in database for user ID: $user_id");
            return false;
        }

        error_log("Subscription updated successfully for user ID: $user_id");
        return true;
    }

    public static function handle_subscription_cancellation($user_id) {
        global $wpdb;

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
        $wpdb->update("{$wpdb->prefix}subscriptions", [
            'status' => 'canceled',
            'cancelled_at' => current_time('mysql'),
        ], ['user_id' => $user_id]);

        error_log("Subscription canceled successfully for user ID: $user_id");
        return true;
    }
}
