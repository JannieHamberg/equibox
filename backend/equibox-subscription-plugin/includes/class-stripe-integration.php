<?php

class Stripe_Integration {
    public static function init() {
        // Ensure Stripe SDK is loaded
        require_once __DIR__ . '/vendor/autoload.php'; 
    }

    public static function create_stripe_subscription($email, $name, $order_id, $stripe_plan_id, $payment_method_id) {
        error_log('Inside create_stripe_subscription - Received Stripe Plan ID: ' . $stripe_plan_id);
    
        if (empty($stripe_plan_id)) {
            throw new Exception('Stripe Plan ID is missing.');
        }
    
        // Fetch Stripe secret key
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }
    
        \Stripe\Stripe::setApiKey($secret_key);
    
        try {
            // Create or retrieve customer
            error_log('Checking for existing customer with email: ' . $email);
            $existing_customer = self::get_customer_by_email($email);
            $customer_id = $existing_customer ? $existing_customer->id : self::create_customer($email, $name);
            error_log('Customer ID: ' . $customer_id);
    
            // Attach the payment method to the customer
            $payment_method = \Stripe\PaymentMethod::retrieve($payment_method_id);
            $payment_method->attach(['customer' => $customer_id]);
    
            // Set default payment method
            \Stripe\Customer::update($customer_id, [
                'invoice_settings' => ['default_payment_method' => $payment_method_id],
            ]);
    
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

    // Fetch the stripe_plan_id for the given plan_id
    $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
        "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
        $plan_id
    ));

    if (empty($stripe_plan_id)) {
        throw new Exception("No Stripe plan ID found for plan ID: $plan_id");
    }

    $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
    if (empty($secret_key)) {
        throw new Exception('Stripe secret key is not defined in wp-config.php');
    }

    \Stripe\Stripe::setApiKey($secret_key);

    try {
        $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);

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
        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'plan_id' => $plan_id,
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $stripe_subscription_id]
        );

        return $updated_subscription;
    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log("Failed to update Stripe subscription: " . $e->getMessage());
        throw new Exception("Failed to update subscription: " . $e->getMessage());
    }
}


public static function cancel_stripe_subscription($stripe_subscription_id, $cancel_at_period_end = false) {
    $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
    if (empty($secret_key)) {
        throw new Exception('Stripe secret key is not defined in wp-config.php');
    }

    \Stripe\Stripe::setApiKey($secret_key);

    try {
        $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);

        // Cancel subscription
        $subscription->cancel(['at_period_end' => $cancel_at_period_end]);

        error_log("Stripe subscription canceled: $stripe_subscription_id");

        // Update database
        global $wpdb;
        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'canceled',
                'canceled_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $stripe_subscription_id]
        );

        return true;
    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log("Failed to cancel Stripe subscription: " . $e->getMessage());
        throw new Exception("Failed to cancel subscription: " . $e->getMessage());
    }
}

    private static function get_customer_by_email($email) {
        try {
            $customers = \Stripe\Customer::all(['email' => $email]);
            return count($customers->data) > 0 ? $customers->data[0] : null;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Error fetching Stripe customer by email: " . $e->getMessage());
            return null;
        }
    }

    private static function create_customer($email, $name) {
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
