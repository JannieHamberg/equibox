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
    $params = $request->get_json_params();
    error_log("Request Body: " . print_r($params, true));

    // Ensure required parameters exist
    if (empty($params['amount'])) {
        error_log("Amount is required");
        return new WP_Error('invalid_request', 'Amount is required', ['status' => 400]);
    }

    if (empty($params['customer_id'])) {
        error_log("Missing customer_id in create-client-secret request.");
        return new WP_Error('invalid_request', 'customer_id is required', ['status' => 400]);
    }

    // Sanitize values
    $customer_id = is_array($params['customer_id']) && isset($params['customer_id']['id']) 
        ? sanitize_text_field($params['customer_id']['id']) 
        : sanitize_text_field($params['customer_id']);

    $amount = intval($params['amount']);

    try {
        // Create a PaymentIntent for the subscription setup
        $intent = \Stripe\PaymentIntent::create([
            'amount' => $amount,
            'currency' => 'sek',
            'customer' => $customer_id,
            'payment_method_types' => ['card'],
            'payment_method' => $params['payment_method_id'] ?? null,
            'setup_future_usage' => 'off_session',
            'confirm' => false,
            'metadata' => [
                'customer_id' => $customer_id,
                'email' => $params['email'] ?? '',
            ],
        ]);

        // If payment method is provided, attach it to the customer
        if (!empty($params['payment_method_id'])) {
            try {
                $payment_method = \Stripe\PaymentMethod::retrieve($params['payment_method_id']);
                if ($payment_method->customer !== $customer_id) {
                    $payment_method->attach([
                        'customer' => $customer_id,
                    ]);
                }
            } catch (\Exception $e) {
                error_log('Error attaching payment method: ' . $e->getMessage());
            }
        }

        error_log("Stripe PaymentIntent Created: " . $intent->id);
        error_log("Client Secret: " . $intent->client_secret);

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
