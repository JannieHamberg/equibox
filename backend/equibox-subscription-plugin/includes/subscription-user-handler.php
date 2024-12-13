<?php

class Subscription_Handler {

    // Register a new user
    public static function register_user($request) {
        $email = sanitize_email($request->get_param('email'));
        $username = sanitize_text_field($request->get_param('username'));
        $password = sanitize_text_field($request->get_param('password'));

        // Validate inputs
        if (!$email || !$username || !$password) {
            return new WP_Error('missing_data', 'Email, username, and password are required.', ['status' => 400]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new WP_Error('invalid_email', 'Invalid email format.', ['status' => 400]);
        }

        if (strlen($password) < 8) {
            return new WP_Error('weak_password', 'Password must be at least 8 characters long.', ['status' => 400]);
        }

        if (strlen($username) < 3 || strlen($username) > 30) {
            return new WP_Error('invalid_username', 'Username must be between 3 and 30 characters.', ['status' => 400]);
        }

        if (email_exists($email) || username_exists($username)) {
            return new WP_Error('user_exists', 'A user with this email or username already exists.', ['status' => 400]);
        }

        // Create user
        $user_id = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'User registered successfully!',
            'user_id' => $user_id,
        ]);
    }

    // Add a new subscription plan
    public static function add_subscription_plan($request) {
        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'add_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }
        
        $plan_name = sanitize_text_field($request->get_param('name'));
        $plan_price = floatval($request->get_param('price'));
        $interval = sanitize_text_field($request->get_param('interval')); 
        $description = sanitize_textarea_field($request->get_param('description'));


        // Validate inputs
        if (!$plan_name || !$plan_price || !$interval) {
            return new WP_Error('missing_data', 'Name, price, and interval are required.', ['status' => 400]);
        }

        // Add plan to Stripe
        try {
            $stripe_plan = \Stripe\Price::create([
                'unit_amount' => $plan_price * 100,
                'currency' => 'sek',
                'recurring' => ['interval' => $interval],
                'product_data' => ['name' => $plan_name],
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return new WP_Error('stripe_error', 'Failed to create plan in Stripe: ' . $e->getMessage(), ['status' => 500]);
        }

        // Add plan to MySQL database
        global $wpdb;
        $inserted = $wpdb->insert(
            "{$wpdb->prefix}subscription_plans",
            [
                'name' => $plan_name,
                'price' => $plan_price,
                'interval' => $interval,
                'stripe_plan_id' => $stripe_plan->id,
                'description' => $description,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to insert subscription plan into the database.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription plan added successfully!',
        ]);
    }

        // Update user subscription
    public static function update_user_subscription($request) {
        $user_id = get_current_user_id();
        $plan_id = intval($request->get_param('plan_id'));

        // Validate inputs
        if (!$user_id || !$plan_id) {
            return new WP_Error('missing_data', 'User ID and new plan ID are required.', ['status' => 400]);
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'subscriptions';

        // Check if subscription exists
        $subscription = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE user_id = %d", $user_id)
        );
        if (!$subscription) {
            return new WP_Error('no_subscription', 'No active subscription found.', ['status' => 404]);
        }

        // Update the subscription
        $updated = $wpdb->update(
            $table_name,
            [
                'plan_id' => $plan_id,
                'updated_at' => current_time('mysql'),
            ],
            ['user_id' => $user_id]
        );

        if ($updated === false) {
            return new WP_Error('update_failed', 'Failed to update subscription.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription updated successfully!',
        ]);
    }

    // Cancel user subscription
    public static function cancel_user_subscription($request) {
        $user_id = get_current_user_id();

        if (!$user_id) {
            return new WP_Error('not_logged_in', 'You must be logged in to cancel subscriptions.', ['status' => 401]);
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'subscriptions';

        // Check if subscription exists
        $subscription = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE user_id = %d", $user_id)
        );
        if (!$subscription) {
            return new WP_Error('no_subscription', 'No active subscription found.', ['status' => 404]);
        }

        if ($subscription->status === 'canceled') {
            return new WP_Error('already_canceled', 'This subscription is already canceled.', ['status' => 400]);
        }

        // Mark subscription as canceled
        $canceled = $wpdb->update(
            $table_name,
            [
                'status' => 'canceled',
                'updated_at' => current_time('mysql'),
            ],
            ['user_id' => $user_id]
        );

        if ($canceled === false) {
            return new WP_Error('cancel_failed', 'Failed to cancel subscription.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription canceled successfully!',
        ]);
    }
}
