<?php

if (!defined('ABSPATH')) {
    exit;
}

// Load Stripe SDK
require_once __DIR__ . '/../vendor/autoload.php'; 
use Stripe\Webhook;

class Stripe_Webhook_Handler {

    // Verify the Stripe webhook signature
    private static function verify_stripe_webhook_signature() {
        $endpoint_secret = defined('STRIPE_WEBHOOK_SECRET') ? STRIPE_WEBHOOK_SECRET : null;
        if (!$endpoint_secret) {
            error_log('Webhook secret is not defined');
            throw new Exception('Stripe webhook secret is not defined.');
        }
    
        $stripe_signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        error_log('Stripe signature received: ' . ($stripe_signature ?: 'None'));
    
        $payload = @file_get_contents('php://input');
        error_log('Webhook payload: ' . ($payload ?: 'None'));
    
        if (empty($stripe_signature)) {
            error_log('Missing Stripe signature.');
            return false;
        }
    
        try {
            // Verify the signature
            Webhook::constructEvent($payload, $stripe_signature, $endpoint_secret);
            error_log('Webhook signature verification successful');
            return true;
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            error_log('Stripe signature verification failed: ' . $e->getMessage());
            return false;
        }
    }
    
    private static function set_stripe_api_key() {
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        if (!$secret_key) {
            throw new Exception('Stripe secret key is not defined.');
        }
        \Stripe\Stripe::setApiKey($secret_key);
    }

    public static function handle_webhook(WP_REST_Request $request) {
        try {
            self::set_stripe_api_key();
            
            $payload = $request->get_body();
            $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
            $event = \Stripe\Webhook::constructEvent($payload, $sig_header, STRIPE_WEBHOOK_SECRET);

            error_log('Webhook event received: ' . $event->type);

            switch ($event->type) {
                case 'invoice.payment_succeeded':
                    self::handle_payment_succeeded($event->data->object);
                    break;

                case 'invoice.payment_failed':
                    self::handle_payment_failed($event->data->object);
                    break;

                case 'customer.subscription.created':
                    self::handle_subscription_created($event->data->object);
                    break;

                case 'customer.subscription.updated':
                    self::handle_subscription_updated($event->data->object);
                    break;

                case 'customer.subscription.deleted':
                    self::handle_subscription_deleted($event->data->object);
                    break;

                case 'payment_intent.succeeded':
                    self::handle_payment_intent_succeeded($event->data->object);
                    break;

                case 'payment_intent.payment_failed':
                    self::handle_payment_intent_failed($event->data->object);
                    break;
            }

            return rest_ensure_response(['success' => true]);
        } catch (\Exception $e) {
            error_log('Webhook Error: ' . $e->getMessage());
            return new WP_Error('webhook_error', $e->getMessage(), ['status' => 400]);
        }
    }


    //!newly added test to fix bug, if doesn work revert to above function
    private static function handle_payment_succeeded($invoice) {
        global $wpdb;
    
        try {
            error_log("Handling payment succeeded for invoice: " . $invoice->id);
    
            if (!empty($invoice->subscription)) {
                // Fetch the latest subscription status
                $subscription = \Stripe\Subscription::retrieve($invoice->subscription);
                $subscription_status = $subscription->status;
                error_log("Re-fetched subscription status: " . $subscription_status);
    
                if ($subscription_status === 'active') {
                    // Update the database only if subscription is now active
                    $wpdb->update(
                        "{$wpdb->prefix}subscriptions",
                        [
                            'status' => 'active',
                            'updated_at' => current_time('mysql'),
                            'last_payment_date' => current_time('mysql')
                        ],
                        ['stripe_subscription_id' => $invoice->subscription]
                    );
    
                    error_log("Subscription updated to active in DB: " . $invoice->subscription);
                } else {
                    error_log(" Subscription status is still '$subscription_status'. Not updating database.");
                }
            } else {
                error_log(" No subscription found in invoice: " . $invoice->id);
            }
    
        } catch (\Exception $e) {
            error_log("Error handling payment succeeded: " . $e->getMessage());
        }
    }
    

