<?php

class Subscription_Admin_Handler {
    // Add a new subscription plan
    public static function add_subscription_plan($request) {

        // Log the incoming request data for debugging
        error_log('Request Data: ' . print_r($request->get_params(), true));

        // Check admin permissions
        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        // Debugging: Log user capabilities
        error_log(print_r(wp_get_current_user()->allcaps, true));

        // Validate nonce
        $nonce = $request->get_param('nonce');
    
        // Debugging: Log the received nonce
         error_log('Nonce received: ' . $nonce);

        // Validate nonce
        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'add_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        // Get and sanitize inputs
        $plan_name = sanitize_text_field($request->get_param('name'));
        $plan_price = floatval($request->get_param('price'));
        $interval = sanitize_text_field($request->get_param('interval'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $image_url = esc_url_raw($request->get_param('image_url'));


        if (!$plan_name || !$plan_price || !$interval) {
            return new WP_Error('missing_data', 'Name, price, and interval are required.', ['status' => 400]);
        }

        // Add plan to the database
        global $wpdb;
        $inserted = $wpdb->insert(
            "{$wpdb->prefix}subscription_plans",
            [
                'name' => $plan_name,
                'price' => $plan_price,
                'interval' => $interval,
                'description' => $description,
                'image_url' => $image_url,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to insert subscription plan into the database.', ['status' => 500]);
        }

        $plan_id = $wpdb->insert_id;
        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ), ARRAY_A);
    
        // Check if the plan was retrieved successfully
        if (!$plan) {
            return new WP_Error('db_error', 'Failed to retrieve the newly added subscription plan.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription plan added successfully!',
            'data' => $plan,
        ]);
    }

    // Edit an existing subscription plan
    public static function edit_subscription_plan($request) {

        // Log the incoming request data for debugging
        error_log('Request Data: ' . print_r($request->get_params(), true));

        // Check admin permissions
        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        // Debugging: Log user capabilities
        error_log(print_r(wp_get_current_user()->allcaps, true));

        // Validate nonce
        $nonce = $request->get_param('nonce');

        // Debugging: Log the received nonce
        error_log('Nonce received: ' . $nonce);

        // Validate nonce
        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'edit_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        // Get and sanitize inputs
        $plan_id = intval($request->get_param('id'));
        $plan_name = sanitize_text_field($request->get_param('name'));
        $plan_price = floatval($request->get_param('price'));
        $interval = sanitize_text_field($request->get_param('interval'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $image_url = esc_url_raw($request->get_param('image_url'));


        if (!$plan_id || !$plan_name || !$plan_price || !$interval) {
            return new WP_Error('missing_data', 'ID, name, price, and interval are required.', ['status' => 400]);
        }

        // Update the plan in the database
        global $wpdb;
        $updated = $wpdb->update(
            "{$wpdb->prefix}subscription_plans",
            [
                'name' => $plan_name,
                'price' => $plan_price,
                'interval' => $interval,
                'description' => $description,
                'image_url' => $image_url,
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $plan_id]
        );

        if ($updated === false) {
            return new WP_Error('db_error', 'Failed to update subscription plan.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription plan updated successfully!',
            'data' => [
                'id' => $plan_id,
                'name' => $plan_name,
                'price' => $plan_price,
                'interval' => $interval,
                'description' => $description,
                'image_url' => $image_url,
            ],
        ]);
        
    }

    // Delete a subscription plan
    public static function delete_subscription_plan($request) {
        // Check admin permissions
        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        // Validate nonce
        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'delete_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        // Get and sanitize the ID
        $plan_id = intval($request->get_param('id'));

        if (!$plan_id) {
            return new WP_Error('missing_data', 'Plan ID is required.', ['status' => 400]);
        }

        // Delete the plan from the database
        global $wpdb;
        $deleted = $wpdb->delete(
            "{$wpdb->prefix}subscription_plans",
            ['id' => $plan_id]
        );

        if ($deleted === false) {
            return new WP_Error('db_error', 'Failed to delete subscription plan.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription plan deleted successfully!',
        ]);
    }
}
