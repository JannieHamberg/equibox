<?php
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

    // Parse and sanitize input
    $body = $request->get_json_params();
    error_log("Request Body: " . print_r($body, true));

    if (!isset($body['email']) || !isset($body['name'])) {
        error_log("Missing required fields: email or name.");
        return new WP_Error(
            'invalid_request',
            'Missing required fields: email or name.',
            ['status' => 400]
        );
    }

    $email = sanitize_email($body['email']);
    $name = sanitize_text_field($body['name']);
    $amount = intval($body['amount'] ?? 0);

    if ($amount <= 0) {
        error_log("Invalid payment amount: $amount");
        return new WP_Error('invalid_request', 'Invalid payment amount. Amount must be greater than 0.', ['status' => 400]);
    }

    try {
        // Check if the customer already exists
        $existingCustomers = \Stripe\Customer::all(['email' => $email]);
        if (!empty($existingCustomers->data)) {
            $customer = $existingCustomers->data[0];
            error_log("Existing Stripe Customer Found: " . $customer->id);
        } else {
            // Create a new customer
            $customer = \Stripe\Customer::create([
                'email' => $email,
                'name' => $name,
            ]);
            error_log("New Stripe Customer Created: " . $customer->id);
        }

        // Create a PaymentIntent for the subscription setup
        $paymentIntent = \Stripe\PaymentIntent::create([
            'amount' => $amount, 
            'currency' => 'sek', 
            'customer' => $customer->id,
            'setup_future_usage' => 'off_session', 
            'payment_method_types' => ['card'],
            'metadata' => [
                'email' => $email,
                'name' => $name,
            ],
        ]);
        error_log("Stripe PaymentIntent Created: " . $paymentIntent->id);
        error_log("Client Secret: " . $paymentIntent->client_secret);

        // Return the client secret and optional details
        return rest_ensure_response([
            'clientSecret' => $paymentIntent->client_secret,
            'paymentIntentId' => $paymentIntent->id,
            'customerId' => $customer->id,
        ]);

    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log('Stripe API Error: ' . $e->getMessage());
        return new WP_Error('stripe_error', $e->getMessage(), ['status' => 500]);
    } catch (Exception $e) {
        error_log('General Error: ' . $e->getMessage());
        return new WP_Error('general_error', $e->getMessage(), ['status' => 500]);
    }
}
