<?php

class Stripe_Integration {
    public static function init() {
        // Ensure Stripe SDK is loaded
        require_once __DIR__ . '/vendor/autoload.php'; 
    }

    public static function create_stripe_subscription($email, $name, $order_id, $price_id) {
        // Fetch Stripe secret key from wp-config
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        // Validate inputs
        if (empty($email) || empty($name) || empty($order_id) || empty($price_id)) {
            throw new Exception('Invalid inputs provided for Stripe subscription.');
        }

        try {
            // Create or retrieve customer
            $existing_customer = self::get_customer_by_email($email);
            $customer_id = $existing_customer ? $existing_customer->id : self::create_customer($email, $name);

            // Create subscription
            $subscription = \Stripe\Subscription::create([
                'customer' => $customer_id,
                'items' => [['price' => $price_id]],
                'metadata' => ['order_id' => $order_id, 'user_email' => $email],
            ]);

            error_log('Subscription created successfully: ' . $subscription->id);
            return $subscription;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            throw new Exception('Failed to process Stripe request: ' . $e->getMessage());
        } catch (Exception $e) {
            error_log('General Stripe Error: ' . $e->getMessage());
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    public static function update_stripe_subscription($stripe_subscription_id, $stripe_plan_id) {
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);
            
            // Update subscription items with the new plan
            $subscription->items = [
                ['id' => $subscription->items->data[0]->id, 'price' => $stripe_plan_id],
            ];
            $subscription->save();

            error_log("Stripe subscription updated: $stripe_subscription_id");
            return $subscription;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Failed to update Stripe subscription: " . $e->getMessage());
            throw new Exception("Failed to update subscription: " . $e->getMessage());
        } catch (Exception $e) {
            error_log("General error updating Stripe subscription: " . $e->getMessage());
            throw new Exception("An error occurred while updating subscription: " . $e->getMessage());
        }
    }

    public static function cancel_stripe_subscription($stripe_subscription_id) {
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);
            $subscription->cancel();

            error_log("Stripe subscription canceled: $stripe_subscription_id");
            return true;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Failed to cancel Stripe subscription: " . $e->getMessage());
            throw new Exception("Failed to cancel subscription: " . $e->getMessage());
        } catch (Exception $e) {
            error_log("General error canceling Stripe subscription: " . $e->getMessage());
            throw new Exception("An error occurred while canceling subscription: " . $e->getMessage());
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
