<?php

if (!defined('ABSPATH')) {
    exit;
}

class Stripe_Webhook_Handler {

    // Verify the Stripe webhook signature
    private static function verify_stripe_webhook_signature() {
        error_log('Verifying webhook signature');

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
            \Stripe\Webhook::constructEvent($payload, $stripe_signature, $endpoint_secret);
            error_log('Webhook signature verification successful');
            return true;
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            error_log('Stripe signature verification failed: ' . $e->getMessage());
            return false;
        }
    }

    public static function handle_webhook($request) {
        error_log('Stripe webhook handler triggered - START');
        error_log('Request details: ' . print_r($request, true));

        // Verify Stripe webhook signature before proceeding
        try {
            if (!self::verify_stripe_webhook_signature()) {
                error_log('Webhook signature verification failed');
                return new WP_Error('invalid_signature', 'Stripe signature verification failed', ['status' => 401]);
            }
        } catch (Exception $e) {
            error_log('Webhook verification error: ' . $e->getMessage());
            return new WP_Error('verification_error', $e->getMessage(), ['status' => 500]);
        }

        // Retrieve the payload
        $payload = @file_get_contents('php://input');
        error_log('Received webhook payload: ' . ($payload ?: 'None'));

        $event = json_decode($payload);
        error_log('Decoded event: ' . print_r($event, true));

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Invalid JSON payload received.');
            return new WP_Error('invalid_payload', 'Invalid JSON payload received.', ['status' => 400]);
        }

        // Handle events
        switch ($event->type) {
            case 'invoice.payment_succeeded':
                error_log('Handling event: invoice.payment_succeeded');
                self::handle_payment_succeeded($event->data->object);
                break;

            case 'invoice.payment_failed':
                error_log('Handling event: invoice.payment_failed');
                self::handle_payment_failed($event->data->object);
                break;

            case 'customer.subscription.created':
                error_log('Handling event: customer.subscription.created');
                self::handle_subscription_created($event->data->object);
                break;

            case 'customer.subscription.updated':
                error_log('Handling event: customer.subscription.updated');
                self::handle_subscription_updated($event->data->object);
                break;

            case 'customer.subscription.deleted':
                error_log('Handling event: customer.subscription.deleted');
                self::handle_subscription_deleted($event->data->object);
                break;

            default:
                error_log('Unhandled event type: ' . $event->type);
        }

        error_log('Stripe webhook handler completed');
        return rest_ensure_response(['success' => true]);
    }

    private static function handle_payment_succeeded($invoice) {
        global $wpdb;

        error_log('Handling payment succeeded for invoice: ' . print_r($invoice, true));

        $subscription_id = $invoice->subscription;
        $last_payment_date = date('Y-m-d H:i:s', strtotime($invoice->status_transitions->paid_at));

        $updated = $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => 'active',
                'last_payment_date' => $last_payment_date,
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription_id]
        );

        if ($updated === false) {
            error_log('Failed to update subscription after payment success: ' . $wpdb->last_error);
        } else {
            error_log("Payment succeeded for subscription ID: $subscription_id");
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

    private static function handle_subscription_created($subscription) {
        global $wpdb;

        error_log('Handling subscription created: ' . print_r($subscription, true));

        if (!isset($subscription->id) || !isset($subscription->customer)) {
            error_log("Invalid subscription creation payload");
            return;
        }

        $order_id = $subscription->metadata->order_id ?? null;
        $user_id = $subscription->metadata->user_id ?? null;

        if (!$order_id && !$user_id) {
            error_log("No WooCommerce order or user ID found in subscription metadata.");
            return;
        }

        $plan_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}subscription_plans WHERE stripe_plan_id = %s",
            $subscription->items->data[0]->price->id ?? ''
        ));
        error_log('Plan ID fetched: ' . ($plan_id ?: 'Not Found'));

        $wpdb->insert(
            "{$wpdb->prefix}subscriptions",
            [
                'user_id' => $user_id,
                'order_id' => $order_id,
                'plan_id' => $plan_id,
                'stripe_subscription_id' => $subscription->id,
                'status' => $subscription->status,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'payment_due_date' => date('Y-m-d H:i:s', strtotime($subscription->current_period_end)),
            ]
        );

        error_log("Subscription created in database for Subscription ID: {$subscription->id}");
    }

    private static function handle_subscription_updated($subscription) {
        global $wpdb;

        error_log('Handling subscription updated: ' . print_r($subscription, true));

        if (empty($subscription->id)) {
            error_log('Subscription updated event missing subscription ID.');
            return;
        }

        $plan_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}subscription_plans WHERE stripe_plan_id = %s",
            $subscription->items->data[0]->price->id ?? ''
        ));
        error_log('Plan ID fetched for update: ' . ($plan_id ?: 'Not Found'));

        $updated = $wpdb->update(
            "{$wpdb->prefix}subscriptions",
            [
                'status' => $subscription->status,
                'plan_id' => $plan_id,
                'payment_due_date' => date('Y-m-d H:i:s', $subscription->current_period_end),
                'updated_at' => current_time('mysql'),
            ],
            ['stripe_subscription_id' => $subscription->id]
        );

        if ($updated === false) {
            error_log('Failed to update subscription in database: ' . $wpdb->last_error);
        } else {
            $order_id = $wpdb->get_var($wpdb->prepare(
                "SELECT order_id FROM {$wpdb->prefix}subscriptions WHERE stripe_subscription_id = %s",
                $subscription->id
            ));
            if ($order_id) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $order->update_status('completed', 'Subscription updated in Stripe');
                    error_log("WooCommerce order updated for subscription: {$subscription->id}");
                }
            }
        }
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
                'canceled_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'cancel_type' => $cancellation_type,
            ],
            ['stripe_subscription_id' => $subscription->id]
        );

        if ($updated === false) {
            error_log('Failed to update subscription in database after cancellation: ' . $wpdb->last_error);
        } else {
            error_log("Subscription successfully marked as canceled: {$subscription->id}");
        }
    }
}
