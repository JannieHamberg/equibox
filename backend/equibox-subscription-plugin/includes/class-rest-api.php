<?php

if (!defined('ARRAY_A')) {
    define('ARRAY_A', 1);
}

class REST_API {
    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        error_log('REST API Initialized');
    }

    public static function register_routes() {

            // Endpoint to fetch nonce
            register_rest_route(
                'equibox/v1',
                '/get_nonce',
                [
                    'methods' => 'GET',
                    'callback' => [__CLASS__, 'get_nonce'], 
                    'permission_callback' => '__return_true',
                ]
            );


        // Public endpoint to get all subscription plans
        register_rest_route(
            'equibox/v1',
            '/subscription_plans',
            [
                'methods' => 'GET',
                'callback' => ['Subscription_Handler', 'get_all_subscription_plans'],
                'permission_callback' => '__return_true', // Public access
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/add-to-cart',
            [
                'methods' => 'POST',
                'callback' => ['Woo_Integration', 'add_subscription_to_cart'],
                'permission_callback' => '__return_true', // Public access
            ]
        );
        

        // User registration route
        register_rest_route(
            'equibox/v1',
            '/register',
            [
                'methods' => 'POST',
                'callback' => ['Subscription_Handler', 'register_user'],
                'permission_callback' => '__return_true', //Public access
            ]
        );

        // User subscription creation route
        register_rest_route(
            'equibox/v1',
            '/subscribe',
            [
                'methods' => 'POST',
                'callback' => ['Subscription_Handler', 'start_user_subscription'],
                'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
            ]
        );

        // Existing user-specific routes
        register_rest_route(
            'equibox/v1',
            '/subscriptions',
            [
                'methods' => 'GET',
                'callback' => ['Subscription_Handler', 'get_user_subscription'],
                'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/subscriptions/update',
            [
                'methods' => 'PUT',
                'callback' => ['Subscription_Handler', 'update_user_subscription'],
                'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/subscriptions/cancel',
            [
                'methods' => 'PUT',
                'callback' => ['Subscription_Handler', 'cancel_user_subscription'],
                'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
            ]
        );

        // Admin-specific route
        register_rest_route(
            'equibox/v1',
            '/admin/subscriptions',
            [
                'methods' => 'GET',
                'callback' => ['Subscription_Handler', 'get_all_subscriptions'],
                'permission_callback' => [__CLASS__, 'check_admin_permissions'],
            ]
        );

        // Routes for products and boxes
        register_rest_route(
            'equibox/v1',
            '/products',
            [
                'methods' => 'GET',
                'callback' => ['Product_Handler', 'get_all_products'],
                'permission_callback' => '__return_true', //Public access
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/products',
            [
                'methods' => 'POST',
                'callback' => ['Product_Handler', 'add_product'],
                'permission_callback' => [__CLASS__, 'check_admin_permissions'], // Admin only
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/boxes/products',
            [
                'methods' => 'POST',
                'callback' => ['Box_Handler', 'assign_product_to_box'],
                'permission_callback' => [__CLASS__, 'check_admin_permissions'], // Admin only
            ]
        );

        register_rest_route('equibox/v1', '/categories', [
            'methods' => 'GET',
            'callback' => ['Product_Handler', 'get_all_categories'],
            'permission_callback' => '__return_true', //Public access
        ]);
        

        register_rest_route(
            'equibox/v1',
            '/boxes/products',
            [
                'methods' => 'GET',
                'callback' => ['Box_Handler', 'get_box_products'],
                'permission_callback' => '__return_true', //Public access
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/boxes/products/update',
            [
                'methods' => 'PUT',
                'callback' => ['Box_Handler', 'update_box_product'],
                'permission_callback' => [__CLASS__, 'check_admin_permissions'], // Admin only
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/admin/subscription_plans/(?P<id>\d+)/products',
            [
                'methods' => 'GET',
                'callback' => ['Subscription_Admin_Handler', 'get_subscription_plan_products'],
                'permission_callback' => [__CLASS__, 'check_admin_permissions'], // Admin only
            ]
        );

        register_rest_route(
            'equibox/v1',
            '/stripe-webhook',
            [
                'methods' => 'POST',
                'callback' => ['Stripe_Webhook_Handler', 'handle_webhook'],
                'permission_callback' => '__return_true', //Public access
            ]
        );

        // Add a subscription plan
        register_rest_route('equibox/v1', '/admin/subscription_plans/add', [
            'methods' => 'POST',
            'callback' => ['Subscription_Admin_Handler', 'add_subscription_plan'],
            'permission_callback' => function () {
                $user = wp_get_current_user();

                // Log user details for debugging
                error_log('User ID: ' . $user->ID);
                error_log('User capabilities: ' . print_r($user->allcaps, true));

                // Check if the user has the required capability
                if (!current_user_can('manage_options')) {
                    error_log('Permission denied for user ID: ' . $user->ID);
                    return false;
                }

                error_log('Permission granted for user ID: ' . $user->ID);
                return true;
            },
        ]);

        // Edit subscription plan
        register_rest_route('equibox/v1', '/admin/subscription_plans/edit', [
            'methods' => 'PUT',
            'callback' => ['Subscription_Admin_Handler', 'edit_subscription_plan'],
            'permission_callback' => function () {
                $user = wp_get_current_user();

                // Log user details for debugging
                error_log('User ID: ' . $user->ID);
                error_log('User capabilities: ' . print_r($user->allcaps, true));

                // Check if the user has the required capability
                if (!current_user_can('manage_options')) {
                    error_log('Permission denied for user ID: ' . $user->ID);
                    return false;
                }

                error_log('Permission granted for user ID: ' . $user->ID);
                return true;
            },
        ]);

        // Delete a subscription plan
        register_rest_route('equibox/v1', '/admin/subscription_plans/delete', [
            'methods' => 'DELETE',
            'callback' => ['Subscription_Admin_Handler', 'delete_subscription_plan'],
            'permission_callback' => function () {
                $user = wp_get_current_user();

                // Log user details for debugging
                error_log('User ID: ' . $user->ID);
                error_log('User capabilities: ' . print_r($user->allcaps, true));

                // Check if the user has the required capability
                if (!current_user_can('manage_options')) {
                    error_log('Permission denied for user ID: ' . $user->ID);
                    return false;
                }

                error_log('Permission granted for user ID: ' . $user->ID);
                return true;
            },
        ]);
      
    }
    // Permission callbacks
    public static function check_logged_in_permissions() {
        return is_user_logged_in(); // Allow only logged in users
    }

    public static function check_admin_permissions() {
        if (!is_user_logged_in() || !current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', 'Access denied.', ['status' => 403]);
        }
        return true;
    }
    
    // Generate and return a nonce for frontend API requests
    public static function get_nonce() {
        return rest_ensure_response([
            'wp_rest_nonce' => wp_create_nonce('wp_rest'),
            'wc_store_api_nonce' => wp_create_nonce('wc_store_api'),
        ]);
    }
    
    
}
