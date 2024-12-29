<?php

class Subscription_Admin_Handler {

    // Add products to db
    public static function add_product_to_database($request) {
        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        // Validate nonce
        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'add_product_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        // Get and sanitize input
        $product_name = sanitize_text_field($request->get_param('name'));
        $product_description = sanitize_textarea_field($request->get_param('description'));
        $product_price = floatval($request->get_param('price'));
        $product_category = sanitize_text_field($request->get_param('category'));

        if (!$product_name || !$product_price) {
            return new WP_Error('missing_data', 'Product name and price are required.', ['status' => 400]);
        }

        // Insert product into the database
        global $wpdb;
        $inserted = $wpdb->insert(
            "{$wpdb->prefix}products",
            [
                'name' => $product_name,
                'description' => $product_description,
                'price' => $product_price,
                'category' => $product_category,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to insert product into the database.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Product added successfully!',
        ]);
    }

    // Add a new subscription plan
    public static function add_subscription_plan($request) {
        error_log('Request Data: ' . print_r($request->get_params(), true));

        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'add_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        $plan_name = sanitize_text_field($request->get_param('name'));
        $plan_price = floatval($request->get_param('price'));
        $interval = sanitize_text_field($request->get_param('interval'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $image_url = esc_url_raw($request->get_param('image_url'));
        $stripe_plan_id = sanitize_text_field($request->get_param('stripe_plan_id'));
        $product_ids = $request->get_param('product_ids'); 

        if (!$plan_name || !$interval || !$stripe_plan_id) {
            return new WP_Error('missing_data', 'Name and interval are required.', ['status' => 400]);
        }

        // Stripe Plan Validation
        try {
            $stripe_plan = \Stripe\Price::retrieve($stripe_plan_id);
            if (!$stripe_plan || $stripe_plan->active === false) {
                return new WP_Error('invalid_stripe_plan', 'Invalid or inactive Stripe plan.', ['status' => 400]);
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return new WP_Error('stripe_error', 'Stripe API error: ' . $e->getMessage(), ['status' => 500]);
        }

        // Calculate combined product price
       /*  $calculated_price = 0;
        global $wpdb;
        if (is_array($product_ids) && !empty($product_ids)) {
            foreach ($product_ids as $product_id) {
                $product_price = $wpdb->get_var($wpdb->prepare(
                    "SELECT price FROM {$wpdb->prefix}products WHERE id = %d",
                    intval($product_id)
                ));
                $calculated_price += floatval($product_price);
            }
        } */
        $calculated_price = self::calculate_combined_price($product_ids);
        global $wpdb;
        $final_price = $plan_price > 0 ? $plan_price : $calculated_price;

        $inserted = $wpdb->insert(
            "{$wpdb->prefix}subscription_plans",
            [
                'name' => $plan_name,
                'price' => $final_price,
                'interval' => $interval,
                'description' => $description,
                'image_url' => $image_url,
                'stripe_plan_id' => $stripe_plan_id,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to insert subscription plan into the database.', ['status' => 500]);
        }

        $plan_id = $wpdb->insert_id;

        if (is_array($product_ids) && !empty($product_ids)) {
            foreach ($product_ids as $product_id) {
                $wpdb->insert(
                    "{$wpdb->prefix}box_products",
                    [
                        'plan_id' => $plan_id,
                        'product_id' => intval($product_id),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]
                );
            }
        }

        if (class_exists('WC_Product_Simple')) {
            $product = new WC_Product_Simple();
            $product->set_name($plan_name);
            $product->set_regular_price($final_price);
            $product->set_description($description);
            $product->set_sku('plan_' . $plan_id);
            $product->set_manage_stock(true);
            $product->set_stock_quantity(100);
            $product->set_virtual(false);
            $product->set_catalog_visibility('visible');
            $product_id = $product->save();

            $wpdb->update(
                "{$wpdb->prefix}subscription_plans",
                ['product_id' => $product_id],
                ['id' => $plan_id]
            );
        }

        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ), ARRAY_A);
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
        error_log('Request Data: ' . print_r($request->get_params(), true));

        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'edit_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        $plan_id = intval($request->get_param('id'));
        $plan_name = sanitize_text_field($request->get_param('name'));
        $plan_price = floatval($request->get_param('price'));
        $interval = sanitize_text_field($request->get_param('interval'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $image_url = esc_url_raw($request->get_param('image_url'));
        $stripe_plan_id = sanitize_text_field($request->get_param('stripe_plan_id')); 
        $product_ids = $request->get_param('product_ids'); 

        if (!$plan_id || !$plan_name || !$interval || !$stripe_plan_id) {
            return new WP_Error('missing_data', 'ID, name, interval and stripe_plan_id are required.', ['status' => 400]);
        }

        // Validate Stripe Plan
        try {
            $stripe_plan = \Stripe\Price::retrieve($stripe_plan_id);
            if (!$stripe_plan || $stripe_plan->active === false) {
                return new WP_Error('invalid_stripe_plan', 'Invalid or inactive Stripe plan.', ['status' => 400]);
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return new WP_Error('stripe_error', 'Stripe API error: ' . $e->getMessage(), ['status' => 500]);
        }


        // Calculate combined product price
       /*  $calculated_price = 0;
        global $wpdb;
        if (is_array($product_ids) && !empty($product_ids)) {
            foreach ($product_ids as $product_id) {
                $product_price = $wpdb->get_var($wpdb->prepare(
                    "SELECT price FROM {$wpdb->prefix}products WHERE id = %d",
                    intval($product_id)
                ));
                $calculated_price += floatval($product_price);
            }
        } */
        $calculated_price = self::calculate_combined_price($product_ids);
        global $wpdb;
        $final_price = $plan_price > 0 ? $plan_price : $calculated_price;

        $updated = $wpdb->update(
            "{$wpdb->prefix}subscription_plans",
            [
                'name' => $plan_name,
                'price' => $final_price,
                'interval' => $interval,
                'description' => $description,
                'image_url' => $image_url,
                'stripe_plan_id' => $stripe_plan_id,
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $plan_id]
        );

        if ($updated === false) {
            return new WP_Error('db_error', 'Failed to update subscription plan.', ['status' => 500]);
        }

        $wpdb->delete("{$wpdb->prefix}box_products", ['plan_id' => $plan_id]);
        if (is_array($product_ids) && !empty($product_ids)) {
            foreach ($product_ids as $product_id) {
                $wpdb->insert(
                    "{$wpdb->prefix}box_products",
                    [
                        'plan_id' => $plan_id,
                        'product_id' => intval($product_id),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]
                );
            }
        }

        $plan = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
            $plan_id
        ), ARRAY_A);

        if (!$plan) {
            return new WP_Error('db_error', 'Failed to retrieve the updated subscription plan.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription plan updated successfully!',
            'data' => $plan,
        ]);
    }


    // calculate combined price of associated products
    private static function calculate_combined_price($product_ids) {
        global $wpdb;
        if (!is_array($product_ids) || empty($product_ids)) {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($product_ids), '%d'));
        $query = $wpdb->prepare(
            "SELECT SUM(price) AS total_price FROM {$wpdb->prefix}products WHERE id IN ($placeholders)",
            $product_ids
        );

        $result = $wpdb->get_var($query);
        return $result ? floatval($result) : 0;
    }


    // Delete a subscription plan
    public static function delete_subscription_plan($request) {
        // check admin permissions
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

        // Delete associated products
        global $wpdb;
        // Archive the Stripe plan
        try {
            $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
                "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
                $plan_id
            ));
    
            if ($stripe_plan_id) {
                \Stripe\Price::update($stripe_plan_id, ['active' => false]);
                error_log("Stripe plan archived: $stripe_plan_id");
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API error when archiving the plan: ' . $e->getMessage());
            
        }

        $wpdb->delete("{$wpdb->prefix}box_products", ['plan_id' => $plan_id]);

        // Delete the subscription plan
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

    public static function get_subscription_plan_products($request) {
        global $wpdb;
        $plan_id = intval($request['id']);
    
        if (!$plan_id) {
            return new WP_Error('invalid_plan_id', 'Invalid plan ID.', ['status' => 400]);
        }
    
        // Fetch products linked to a plan
        $products = $wpdb->get_results($wpdb->prepare(
            "SELECT p.id, p.name 
             FROM {$wpdb->prefix}box_products bp 
             INNER JOIN {$wpdb->prefix}products p ON bp.product_id = p.id 
             WHERE bp.plan_id = %d",
            $plan_id
        ));

        error_log(print_r($products, true));
    
        if (empty($products)) {
            return rest_ensure_response(['success' => true, 'data' => []]);
        }
    
        return rest_ensure_response(['success' => true, 'data' => $products]);
    }
    
}