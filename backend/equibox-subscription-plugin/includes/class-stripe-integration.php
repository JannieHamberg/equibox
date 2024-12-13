<?php

class Stripe_Integration {
    public static function init() {
        // Ensure stripe SDK is loaded
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
            $customer = \Stripe\Customer::create([
                'email' => $email,
                'name'  => $name,
            ]);
        
            error_log('Customer created successfully: ' . $customer->id);
        
            $subscription = \Stripe\Subscription::create([
                'customer' => $customer->id,
                'items'    => [['price' => $price_id]],
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
}
