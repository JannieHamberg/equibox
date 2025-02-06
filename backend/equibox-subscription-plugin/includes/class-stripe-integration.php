<?php

class Stripe_Integration {
    public static function init() {
        error_log("Stripe_Integration init method called");

        // Ensure Stripe SDK is loaded
        require_once __DIR__ . '/../vendor/autoload.php'; 
        error_log("Stripe SDK loaded successfully in stripe integration");
    }

    public static function create_stripe_subscription($email, $name, $stripe_plan_id, $payment_method = 'card', $payment_method_id = null, $billing_details = null) {
        error_log('Stripe_Integration::create_stripe_subscription called.');
        
        try {
            self::set_stripe_api_key();
    
            // Get or create customer
            $customer_id = self::get_or_create_customer($email, $name);
            if (!$customer_id || !preg_match('/^cus_[A-Za-z0-9]+$/', $customer_id)) {
                error_log("Invalid or missing customer ID: " . print_r($customer_id, true));
                return new WP_Error('invalid_customer', 'Invalid customer ID', ['status' => 400]);
            }
    
            error_log("Customer ID: " . $customer_id);
    
            // Validate and attach payment method if applicable
            if ($payment_method_id) {
                if (!preg_match('/^pm_[A-Za-z0-9]+$/', $payment_method_id)) {
                    error_log("Invalid payment method ID format: " . $payment_method_id);
                    return new WP_Error('invalid_request', 'Invalid payment method ID format.', ['status' => 400]);
                }
    
                try {
                    $payment_method = \Stripe\PaymentMethod::retrieve($payment_method_id);
                    $payment_method->attach(['customer' => $customer_id]);
    
                    \Stripe\Customer::update($customer_id, [
                        'invoice_settings' => ['default_payment_method' => $payment_method_id]
                    ]);
                } catch (\Exception $e) {
                    error_log('Error attaching payment method: ' . $e->getMessage());
                    return new WP_Error('stripe_error', 'Failed to attach payment method.', ['status' => 400]);
                }
            }
    
            // Validate plan ID
            if (!$stripe_plan_id || !preg_match('/^price_[A-Za-z0-9]+$/', $stripe_plan_id)) {
                error_log("Invalid stripe_plan_id: " . $stripe_plan_id);
                return new WP_Error('invalid_request', 'Invalid stripe_plan_id.', ['status' => 400]);
            }
    
            // Create subscription
            $subscription_data = [
                'customer' => $customer_id,
                'items' => [['price' => $stripe_plan_id]],
                'payment_behavior' => 'default_incomplete',
                'payment_settings' => ['save_default_payment_method' => 'on_subscription'],
                'expand' => ['latest_invoice.payment_intent'],
                'metadata' => ['user_email' => $email]
            ];
    
            $subscription = \Stripe\Subscription::create($subscription_data);
    
            return [
                'stripe_subscription_id' => $subscription->id,
                'client_secret' => $subscription->latest_invoice->payment_intent->client_secret,
                'status' => $subscription->status,
                'current_period_end' => $subscription->current_period_end
            ];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            return new WP_Error('stripe_error', 'Failed to create subscription: ' . $e->getMessage(), ['status' => 400]);
        } catch (\Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            return new WP_Error('general_error', 'An unexpected error occurred: ' . $e->getMessage(), ['status' => 500]);
        }
    }
    
    
    function handle_create_client_secret($request) {
        error_log("handle_create_client_secret endpoint called.");
    
        // Ensure Stripe SDK is loaded
        require_once __DIR__ . '/../vendor/autoload.php'; 
        error_log("Stripe SDK loaded in create-client-secret endpoint");
    
        // Set Stripe API key
        $stripe_secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        if (empty($stripe_secret_key)) {
            error_log("Stripe secret key is missing");
            return new WP_Error('stripe_key_error', 'Stripe secret key is not configured.', ['status' => 500]);
        }
        \Stripe\Stripe::setApiKey($stripe_secret_key);
    
        // Parse input
        $params = $request->get_json_params();
        error_log("Request Body: " . print_r($params, true));
    
        // Validate and sanitize `amount`
        if (empty($params['amount']) || !is_numeric($params['amount']) || intval($params['amount']) <= 0) {
            error_log("Invalid amount provided: " . $params['amount']);
            return new WP_Error('invalid_request', 'Amount must be a positive integer.', ['status' => 400]);
        }
        $amount = intval($params['amount']);
    
        // Validate and sanitize `customer_id`
        if (empty($params['customer_id'])) {
            error_log("Missing customer_id in create-client-secret request.");
            return new WP_Error('invalid_request', 'customer_id is required', ['status' => 400]);
        }
        if (is_array($params['customer_id']) && isset($params['customer_id']['id'])) {
            $customer_id = sanitize_text_field($params['customer_id']['id']);
        } else {
            $customer_id = sanitize_text_field($params['customer_id']);
        }
    
        if (!preg_match('/^cus_[A-Za-z0-9]+$/', $customer_id)) {
            error_log("Invalid customer_id format: " . $customer_id);
            return new WP_Error('invalid_request', 'Invalid customer_id format.', ['status' => 400]);
        }
    
        // Validate and sanitize `payment_method_id`
        $payment_method_id = isset($params['payment_method_id']) ? sanitize_text_field($params['payment_method_id']) : null;
        if ($payment_method_id && !preg_match('/^pm_[A-Za-z0-9]+$/', $payment_method_id)) {
            error_log("Invalid payment_method_id format: " . $payment_method_id);
            return new WP_Error('invalid_request', 'Invalid payment_method_id format.', ['status' => 400]);
        }
    
        try {
            // Create PaymentIntent
            $intent_params = [
                'amount' => $amount,
                'currency' => 'sek',
                'customer' => $customer_id,
                'payment_method_types' => ['card'],
                'setup_future_usage' => 'off_session',
                'confirm' => false,
                'metadata' => [
                    'customer_id' => $customer_id,
                    'email' => sanitize_email($params['email'] ?? ''),
                ],
            ];
    
            if (!empty($payment_method_id)) {
                $intent_params['payment_method'] = $payment_method_id;
            }
    
            $intent = \Stripe\PaymentIntent::create($intent_params);
            error_log("Stripe PaymentIntent Created: " . $intent->id);
    
            return rest_ensure_response([
                'clientSecret' => $intent->client_secret,
                'paymentIntentId' => $intent->id,
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        } catch (Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            return new WP_Error('general_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    
    
    
        private static function set_stripe_api_key() {
            $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
            error_log('Stripe API Key Set Successfully');
            if (!$secret_key) {
                throw new Exception('Stripe secret key is not defined.');
            }
            \Stripe\Stripe::setApiKey($secret_key);
        }

        public static function get_or_create_customer_endpoint(WP_REST_Request $request) {
            try {
                $body = json_decode($request->get_body(), true);
                $email = sanitize_email($body['email'] ?? '');
                $name = sanitize_text_field($body['name'] ?? '');
    
                if (empty($email) || empty($name)) {
                    return new WP_Error('invalid_data', 'Email and Name are required.', ['status' => 400]);
                }
    
                $stripe_customer_id = self::get_or_create_customer($email, $name);
                return rest_ensure_response(['stripe_customer_id' => $stripe_customer_id]);
            } catch (Exception $e) {
                error_log("Error: " . $e->getMessage());
                return new WP_Error('server_error', $e->getMessage(), ['status' => 500]);
            }
        }
    

        public static function get_or_create_customer($email, $name) {
            error_log("get_or_create_customer called for email: $email, name: $name");
        
            try {
                self::set_stripe_api_key();
        
                // Search for the customer in Stripe by email
                $customers = \Stripe\Customer::all([
                    'email' => $email,
                    'limit' => 1
                ]);
        
                error_log("Search results for customer with email $email: " . count($customers->data));
        
                // Check if customer exists
                if (count($customers->data) > 0) {
                    $customer = $customers->data[0];
                    error_log("Found existing customer: {$customer->id}");
                    
                    // Update customer details if needed
                    if ($customer->name !== $name) {
                        \Stripe\Customer::update($customer->id, [
                            'name' => $name
                        ]);
                        error_log("Updated customer name to: $name");
                    }
        
                    return $customer->id; //  Return only the customer ID
                }
        
                // If no customer exists, create a new one
                $customer = \Stripe\Customer::create([
                    'email' => $email,
                    'name' => $name,
                ]);
                error_log("Created new customer: {$customer->id}");
        
                return $customer->id; 
        
            } catch (\Exception $e) {
                error_log("Error in get_or_create_customer: " . $e->getMessage());
                throw $e;
            }
        }
        
        
        
    

    public static function handle_payment_intent(WP_REST_Request $request) {
        $email = sanitize_text_field($request->get_param('email'));
        $name = sanitize_text_field($request->get_param('name'));
        $amount = intval($request->get_param('amount'));
        $currency = sanitize_text_field($request->get_param('currency'));
        $payment_method_id = sanitize_text_field($request->get_param('payment_method_id'));
    
        try {
            // Validate required parameters
            if (empty($amount) || empty($currency) || empty($payment_method_id)) {
                throw new Exception('Missing required payment intent parameters.');
            }
    
            // Set Stripe API key
            self::set_stripe_api_key();
    
            // Create or retrieve customer
            $customer_id = self::get_or_create_customer($email, $name);
    
            // Create a payment intent
            $payment_intent = \Stripe\PaymentIntent::create([
                'amount' => $amount,
                'currency' => $currency,
                'customer' => $customer_id,
                'payment_method' => $payment_method_id,
                'off_session' => true,
                'confirm' => true,
            ]);
    
            error_log('PaymentIntent created successfully: ' . $payment_intent->id);
    
            return rest_ensure_response(['payment_intent' => $payment_intent]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 500]);
        } catch (Exception $e) {
            error_log('General Stripe Error: ' . $e->getMessage());
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    
/*     private static function attach_payment_method_to_customer($payment_method_id, $customer_id) {
        try {
            $payment_method = \Stripe\PaymentMethod::retrieve($payment_method_id);
            $payment_method->attach(['customer' => $customer_id]);

            // Set the payment method as the default
            \Stripe\Customer::update($customer_id, [
                'invoice_settings' => ['default_payment_method' => $payment_method_id],
            ]);

        } catch (\Stripe\Exception\ApiErrorException $e) {
            throw new Exception('Error attaching payment method: ' . $e->getMessage());
        }
    } */

    public static function attach_payment_method($request) {
        $params = $request->get_json_params();
        $customer_id = $params['customer_id'];
        $payment_method_id = $params['payment_method_id'];
    
        if (!$customer_id || !$payment_method_id) {
            return new WP_Error('invalid_request', 'Missing customer_id or payment_method_id.', ['status' => 400]);
        }
    
        try {
            $payment_method = \Stripe\PaymentMethod::retrieve($payment_method_id);
            $payment_method->attach(['customer' => $customer_id]);
    
            // Set as default payment method
            \Stripe\Customer::update($customer_id, [
                'invoice_settings' => ['default_payment_method' => $payment_method_id],
            ]);

            error_log('Payment method attached to customer: ' . $payment_method_id);

    
            return rest_ensure_response(['message' => 'Payment method attached successfully.']);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            return new WP_Error('stripe_error', 'Failed to attach the payment method.', ['status' => 500]);
        } catch (Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            return new WP_Error('general_error', 'An unexpected error occurred. Please try again.', ['status' => 500]);
        }
    }
    
    public static function handle_create_subscription(WP_REST_Request $request) {
        $params = $request->get_json_params();
        error_log('Received parameters: ' . print_r($params, true));
    
        // Validate and sanitize inputs
        $email = sanitize_email($params['email']);
        $name = sanitize_text_field($params['name']);
        $stripe_plan_id = sanitize_text_field($params['stripe_plan_id']);
        $payment_method = sanitize_text_field($params['payment_method']);
        $customer_id = sanitize_text_field($params['customer_id']);
    
        if (!$email || !$name || !$stripe_plan_id || !$payment_method || !$customer_id) {
            return new WP_Error('invalid_request', 'Missing required parameters.', ['status' => 400]);
        }
    
        try {
            if ($payment_method === 'card') {
                $payment_method_id = sanitize_text_field($params['payment_method_id']);
                if (!preg_match('/^pm_[A-Za-z0-9]+$/', $payment_method_id)) {
                    return new WP_Error('invalid_request', 'Invalid payment method ID format.', ['status' => 400]);
                }
            }
    
            $billing_details = null;
            if ($payment_method === 'invoice') {
                $billing_details = $params['billing_details'] ?? null;
                if (!$billing_details || !is_array($billing_details)) {
                    return new WP_Error('invalid_request', 'Billing details required for invoice payments.', ['status' => 400]);
                }
            }
    
            // Call the actual function to create a subscription
            $result = self::create_stripe_subscription(
                $email, $name, $stripe_plan_id, $payment_method,
                $payment_method === 'card' ? $payment_method_id : null,
                $billing_details
            );
    
            return rest_ensure_response($result);
        } catch (Exception $e) {
            error_log('Error in handle_create_subscription: ' . $e->getMessage());
            return new WP_Error('subscription_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    


    public static function update_stripe_subscription($stripe_subscription_id, $plan_id) {
        global $wpdb;

        error_log("Updating Stripe subscription: $stripe_subscription_id for Plan ID: $plan_id");

        // Fetch the stripe_plan_id for the given plan_id
        $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
            "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ));
        error_log("Fetched Stripe Plan ID for Plan ID $plan_id: " . ($stripe_plan_id ?: 'Not Found'));

        if (empty($stripe_plan_id)) {
            throw new Exception("No Stripe plan ID found for plan ID: $plan_id");
        }

        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        error_log('Stripe Secret Key: ' . ($secret_key ? 'Loaded' : 'Missing'));

        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);
            error_log("Retrieved subscription: " . print_r($subscription, true));

            // Update subscription items with the new plan
            $updated_subscription = \Stripe\Subscription::update(
                $stripe_subscription_id,
                [
                    'items' => [
                        [
                            'id' => $subscription->items->data[0]->id,
                            'price' => $stripe_plan_id,
                        ],
                    ],
                    'proration_behavior' => 'create_prorations',
                ]
            );

            error_log("Stripe subscription updated: $stripe_subscription_id");

            // Update database
            $updated = $wpdb->update(
                "{$wpdb->prefix}subscriptions",
                [
                    'plan_id' => $plan_id,
                    'updated_at' => current_time('mysql'),
                ],
                ['stripe_subscription_id' => $stripe_subscription_id]
            );

            if ($updated === false) {
                error_log("Failed to update database for subscription ID: $stripe_subscription_id. DB Error: " . $wpdb->last_error);
            }

            return $updated_subscription;

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Stripe API Error during subscription update: " . $e->getMessage());
            throw new Exception("Failed to update subscription: " . $e->getMessage());
        }
    }

    public static function cancel_stripe_subscription($stripe_subscription_id, $cancel_at_period_end = false) {
        error_log("Cancelling Stripe subscription: $stripe_subscription_id. Cancel at period end: " . ($cancel_at_period_end ? 'Yes' : 'No'));

        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
        error_log('Stripe Secret Key: ' . ($secret_key ? 'Loaded' : 'Missing'));

        if (empty($secret_key)) {
            throw new Exception('Stripe secret key is not defined in wp-config.php');
        }

        \Stripe\Stripe::setApiKey($secret_key);

        try {
            $subscription = \Stripe\Subscription::retrieve($stripe_subscription_id);
            error_log("Retrieved subscription: " . print_r($subscription, true));

            // Cancel subscription
            $subscription->cancel(['at_period_end' => $cancel_at_period_end]);
            error_log("Stripe subscription canceled successfully: $stripe_subscription_id");

            // Update database
            global $wpdb;
            $updated = $wpdb->update(
                "{$wpdb->prefix}subscriptions",
                [
                    'status' => 'canceled',
                    'canceled_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                ],
                ['stripe_subscription_id' => $stripe_subscription_id]
            );

            if ($updated === false) {
                error_log("Failed to update database for canceled subscription ID: $stripe_subscription_id. DB Error: " . $wpdb->last_error);
            }

            return true;

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Stripe API Error during subscription cancellation: " . $e->getMessage());
            throw new Exception("Failed to cancel subscription: " . $e->getMessage());
        }
    }

    private static function get_customer_by_email($email) {
        error_log("Fetching customer by email: $email");
        try {
            $customers = \Stripe\Customer::all(['email' => $email]);
            error_log("Retrieved customers: " . print_r($customers, true));
            return count($customers->data) > 0 ? $customers->data[0] : null;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log("Error fetching Stripe customer by email: " . $e->getMessage());
            return null;
        }
    }

/*     function get_customer_id() {
        error_log('get_customer_id called');
        $user_id = get_current_user_id();
        error_log('current_user_id: ' . $user_id);
    
        if (!$user_id) {
            return new WP_Error('unauthorized', 'User not logged in.', ['status' => 401]);
        }
    
        $stripe_customer_id = get_user_meta($user_id, 'stripe_customer_id', true);
        error_log('stripe_customer_id: ' . ($stripe_customer_id ?: 'not found'));
    
        if (!$stripe_customer_id) {
            return new WP_Error('not_found', 'Stripe customer ID not found.', ['status' => 404]);
        }
    
        return [
            'stripe_customer_id' => $stripe_customer_id,
        ];
    } */

    public static function get_customer_id(WP_REST_Request $request) {
        error_log("get_customer_id called");
    
        // Check if Stripe secret key is defined
        if (!defined('STRIPE_SECRET_KEY') || empty(STRIPE_SECRET_KEY)) {
            error_log("Stripe secret key not defined");
            return new WP_Error('stripe_key_missing', 'Stripe secret key is not configured.', ['status' => 500]);
        }
    
        // Get current user ID
        $user_id = get_current_user_id();
        if (!$user_id) {
            error_log("User not logged in");
            return new WP_Error('unauthorized', 'User not logged in.', ['status' => 401]);
        }
    
        // Get user's email and name
        $user = wp_get_current_user();
        $user_email = $user->user_email;
        $user_name = $user->display_name;
    
        try {
            // Initialize Stripe with the secret key
            \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    
            // Search for the customer in Stripe by email
            $customers = \Stripe\Customer::all([
                'email' => $user_email,
                'limit' => 1
            ]);
    
            // Check if customer exists
            if (count($customers->data) === 0) {
                // Customer doesn't exist, create a new one
                $customer = \Stripe\Customer::create([
                    'email' => $user_email,
                    'name' => $user_name
                ]);
    
                $stripe_customer_id = $customer->id;
                error_log("New Stripe customer created: $stripe_customer_id");
            } else {
                // Customer exists, retrieve their ID
                $stripe_customer_id = $customers->data[0]->id;
                error_log("Stripe customer ID retrieved: $stripe_customer_id");
            }
    
            // Add this check right after getting the customer_id
            global $wpdb;
            $existing_db_subscription = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}subscriptions 
                 WHERE user_id = %d 
                 AND status = 'active'",
                get_current_user_id()
            ));

            if ($existing_db_subscription) {
                error_log("Found existing active subscription in database for user " . get_current_user_id());
                throw new Exception('You already have an active subscription.');
            }
    
            // Return response with the customer ID
            return rest_ensure_response(['stripe_customer_id' => $stripe_customer_id]);
    
        } catch (\Stripe\Exception\ApiErrorException $e) {
            // Handle Stripe API errors
            error_log("Stripe API error: " . $e->getMessage());
            return new WP_Error('stripe_error', 'Error communicating with Stripe.', ['status' => 500]);
        } catch (Exception $e) {
            // Handle other unexpected exceptions
            error_log("General error: " . $e->getMessage());
            return new WP_Error('general_error', 'An unexpected error occurred.', ['status' => 500]);
        }
    }
    
    
    
/* 
    private static function create_customer($email, $name) {
        error_log("Creating Stripe customer with email: $email, name: $name");
        try {
            $customer = \Stripe\Customer::create([
                'email' => $email,
                'name' => $name,
            ]);

            error_log('Customer created successfully: ' . $customer->id);
            return $customer->id;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error while creating customer: ' . $e->getMessage());
            throw new Exception('Failed to create customer: ' . $e->getMessage());
        }
    } */

    public static function create_payment_intent($amount, $currency, $customer_id, $metadata = []) {
        error_log("Creating Payment Intent for Customer ID: $customer_id, Amount: $amount, Currency: $currency");
    
        // Validate parameters
        if (!is_int($amount) || $amount <= 0) {
            throw new Exception('Invalid amount. Amount must be a positive integer.');
        }
    
        $validCurrencies = ['sek'];
        if (!in_array(strtolower($currency), $validCurrencies)) {
            throw new Exception('Unsupported currency. Allowed: ' . implode(', ', $validCurrencies));
        }
    
        if (!preg_match('/^cus_[a-zA-Z0-9]+$/', $customer_id)) {
            throw new Exception('Invalid Stripe customer ID.');
        }
    
        // Set API key
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : null;
        if (!$secret_key) {
            throw new Exception('Stripe secret key is not defined.');
        }
        \Stripe\Stripe::setApiKey($secret_key);
    
        try {
            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => $amount,
                'currency' => $currency,
                'customer' => $customer_id,
                'setup_future_usage' => 'off_session',
                'payment_method_types' => ['card'],
                'metadata' => $metadata,
                
            ]);
    
            error_log('Payment Intent created successfully: ' . $paymentIntent->client_secret);
            return $paymentIntent->client_secret;
    
        } catch (\Stripe\Exception\ApiConnectionException $e) {
            error_log('Stripe Network Error: ' . $e->getMessage());
            throw new Exception('A network issue occurred. Please try again later.');
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            throw new Exception('Failed to create Payment Intent: ' . $e->getMessage());
        }
    }
    

   /*  public static function get_subscription_data($stripe_plan_id, $user_id) {
        try {
            // Fetch subscription using the plan ID
            $subscription = \Stripe\Subscription::retrieve([
                'items' => [['price' => $stripe_plan_id]],
            ]);
    
            if (!$subscription) {
                throw new Exception('Failed to retrieve subscription from Stripe.');
            }
    
            return [
                'stripe_subscription_id' => $subscription->id,
                'current_period_end' => $subscription->current_period_end,
            ];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            return new WP_Error('stripe_api_error', $e->getMessage(), ['status' => 500]);
        } catch (\Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            return new WP_Error('general_error', $e->getMessage(), ['status' => 500]);
        }
    } */

    public static function get_subscription_data($subscription_id) {
        try {

            self::set_stripe_api_key();
            // Retrieve subscription details from Stripe
            $subscription = \Stripe\Subscription::retrieve($subscription_id);
    
            return [
                'stripe_subscription_id' => $subscription->id,
                'current_period_end' => $subscription->current_period_end,
            ];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API Error: ' . $e->getMessage());
            return new WP_Error('stripe_api_error', $e->getMessage(), ['status' => 500]);
        } catch (\Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            return new WP_Error('general_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    public static function cleanup_subscriptions(WP_REST_Request $request) {
        try {
            self::set_stripe_api_key();
    
            $params = $request->get_json_params();
            error_log('Cleanup subscriptions params: ' . print_r($params, true));
    
            // Ensure `customer_id` exists
            if (empty($params['customer_id'])) {
                error_log("Missing customer_id in cleanup_subscriptions request.");
                return new WP_Error('invalid_request', 'customer_id is required', ['status' => 400]);
            }
    
            // Handle customer_id being either an object or string
            if (is_array($params['customer_id']) && isset($params['customer_id']['id'])) {
                $customer_id = sanitize_text_field($params['customer_id']['id']);
            } elseif (is_string($params['customer_id'])) {
                $customer_id = sanitize_text_field($params['customer_id']);
            } else {
                error_log('Invalid customer_id format in cleanup_subscriptions: ' . print_r($params['customer_id'], true));
                return new WP_Error('invalid_request', 'Invalid customer_id format', ['status' => 400]);
            }
    
            // Validate customer_id format (must start with "cus_")
            if (!preg_match('/^cus_[A-Za-z0-9]+$/', $customer_id)) {
                error_log("Invalid customer_id format: " . $customer_id);
                return new WP_Error('invalid_request', 'Invalid customer_id format', ['status' => 400]);
            }
    
            // Ensure `plan_id` exists
            if (empty($params['plan_id'])) {
                error_log("Missing plan_id in cleanup_subscriptions request.");
                return new WP_Error('invalid_request', 'plan_id is required', ['status' => 400]);
            }
    
            $plan_id = sanitize_text_field($params['plan_id']);
            if (!preg_match('/^price_[A-Za-z0-9]+$/', $plan_id)) {
                error_log("Invalid plan_id format: " . $plan_id);
                return new WP_Error('invalid_request', 'Invalid plan_id format', ['status' => 400]);
            }
    
            try {
                // Fetch all incomplete subscriptions for this customer
                $incomplete_subscriptions = \Stripe\Subscription::all([
                    'customer' => $customer_id,
                    'status' => 'incomplete',
                ]);
    
                if (empty($incomplete_subscriptions->data)) {
                    error_log("No incomplete subscriptions found for customer: " . $customer_id);
                    return rest_ensure_response(['success' => true, 'message' => 'No incomplete subscriptions to clean.']);
                }
    
                $canceled_count = 0;
                foreach ($incomplete_subscriptions->data as $subscription) {
                    if (!empty($subscription->items->data)) {
                        foreach ($subscription->items->data as $item) {
                            if ($item->price->id === $plan_id) {
                                // Cancel subscription
                                \Stripe\Subscription::update($subscription->id, [
                                    'cancel_at_period_end' => true
                                ]);
                                $canceled_count++;
                            }
                        }
                    }
                }
    
                return rest_ensure_response([
                    'success' => true,
                    'cleaned_subscriptions' => $canceled_count,
                    'message' => $canceled_count > 0 ? 'Subscriptions canceled.' : 'No matching subscriptions found.',
                ]);
    
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                error_log('Stripe API Error: ' . $e->getMessage());
                return new WP_Error('stripe_error', 'Stripe API request failed: ' . $e->getMessage(), ['status' => 400]);
            }
    
        } catch (\Exception $e) {
            error_log('Error in cleanup_subscriptions: ' . $e->getMessage());
            return new WP_Error('cleanup_error', 'General error: ' . $e->getMessage(), ['status' => 500]);
        }
    }
    
}