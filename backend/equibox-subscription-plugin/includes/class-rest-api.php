<?php

if (!defined('ARRAY_A')) {
    define('ARRAY_A', 1);
}

class REST_API {
    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function register_routes() {
        // User registration route
        register_rest_route(
            'equibox/v1',
            '/register',
            [
                'methods' => 'POST',
                'callback' => ['Subscription_Handler', 'register_user'],
                'permission_callback' => '__return_true', // No login required
            ]
        );

        // User subscription creation route
        register_rest_route(
            'equibox/v1',
            '/subscribe',
            [
                'methods' => 'POST',
                'callback' => ['Subscription_Handler', 'subscribe_user'],
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
                'permission_callback' => '__return_true', // Allow anyone to view
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

        register_rest_route(
            'equibox/v1',
            '/boxes/products',
            [
                'methods' => 'GET',
                'callback' => ['Box_Handler', 'get_box_products'],
                'permission_callback' => '__return_true', // Allow anyone to view
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
        
        
    }

    // Permission callbacks
    public static function check_logged_in_permissions() {
        return is_user_logged_in(); // Allow only logged-in users
    }

    public static function check_admin_permissions() {
        if (!is_user_logged_in() || !current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', 'Access denied.', ['status' => 403]);
        }
        return true;
    }
    

    


    
    
    
}
