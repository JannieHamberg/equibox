<?php

if (!defined('ARRAY_A')) {
    define('ARRAY_A', 1);
}

require_once __DIR__ . '/client-secret-handler.php';
require_once __DIR__ . '/class-stripe-integration.php';
require_once __DIR__ . '/class-stripe-webhook-handler.php';
require_once __DIR__ . '/class-product-handler.php';
require_once __DIR__ . '/class-box-handler.php';
require_once __DIR__ . '/subscription-admin-handler.php';
require_once __DIR__ . '/subscription-user-handler.php';
require_once __DIR__ . '/class-mailpoet-handler.php';

error_log('Stripe_Integration class file loaded.');

// Ensure Stripe_Integration class is initialized
if (class_exists('Stripe_Integration')) {
    Stripe_Integration::init(); 
    error_log('Stripe_Integration class initialized.');
} else {
    error_log('Stripe_Integration class does not exist!');
}

    class REST_API {
    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        error_log('REST API Initialized');
        
        add_filter('jwt_auth_token_before_dispatch', [__CLASS__, 'validate_jwt_from_cookie'], 10, 2);
        error_log("JWT validation filter added");
    }

    public static function validate_jwt_from_cookie($token, $user) {
        error_log('JWT validation initiated.');
    
        
        if (empty($token) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = sanitize_text_field(str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']));
            error_log('JWT token retrieved from Authorization header: ' . $token);
        } elseif (empty($token)) {
            error_log('Authorization header is empty. Token not found.');
        }
    
        return $token;
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

        // Create Stripe subscription 
        register_rest_route(
            'stripe/v1',
            '/create-subscription',
            [
                'methods' => 'POST',
                'callback' => [Stripe_Integration::class, 'handle_create_subscription'], 
                'permission_callback' => [__CLASS__, 'check_logged_in_permissions'], 
               
            ]
        );

        register_rest_route('stripe/v1', '/get-or-create-customer', [
            'methods' => 'POST',
            'callback' => [Stripe_Integration::class, 'get_or_create_customer_endpoint'], 
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'], 
        ]);
        
        
        // Handle Stripe webhook events
        register_rest_route(
            'equibox/v1',
            '/stripe-webhook',
            [
                'methods' => 'POST',
                'callback' => ['Stripe_Webhook_Handler', 'handle_webhook'],
                'permission_callback' => '__return_true',
            ]
        );

        register_rest_route('stripe/v1', '/create-payment-intent', [
            'methods' => 'POST',
            'callback' => ['Stripe_Integration', 'handle_create_payment_intent'],
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],

        ]);

        register_rest_route('stripe/v1', '/get-customer-id', [
            'methods' => 'GET',
            'callback' => [Stripe_Integration::class, 'get_customer_id'],
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'], 

        ]);

        
        register_rest_route('stripe/v1', '/create-client-secret',[
            'methods' => 'POST',
            'callback' => 'handle_create_client_secret',
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'], 
          

        ]);

        register_rest_route('stripe/v1', '/attach-payment-method', [
            'methods' => 'POST',
            'callback' => [Stripe_Integration::class, 'attach_payment_method'], 
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
        ]);
      
        
     /*    register_rest_route('stripe/v1', '/cancel-subscription', [
            'methods' => 'POST',
            'callback' => [Stripe_Integration::class, 'cancel_subscription'],
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
        ]);

        register_rest_route('stripe/v1', '/retrieve-subscription', [
            'methods' => 'GET',
            'callback' => [Stripe_Integration::class, 'retrieve_subscription'],
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
        ]);
        
        register_rest_route('stripe/v1', '/update-subscription', [
            'methods' => 'POST',
            'callback' => [Stripe_Integration::class, 'update_subscription'],
            'permission_callback' => [__CLASS__, 'check_logged_in_permissions'],
        ]);
         */
        



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

        // Mailpoet newsletter subscriber route
       
            register_rest_route('custom-mailpoet/v1', '/add-subscriber', [
                'methods' => 'POST',
                'callback' => ['MailPoet_Subscriber_Handler', 'add_subscriber'],
                'permission_callback' => '__return_true',
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


    
}
