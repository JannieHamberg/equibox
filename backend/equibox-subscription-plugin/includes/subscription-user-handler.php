<?php

require_once plugin_dir_path(__FILE__) . 'class-stripe-integration.php';

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


    /*public static function start_user_subscription($request) {
        $user_id = get_current_user_id();
        $plan_id = intval($request->get_param('plan_id'));
    
        if (!$user_id || !$plan_id) {
            return new WP_Error('missing_data', 'User ID and Plan ID are required.', ['status' => 400]);
        }
    
        global $wpdb;
    
        // Check if the plan exists in the subscription_plans table
        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ));
    
        if (!$plan) {
            return new WP_Error('invalid_plan', 'The selected subscription plan does not exist.', ['status' => 404]);
        }
    
        // Retrieve payment method ID from the request (for Stripe only)
        $payment_method_id = $request->get_param('payment_method_id');
    
        // Validation: Only ensure required data for Stripe
        if (!$plan->stripe_plan_id || !wp_get_current_user()->user_email || !wp_get_current_user()->display_name) {
            error_log("Missing Data for Subscription Creation:");
            error_log("Stripe Plan ID: " . ($plan->stripe_plan_id ?: 'Not provided'));
            error_log("User Email: " . (wp_get_current_user()->user_email ?: 'Not provided'));
            error_log("User Name: " . (wp_get_current_user()->display_name ?: 'Not provided'));
            return new WP_Error('missing_data', 'Required data for subscription creation is missing.', ['status' => 400]);
        }
    
        try {
            // Log starting subscription process
            error_log("Starting subscription for user: " . $user_id);
            error_log("Email: " . wp_get_current_user()->user_email);
            error_log("Name: " . wp_get_current_user()->display_name);
            error_log("Stripe Plan ID: " . $plan->stripe_plan_id);
            if ($payment_method_id) {
                error_log("Payment Method ID (Stripe): " . $payment_method_id);
            }
    
            // Create the subscription in Stripe
            $stripe_subscription = Stripe_Integration::create_stripe_subscription(
                wp_get_current_user()->user_email,
                wp_get_current_user()->display_name,
                $plan->stripe_plan_id,
                $payment_method_id // Used for Stripe
            );
    
            // Insert subscription into the custom database (Stripe-specific data is excluded)
            $wpdb->insert("{$wpdb->prefix}subscriptions", [
                'user_id' => $user_id,
                'plan_id' => $plan_id, // Refers to the ID in subscription_plans
                'status' => 'active',
                'stripe_subscription_id' => $stripe_subscription['stripe_subscription_id'], // From Stripe
                'description' => $plan->description,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'last_payment_date' => isset($stripe_subscription['last_payment_date']) 
                    ? date('Y-m-d H:i:s', $stripe_subscription['last_payment_date']) 
                    : null,
                'payment_due_date' => date('Y-m-d H:i:s', $stripe_subscription['current_period_end']),
            ]);
    
        } catch (Exception $e) {
            return new WP_Error('subscription_error', $e->getMessage(), ['status' => 500]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription created successfully!',
        ]);
    } */
    public static function start_user_subscription($request) {
        $user_id = get_current_user_id();
        $plan_id = intval($request->get_param('plan_id'));
    
        // Validate required parameters
        if (!$user_id || !$plan_id) {
            return new WP_Error('missing_data', 'User ID and Plan ID are required.', ['status' => 400]);
        }
    
        global $wpdb;
    
        // Check if the plan exists in the subscription_plans table
        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ));
    
        if (!$plan) {
            return new WP_Error('invalid_plan', 'The selected subscription plan does not exist.', ['status' => 404]);
        }
    
        // Extract parameters from the request
        $email = sanitize_text_field($request->get_param('email'));
        $name = sanitize_text_field($request->get_param('name'));
        $payment_method_id = sanitize_text_field($request->get_param('payment_method_id'));
    
        // Log the process
        error_log("Creating Stripe subscription for user: $user_id, plan: $plan->name");
    
        // Create the subscription on Stripe
        $stripe_subscription_data = Stripe_Integration::create_stripe_subscription(
            $email,
            $name,
            $plan->stripe_plan_id, // Pass the Stripe price ID
            $payment_method_id
        );
    
        if (is_wp_error($stripe_subscription_data)) {
            return $stripe_subscription_data; // Handle Stripe errors
        }
    
        // Extract Stripe subscription data
        $stripe_subscription_id = $stripe_subscription_data['stripe_subscription_id'] ?? null;
        $current_period_end = $stripe_subscription_data['current_period_end'] ?? null;
    
        if (!$stripe_subscription_id) {
            error_log('Failed to retrieve Stripe subscription ID.');
            return new WP_Error('stripe_error', 'Failed to retrieve Stripe subscription ID.', ['status' => 500]);
        }
    
        // Insert subscription into the custom database
        $wpdb->insert("{$wpdb->prefix}subscriptions", [
            'user_id' => $user_id,
            'plan_id' => $plan_id, // Refers to the ID in subscription_plans
            'status' => 'active',
            'stripe_subscription_id' => $stripe_subscription_id, // Stripe subscription ID
            'description' => $plan->description,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
            'payment_due_date' => date('Y-m-d H:i:s', $current_period_end), // Payment due date from Stripe
        ]);
    
        error_log("Subscription inserted into custom database for user: $user_id");
    
        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription created successfully!',
        ]);
    }


    public static function update_user_subscription($request) {
        error_log('Reached subscription update endpoint');
        error_log('Stripe Key Check: ' . (get_option('stripe_secret_key') ? 'Key exists' : 'No key found'));
        
        global $wpdb;
        $user_id = get_current_user_id();
        $plan_id = intval($request->get_param('plan_id'));

        if (!$user_id || !$plan_id) {
            return new WP_Error('missing_data', 'User ID and plan ID are required.', ['status' => 400]);
        }

        try {
            // Get current subscription
            $current_subscription = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}subscriptions WHERE user_id = %d",
                $user_id
            ));

            if (!$current_subscription) {
                return new WP_Error('no_subscription', 'No active subscription found.', ['status' => 404]);
            }

            // Get new plan details
            $new_plan = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
                $plan_id
            ));

            if (!$new_plan || empty($new_plan->stripe_plan_id)) {
                return new WP_Error('invalid_plan', 'The selected subscription plan does not exist.', ['status' => 404]);
            }

            error_log('Attempting to update Stripe subscription: ' . $current_subscription->stripe_subscription_id);
            error_log('New Stripe plan ID: ' . $new_plan->stripe_plan_id);

            try {
                // Initialize Stripe directly
                if (!defined('STRIPE_SECRET_KEY')) {
                    throw new Exception('Stripe secret key is not defined');
                }
                \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
                
                // Retrieve the subscription
                $stripe_subscription = \Stripe\Subscription::retrieve($current_subscription->stripe_subscription_id);
                
                // Check if subscription status is incomplete
                if ($stripe_subscription->status === 'incomplete') {
                    return new WP_Error(
                        'incomplete_subscription',
                        'Din prenumeration är för närvarande ofullständig. Vänligen betala din utestående faktura innan du uppdaterar din prenumeration.',
                        [
                            'status' => 400,
                            'subscription_status' => 'incomplete'
                        ]
                    );
                }
                
                // Continue with update if status is not incomplete
                $updated_subscription = \Stripe\Subscription::update(
                    $current_subscription->stripe_subscription_id,
                    [
                        'items' => [
                            [
                                'id' => $stripe_subscription->items->data[0]->id,
                                'price' => $new_plan->stripe_plan_id,
                            ],
                        ],
                        'proration_behavior' => 'always_invoice'
                    ]
                );

                error_log('Stripe subscription updated successfully');

                // Update local database
                $update_result = $wpdb->update(
                    "{$wpdb->prefix}subscriptions",
                    [
                        'plan_id' => $plan_id,
                        'updated_at' => current_time('mysql')
                    ],
                    ['user_id' => $user_id]
                );

                if ($update_result === false) {
                    error_log('Failed to update local database');
                    throw new Exception('Failed to update subscription in local database');
                }

                error_log('Local database updated successfully');

                return rest_ensure_response([
                    'success' => true,
                    'message' => 'Subscription updated successfully!'
                ]);

            } catch (\Stripe\Exception\ApiErrorException $e) {
                error_log('Stripe API Error: ' . $e->getMessage());
                
                // Check if the error is related to incomplete subscription
                if (strpos($e->getMessage(), 'incomplete') !== false) {
                    return new WP_Error(
                        'incomplete_subscription',
                        'Din prenumeration är för närvarande ofullständig. Vänligen betala din utestående faktura innan du uppdaterar din prenumeration.',
                        [
                            'status' => 400,
                            'subscription_status' => 'incomplete'
                        ]
                    );
                }
                
                return new WP_Error('stripe_error', 'Stripe API Error: ' . $e->getMessage(), ['status' => 500]);
            }

        } catch (Exception $e) {
            error_log('Subscription update error: ' . $e->getMessage());
            return new WP_Error('update_error', 'Failed to update subscription: ' . $e->getMessage(), ['status' => 500]);
        }
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
    
        // Cancel the subscription in Stripe
        try {
            Stripe_Integration::cancel_stripe_subscription($subscription->stripe_subscription_id);
        } catch (Exception $e) {
            error_log('Stripe cancellation error: ' . $e->getMessage());
            return new WP_Error('stripe_error', 'Failed to cancel subscription in Stripe.', ['status' => 500]);
        }
    
        // Mark subscription as canceled in the database
        $canceled = $wpdb->update(
            $table_name,
            [
                'status' => 'canceled',
                'cancelled_at' => current_time('mysql'),
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
        error_log('Reached subscriptions endpoint');
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
        $table_name = $wpdb->prefix . 'subscription_plans';
        
        $query = "SELECT `id`, `stripe_plan_id`, `name`, `price`, `interval`, 
                        `description`, `image_url`, `product_id`, `created_at` 
                 FROM `$table_name`";
        
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