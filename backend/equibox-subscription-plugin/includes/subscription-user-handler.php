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

     //start subscriptio
    public static function start_user_subscription($request) {
        $user_id = get_current_user_id(); 
        $plan_id = intval($request->get_param('plan_id')); // Plan ID from the frontend
    
        if (!$user_id || !$plan_id) {
            return new WP_Error('missing_data', 'User ID and Plan ID are required.', ['status' => 400]);
        }
    
        global $wpdb;
        $table_name = $wpdb->prefix . 'subscriptions';
    
        // Check if the plan exists in the subscription_plans table
        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d", $plan_id
        ));
    
        if (!$plan) {
            return new WP_Error('invalid_plan', 'The selected subscription plan does not exist.', ['status' => 404]);
        }
    
        // Add a new subscription
        $inserted = $wpdb->insert($table_name, [
            'user_id' => $user_id,
            'plan_id' => $plan_id,
            'status' => 'active',
            'description' => 'New subscription',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);
    
        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to create subscription.', ['status' => 500]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription started successfully!',
            'data' => [
                'user_id' => $user_id,
                'plan_id' => $plan_id,
                'status' => 'active',
            ],
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

    // Fetch the user's current subscription
    public static function get_user_subscription($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return new WP_Error('not_logged_in', 'You must be logged in to view subscriptions.', ['status' => 401]);
        }
        
        // Join wpct_subscriptions and wpct_subscription_plans tables
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT 
                s.id, 
                s.user_id, 
                s.plan_id, 
                s.status, 
                s.description, 
                s.created_at, 
                s.updated_at, 
                p.name, 
                p.price, 
                p.interval
             FROM {$wpdb->prefix}subscriptions s
             JOIN {$wpdb->prefix}subscription_plans p ON s.plan_id = p.id
             WHERE s.user_id = %d",
            $user_id
        ), ARRAY_A);
        
        if (empty($results)) {
            return new WP_Error('no_subscription', 'No subscriptions found for the user.', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => $results,
        ]);
    }        
    

    

    // Get all subscription plans (public)
    public static function get_all_subscription_plans($request) {
        global $wpdb;
    
        // Ensure table name is prefixed properly
        $table_name = $wpdb->prefix . 'subscription_plans';
        error_log("Fetching data from table: " . $table_name);
    
        // Safe SQL query with backticks
        $query = "SELECT `id`, `name`, `price`, `interval`, `description`, `image_url` FROM `$table_name`";
        $plans = $wpdb->get_results($query, ARRAY_A);
    
        // Check for errors
        if ($wpdb->last_error) {
            error_log("Database Error: " . $wpdb->last_error);
            return new WP_Error('db_error', 'Failed to fetch subscription plans.', ['status' => 500]);
        }
    
        // Check if plans are empty
        if (empty($plans)) {
            return new WP_Error('no_plans', 'No subscription plans found.', ['status' => 404]);
        }

        // Log fetched plans
        error_log('Fetched Plans: ' . print_r($plans, true));
    
        return rest_ensure_response([
            'success' => true,
            'data' => $plans,
        ]);
    }
    

}
