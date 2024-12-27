<?php

if (!defined('ABSPATH')) {
    exit; 
}

class Stripe_Webhook_Handler {

    // Verify the Stripe webhook signature
    private static function verify_stripe_webhook_signature() {
        $endpoint_secret = defined('STRIPE_WEBHOOK_SECRET') ? STRIPE_WEBHOOK_SECRET : null;
        if (!$endpoint_secret) {
            throw new Exception('Stripe webhook secret is not defined.');
        }

        $stripe_signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $payload = @file_get_contents('php://input');

        if (empty($stripe_signature)) {
            error_log('Missing Stripe signature.');
            return false;
        }

        try {
            \Stripe\Webhook::constructEvent($payload, $stripe_signature, $endpoint_secret);
            return true;
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            error_log('Stripe signature verification failed: ' . $e->getMessage());
            return false;
        }
    }

    public static function handle_webhook($request) {
        // Verify Stripe webhook signature before proceeding
        if (!self::verify_stripe_webhook_signature()) {
            return new WP_Error('invalid_signature', 'Stripe signature verification failed', ['status' => 401]);
        }

        // Retrieve the payload
        $payload = @file_get_contents('php://input');
        $event = json_decode($payload);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Invalid JSON payload received.');
            return new WP_Error('invalid_payload', 'Invalid JSON payload received.', ['status' => 400]);
        }

        // Handle events
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

            case 'invoice.upcoming':
                self::handle_invoice_upcoming($event->data->object);
                break;

            default:
                error_log('Unhandled event type: ' . $event->type);
        }

        return rest_ensure_response(['success' => true]);
    }

    private static function handle_payment_succeeded($invoice) {
        global $wpdb;

        $subscription_id = $invoice->subscription;
        $last_payment_date = date('Y-m-d H:i:s', $invoice->status_transitions->paid_at);

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'active',
                'last_payment_date' => $last_payment_date,
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription_id]
        );

        error_log("Payment succeeded for subscription ID: $subscription_id");
    }

    private static function handle_payment_failed($invoice) {
        global $wpdb;
        $subscription_id = $invoice->subscription;

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'payment_failed',
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription_id]
        );

        error_log("Payment failed for subscription ID: $subscription_id");
    }

    private static function handle_subscription_created($subscription) {
        global $wpdb;

        if (!isset($subscription->id) || !isset($subscription->customer)) {
            error_log("Invalid subscription creation payload");
            return;
        }

        $plan_id = null;
        if (isset($subscription->items->data[0]->price->id)) {
            $plan_id = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}subscription_plans WHERE stripe_plan_id = %s",
                $subscription->items->data[0]->price->id
            ));
        }

        $wpdb->insert(
            "{$wpdb->prefix}subscriptions",
            [
                'user_id' => null,
                'plan_id' => $plan_id,
                'stripe_subscription_id' => $subscription->id,
                'status' => $subscription->status,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'payment_due_date' => date('Y-m-d H:i:s', strtotime($subscription->current_period_end)),
            ]
        );

        error_log("Subscription created: {$subscription->id}");
    }

    private static function handle_subscription_updated($subscription) {
        global $wpdb;

        $plan_id = null;
        if (isset($subscription->items->data[0]->price->id)) {
            $plan_id = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}subscription_plans WHERE stripe_plan_id = %s",
                $subscription->items->data[0]->price->id
            ));
        }

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => $subscription->status,
                'plan_id' => $plan_id,
                'payment_due_date' => date('Y-m-d H:i:s', strtotime($subscription->current_period_end)),
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription->id]
        );

        error_log("Subscription updated in database: {$subscription->id}");
    }

    private static function handle_subscription_deleted($subscription) {
        global $wpdb;

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'canceled',
                'cancelled_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription->id]
        );

        error_log("Subscription deleted: {$subscription->id}");
    }

    private static function handle_invoice_upcoming($invoice) {
        global $wpdb;

        $subscription_id = $invoice->subscription;
        $next_payment_date = date('Y-m-d H:i:s', $invoice->next_payment_attempt);

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'payment_due_date' => $next_payment_date,
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription_id]
        );

        error_log("Upcoming invoice for subscription ID: $subscription_id. Next payment date: $next_payment_date");
    }
}
