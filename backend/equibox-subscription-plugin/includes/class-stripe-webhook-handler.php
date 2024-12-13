<?php

class Stripe_Webhook_Handler {

    public static function handle_webhook($request) {
        $webhook_secret = defined('STRIPE_WEBHOOK_SECRET') ? STRIPE_WEBHOOK_SECRET : '';

        if (empty($webhook_secret)) {
            return new WP_Error('missing_webhook_secret', 'Stripe webhook secret is not defined.', ['status' => 500]);
        }

        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sig_header, $webhook_secret
            );
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            error_log('Webhook signature verification failed: ' . $e->getMessage());
            return new WP_Error('invalid_signature', 'Invalid webhook signature.', ['status' => 400]);
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

            case 'checkout.session.completed':
                self::handle_checkout_completed($event->data->object);
                break;

            default:
                error_log('Unhandled event type: ' . $event->type);
        }

        return rest_ensure_response(['success' => true]);
    }

    private static function handle_payment_succeeded($invoice) {
        global $wpdb;
        $subscription_id = $invoice->subscription;

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            ['status' => 'active'],
            ['stripe_subscription_id' => $subscription_id]
        );

        error_log("Payment succeeded for subscription ID: $subscription_id");
    }

    private static function handle_payment_failed($invoice) {
        global $wpdb;
        $subscription_id = $invoice->subscription;

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            ['status' => 'payment_failed'],
            ['stripe_subscription_id' => $subscription_id]
        );

        error_log("Payment failed for subscription ID: $subscription_id");
    }

    private static function handle_subscription_created($subscription) {
        global $wpdb;

        $wpdb->insert(
            "{$wpdb->prefix}subscriptions",
            [
                'stripe_customer_id' => $subscription->customer,
                'stripe_subscription_id' => $subscription->id,
                'status' => $subscription->status,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        error_log("Subscription created: {$subscription->id}");
    }

    private static function handle_subscription_updated($subscription) {
        global $wpdb;

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            ['status' => $subscription->status, 'updated_at' => current_time('mysql')],
            ['stripe_subscription_id' => $subscription->id]
        );

        error_log("Subscription updated: {$subscription->id}");
    }

    private static function handle_subscription_deleted($subscription) {
        global $wpdb;

        $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            ['status' => 'canceled', 'updated_at' => current_time('mysql')],
            ['stripe_subscription_id' => $subscription->id]
        );

        error_log("Subscription deleted: {$subscription->id}");
    }

    private static function handle_invoice_upcoming($invoice) {
        error_log("Upcoming invoice for subscription ID: {$invoice->subscription}");
        //TODO: Additional logic for upcoming invoice
    }

    private static function handle_checkout_completed($session) {
        error_log("Checkout session completed: {$session->id}");
        // TODO: Additional logic for completed checkout
    }
}
