<?php

class Stripe_Integration {
    public static function init() {
        error_log("Stripe_Integration init method called");

        // Ensure Stripe SDK is loaded
        require_once __DIR__ . '/vendor/autoload.php'; 
        error_log("Stripe SDK loaded successfully");
    }

    public static function create_stripe_subscription($email, $name, $order_id, $stripe_plan_id, $payment_method_id) {
        error_log('Inside create_stripe_subscription - Received Stripe Plan ID: ' . ($stripe_plan_id ?: 'Not Provided'));

        if (empty($stripe_plan_id)) {
            error_log('Error: Stripe Plan ID is missing');
            throw new Exception('Stripe Plan ID is missing.');
        }

        // Fetch Stripe secret key
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        error_log('Stripe Secret Key: ' . ($secret_key ? 'Loaded' : 'Missing'));

        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            // Create or retrieve customer
            error_log('Checking for existing customer with email: ' . $email);
            $existing_customer = self::get_customer_by_email($email);
            $customer_id = $existing_customer ? $existing_customer->id : self::create_customer($email, $name);
            error_log('Customer ID: ' . ($customer_id ?: 'Not Created/Found'));

            if (empty($payment_method_id)) {
                error_log('Error: Payment method ID is missing for order ID: ' . $order_id);
                throw new Exception('Payment method ID is missing.');
            }

            // Attach the payment method to the customer
            error_log('Retrieving payment method: ' . $payment_method_id);
            $payment_method = \Stripe\PaymentMethod::retrieve($payment_method_id);
            $payment_method->attach(['customer' => $customer_id]);
            error_log('Payment method attached successfully to Customer ID: ' . $customer_id);

            // Set default payment method
            \Stripe\Customer::update($customer_id, [
                'invoice_settings' => ['default_payment_method' => $payment_method_id],
            ]);
            error_log('Default payment method set for Customer ID: ' . $customer_id);

            // Create subscription
            $subscription_payload = [
                'customer' => $customer_id,
                'items' => [['price' => $stripe_plan_id]],
                'metadata' => [
                    'order_id' => $order_id,
                    'user_email' => $email,
                ],
            ];
            error_log('Subscription Payload: ' . print_r($subscription_payload, true));

            $subscription = \Stripe\Subscription::create($subscription_payload);
            error_log('Stripe Subscription Object: ' . print_r($subscription, true));

            return $subscription;

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            throw new Exception('Failed to process Stripe request: ' . $e->getMessage());
        } catch (Exception $e) {
            error_log('General Stripe Error: ' . $e->getMessage());
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    public static function update_stripe_subscription($stripe_subscription_id, $plan_id) {
        global $wpdb;

        error_log("Updating Stripe subscription: $stripe_subscription_id for Plan ID: $plan_id");

        // Fetch the stripe_plan_id for the given plan_id
        $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
            "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ));
        error_log("Fetched Stripe Plan ID for Plan ID $plan_id: " . ($stripe_plan_id ?: 'Not Found'));

        if (empty($stripe_plan_id)) {
            throw new Exception("No Stripe plan ID found for plan ID: $plan_id");
        }

        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        error_log('Stripe Secret Key: ' . ($secret_key ? 'Loaded' : 'Missing'));

        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);
            error_log("Retrieved subscription: " . print_r($subscription, true));

            // Update subscription items with the new plan
            $updated_subscription = \Stripe\Subscription::update(
                $stripe_subscription_id,
                [
                    'items' => [
                        [
                            'id' => $subscription->items->data[0]->id,
                            'price' => $stripe_plan_id,
                        ],
                    ],
                    'proration_behavior' => 'create_prorations',
                ]
            );

            error_log("Stripe subscription updated: $stripe_subscription_id");

            // Update database
            $updated = $wpdb->update(
                "{$wpdb->prefix}subscriptions",
                [
                    'plan_id' => $plan_id,
                    'updated_at' => current_time('mysql'),
                ],
                ['stripe_subscription_id' => $stripe_subscription_id]
            );

            if ($updated === false) {
                error_log("Failed to update database for subscription ID: $stripe_subscription_id. DB Error: " . $wpdb->last_error);
            }

            return $updated_subscription;

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Stripe API Error during subscription update: " . $e->getMessage());
            throw new Exception("Failed to update subscription: " . $e->getMessage());
        }
    }

    public static function cancel_stripe_subscription($stripe_subscription_id, $cancel_at_period_end = false) {
        error_log("Cancelling Stripe subscription: $stripe_subscription_id. Cancel at period end: " . ($cancel_at_period_end ? 'Yes' : 'No'));

        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        error_log('Stripe Secret Key: ' . ($secret_key ? 'Loaded' : 'Missing'));

        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);
            error_log("Retrieved subscription: " . print_r($subscription, true));

            // Cancel subscription
            $subscription->cancel(['at_period_end' => $cancel_at_period_end]);
            error_log("Stripe subscription canceled successfully: $stripe_subscription_id");

            // Update database
            global $wpdb;
            $updated = $wpdb->update(
                "{$wpdb->prefix}subscriptions",
                [
                    'status' => 'canceled',
                    'canceled_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                ],
                ['stripe_subscription_id' => $stripe_subscription_id]
            );

            if ($updated === false) {
                error_log("Failed to update database for canceled subscription ID: $stripe_subscription_id. DB Error: " . $wpdb->last_error);
            }

            return true;

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Stripe API Error during subscription cancellation: " . $e->getMessage());
            throw new Exception("Failed to cancel subscription: " . $e->getMessage());
        }
    }

    private static function get_customer_by_email($email) {
        error_log("Fetching customer by email: $email");
        try {
            $customers = \Stripe\Customer::all(['email' => $email]);
            error_log("Retrieved customers: " . print_r($customers, true));
            return count($customers->data) > 0 ? $customers->data[0] : null;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Error fetching Stripe customer by email: " . $e->getMessage());
            return null;
        }
    }

    private static function create_customer($email, $name) {
        error_log("Creating Stripe customer with email: $email, name: $name");
        try {
            $customer = \Stripe\Customer::create([
                'email' => $email,
                'name' => $name,
            ]);

            error_log('Customer created successfully: ' . $customer->id);
            return $customer->id;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error while creating customer: ' . $e->getMessage());
            throw new Exception('Failed to create customer: ' . $e->getMessage());
        }
    }
}
