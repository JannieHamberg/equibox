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
                // Retrieve stripe_plan_id for the product (assuming the product name maps to the plan name)
                $stripe_plan_id = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE name = %s",
                        $product_name
                    )
                );

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
                self::save_subscription_to_db($order_id, $subscription->customer, $subscription->id);

            } catch (Exception $e) {
                error_log("Error handling subscription creation for order $order_id: " . $e->getMessage());
            }
        }
    }

    public static function save_subscription_to_db($order_id, $customer_id, $subscription_id) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'subscriptions';

        $wpdb->insert(
            $table_name,
            [
                'order_id' => $order_id,
                'stripe_customer_id' => $customer_id,
                'stripe_subscription_id' => $subscription_id,
                'status' => 'active',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        // Add meta to WooCommerce order
        update_post_meta($order_id, '_stripe_subscription_id', $subscription_id);
        update_post_meta($order_id, '_stripe_customer_id', $customer_id);

        error_log("Saved subscription to database for order $order_id");
    }
}