    private static function handle_payment_failed($invoice) {
        global $wpdb;

        error_log('Handling payment failed for invoice: ' . print_r($invoice, true));

        $subscription_id = $invoice->subscription;

        $updated = $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'payment_failed',
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription_id]
        );

        if ($updated === false) {
            error_log('Failed to update subscription after payment failure: ' . $wpdb->last_error);
        } else {
            error_log("Payment failed for subscription ID: $subscription_id");
        }
    }

    
    public static function handle_subscription_created($subscription) {
        global $wpdb;
        error_log("Handling subscription created: " . $subscription->id);
        
        // Get user email from subscription metadata
        $user_email = $subscription->metadata->user_email ?? '';
        
        if (empty($user_email)) {
            error_log("No user email in subscription metadata");
            return;
        }

        // Get user ID from WordPress
        $user = get_user_by('email', $user_email);
        if (!$user) {
            error_log("Could not find user for email: " . $user_email);
            return;
        }

        // First, cancel all existing subscriptions for this user
        $wpdb->update(
            $wpdb->prefix . 'subscriptions',
            ['status' => 'canceled'],
            ['user_id' => $user->ID, 'status' => ['active', 'incomplete']], // Only update active or incomplete subscriptions
            ['%s'],
            ['%d', '%s']
        );

        // Get plan ID from stripe_plan_id
        $plan_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}subscription_plans WHERE stripe_plan_id = %s",
            $subscription->items->data[0]->price->id
        ));

        // Insert the new subscription
        $result = $wpdb->insert(
            $wpdb->prefix . 'subscriptions',
            [
                'user_id' => $user->ID,
                'plan_id' => $plan_id,
                'stripe_subscription_id' => $subscription->id,
                'status' => $subscription->status === 'active' ? 'active' : 'incomplete',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'payment_due_date' => date('Y-m-d H:i:s', $subscription->current_period_end)
            ]
        );

        if ($result === false) {
            error_log("Failed to insert subscription: " . $wpdb->last_error);
        } else {
            error_log("Successfully created subscription in database with status: " . $subscription->status);
        }
    }

    public static function handle_subscription_updated($subscription) {
        error_log("Handling subscription updated: " . $subscription->id);
        
        global $wpdb;
        error_log('Handling subscription update: ' . print_r($subscription, true));

        // Get Stripe subscription status and map it appropriately
        $stripe_status = $subscription->status;
        $db_status = ($stripe_status === 'active') ? 'active' : 'incomplete';
        
        // Update the subscription status in the database
        $result = $wpdb->update(
            $wpdb->prefix . 'subscriptions',
            [
                'status' => $db_status,
                'updated_at' => current_time('mysql')
            ],
            ['stripe_subscription_id' => $subscription->id],
            ['%s', '%s'],
            ['%s']
        );

        error_log("Update result for subscription {$subscription->id}: status={$db_status} " . 
                 ($result !== false ? "Success" : "Failed - " . $wpdb->last_error));
    }

    private static function handle_subscription_deleted($subscription) {
        global $wpdb;

        error_log('Handling subscription deleted: ' . print_r($subscription, true));

        if (empty($subscription->id)) {
            error_log('Subscription deleted event missing subscription ID.');
            return;
        }

        $cancellation_type = $subscription->cancel_at_period_end ? 'end_of_period' : 'immediate';

        $updated = $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'canceled',
                'cancelled_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription->id]
        );

        if ($updated === false) {
            error_log('Failed to update subscription in database after cancellation: ' . $wpdb->last_error);
        } else {
            error_log("Subscription successfully marked as canceled: {$subscription->id}");
        }
    }


    // handle payment intent succeeded
    private static function handle_payment_intent_succeeded($payment_intent) {
        global $wpdb;
        
        try {
            error_log("Handling payment intent succeeded for: " . $payment_intent->id);
    
            $subscription_id = null;
    
            // Retrieve the subscription ID from multiple possible sources
            if (!empty($payment_intent->invoice)) {
                $invoice = \Stripe\Invoice::retrieve($payment_intent->invoice);
                $subscription_id = $invoice->subscription ?? null;
            }
            
            if (!$subscription_id && isset($payment_intent->metadata->subscription_id)) {
                $subscription_id = $payment_intent->metadata->subscription_id;
            }
    
            if (!$subscription_id && !empty($payment_intent->customer)) {
                $customer_id = $payment_intent->customer;
                $subscriptions = \Stripe\Subscription::all(['customer' => $customer_id, 'limit' => 1]);
    
                if (!empty($subscriptions->data)) {
                    $subscription_id = $subscriptions->data[0]->id;
                }
            }
    
            if ($subscription_id) {
                // Fetch the latest subscription status from Stripe
                $subscription = \Stripe\Subscription::retrieve($subscription_id);
                $subscription_status = $subscription->status;
                error_log(" Re-fetched subscription status: " . $subscription_status);
    
                if ($subscription_status === 'active') {
                    // Update the database only if subscription is now active
                    $wpdb->update(
                        "{$wpdb->prefix}subscriptions",
                        [
                            'status' => 'active',
                            'updated_at' => current_time('mysql'),
                            'last_payment_date' => current_time('mysql')
                        ],
                        ['stripe_subscription_id' => $subscription_id]
                    );
                    error_log(" Subscription updated to active in DB: " . $subscription_id);
                } else {
                    error_log(" Subscription status is still '$subscription_status'. Not updating database.");
                }
            } else {
                error_log("No subscription found for payment intent: " . $payment_intent->id);
            }
    
        } catch (\Exception $e) {
            error_log(" Error handling payment intent success: " . $e->getMessage());
        }
    }
    
    

    private static function handle_payment_intent_failed($payment_intent) {
        // Implementation needed
        error_log('Payment intent failed event received');
    } 
    
}
