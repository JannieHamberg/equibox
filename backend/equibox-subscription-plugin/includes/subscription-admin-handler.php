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
/*     public static function add_subscription_plan($request) {
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
    } */
    public static function add_subscription_plan($request) {
        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }
    
        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'add_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }
    
        // Get and sanitize input
        $plan_name = sanitize_text_field($request->get_param('name'));
        $plan_price = floatval($request->get_param('price'));
        $interval = sanitize_text_field($request->get_param('interval'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $image_url = esc_url_raw($request->get_param('image_url'));
        $product_ids = $request->get_param('product_ids'); // Associated products
    
        // Convert incorrect interval values
        if ($interval === 'monthly') {
            $interval = 'month';
        } elseif ($interval === 'yearly') {
            $interval = 'year';
        }
    
        if (!$plan_name || !$interval) {
            return new WP_Error('missing_data', 'Name and interval are required.', ['status' => 400]);
        }
    
        // If price is missing, calculate from associated products
        if ($plan_price <= 0) {
            $plan_price = self::calculate_combined_price($product_ids);
        }
    
        try {
            // Load Stripe
            if (!class_exists('\Stripe\Stripe')) {
                require_once __DIR__ . '/../vendor/autoload.php';
            }
            \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    
            // Prepare Stripe product data
            $product_data = [
                'name' => $plan_name,
                'description' => $description,
            ];
    
            if (!empty($image_url)) {
                $product_data['images'] = [$image_url]; // Only include if not empty
            }
    
            // Step 1: Create a Subscription Plan in Stripe
            $stripe_product = \Stripe\Product::create($product_data);
    
            // Step 2: Create a Recurring Price in Stripe
            $stripe_price = \Stripe\Price::create([
                'unit_amount' => intval($plan_price * 100), // Convert to cents
                'currency' => 'sek',
                'recurring' => ['interval' => $interval],
                'product' => $stripe_product->id,
            ]);
    
            $stripe_plan_id = $stripe_price->id; // Store in DB
    
            // Step 3: Store Subscription Plan in the Custom Database
            global $wpdb;
            $inserted = $wpdb->insert(
                "{$wpdb->prefix}subscription_plans",
                [
                    'name' => $plan_name,
                    'price' => $plan_price,
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
    
            $plan_id = $wpdb->insert_id; // Get new plan ID
    
            // Step 4: Store Associated Products in the Custom Database
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
    
            return rest_ensure_response([
                'success' => true,
                'message' => 'Subscription plan added successfully!',
                'data' => [
                    'plan_id' => $plan_id,
                    'stripe_plan_id' => $stripe_plan_id,
                ],
            ]);
    
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return new WP_Error('stripe_error', 'Stripe API error: ' . $e->getMessage(), ['status' => 500]);
        }
    }
    
    

    // Edit an existing subscription plan
   /*  public static function edit_subscription_plan($request) {
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
 */
public static function edit_subscription_plan($request) {
    if (!current_user_can('manage_options')) {
        return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
    }

    $nonce = $request->get_param('nonce');
    if (!wp_verify_nonce($nonce, 'edit_plan_action')) {
        return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
    }

    // Get and sanitize input
    $plan_id = intval($request->get_param('id'));
    $plan_name = sanitize_text_field($request->get_param('name'));
    $plan_price = floatval($request->get_param('price'));
    $interval = sanitize_text_field($request->get_param('interval'));
    $description = sanitize_textarea_field($request->get_param('description'));
    $image_url = esc_url_raw($request->get_param('image_url'));
    $product_ids = $request->get_param('product_ids'); // Associated products (Custom DB Only)

    // Convert incorrect interval values
    if ($interval === 'monthly') {
        $interval = 'month';
    } elseif ($interval === 'yearly') {
        $interval = 'year';
    }

    global $wpdb;
    $plan = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
        $plan_id
    ));

    if (!$plan) {
        return new WP_Error('not_found', 'Subscription plan not found.', ['status' => 404]);
    }

    try {
        // Load Stripe
        if (!class_exists('\Stripe\Stripe')) {
            require_once __DIR__ . '/../vendor/autoload.php';
        }
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

        // Retrieve existing Stripe Price ID
        $old_stripe_price_id = $plan->stripe_plan_id;

        // Step 1: Retrieve Stripe Product ID
        $old_price = \Stripe\Price::retrieve($old_stripe_price_id);
        $product_id = $old_price->product;

        // Step 2: Update Stripe Product (Plan Name & Description)
        \Stripe\Product::update($product_id, [
            'name' => $plan_name,
            'description' => $description,
            'images' => [$image_url], // Optional
        ]);

        // Step 3: If the price changed, create a new price and update the default price
        if ($plan_price != $plan->price) {
            // Create new price first
            $new_price = \Stripe\Price::create([
                'unit_amount' => intval($plan_price * 100), // Convert to cents
                'currency' => 'sek',
                'recurring' => ['interval' => $interval],
                'product' => $product_id,
            ]);

            // Set the new price as the default price for the product
            \Stripe\Product::update($product_id, ['default_price' => $new_price->id]);

            // Now archive the old price (Stripe does not allow archiving a default price)
            \Stripe\Price::update($old_stripe_price_id, ['active' => false]);

            $new_stripe_price_id = $new_price->id;
        } else {
            $new_stripe_price_id = $old_stripe_price_id;
        }

        // Step 4: Update the Subscription Plan in Custom Database
        $updated = $wpdb->update(
            "{$wpdb->prefix}subscription_plans",
            [
                'name' => $plan_name,
                'price' => $plan_price,
                'interval' => $interval,
                'description' => $description,
                'image_url' => $image_url,
                'stripe_plan_id' => $new_stripe_price_id, // Store the new Stripe Price ID
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $plan_id]
        );

        if ($updated === false) {
            return new WP_Error('db_error', 'Failed to update subscription plan.', ['status' => 500]);
        }

        // Step 5: Update Associated Products in the Custom Database
        // Remove old product associations
        $wpdb->delete("{$wpdb->prefix}box_products", ['plan_id' => $plan_id]);

        // Add new product associations
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

        return rest_ensure_response([
            'success' => true,
            'message' => 'Subscription plan updated successfully!',
        ]);

    } catch (\Stripe\Exception\ApiErrorException $e) {
        return new WP_Error('stripe_error', 'Stripe API error: ' . $e->getMessage(), ['status' => 500]);
    }
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
        if (!current_user_can('manage_options')) {
            return new WP_Error('unauthorized', 'You are not authorized to perform this action.', ['status' => 403]);
        }

        $nonce = $request->get_param('nonce');
        if (!wp_verify_nonce($nonce, 'delete_plan_action')) {
            return new WP_Error('invalid_nonce', 'Invalid nonce provided.', ['status' => 403]);
        }

        $plan_id = intval($request->get_param('id'));
        if (!$plan_id) {
            return new WP_Error('missing_data', 'Plan ID is required.', ['status' => 400]);
        }

        global $wpdb;
        
        try {
            // Load Stripe if not already loaded
            if (!class_exists('\Stripe\Stripe')) {
                require_once __DIR__ . '/../vendor/autoload.php';
            }
            \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

            // Get Stripe plan ID from database
            $stripe_plan_id = $wpdb->get_var($wpdb->prepare(
                "SELECT stripe_plan_id FROM {$wpdb->prefix}subscription_plans WHERE id = %d",
                $plan_id
            ));

            if ($stripe_plan_id) {
                // Retrieve the Stripe Price object
                $old_price = \Stripe\Price::retrieve($stripe_plan_id);
                $product_id = $old_price->product;

                // Archive the Stripe price
                \Stripe\Price::update($stripe_plan_id, ['active' => false]);

                // Check for active subscriptions
                $subscriptions = \Stripe\Subscription::all([
                    'status' => 'active',
                    'price' => $stripe_plan_id
                ]);

                // Delete the Stripe product if no active subscriptions
                if (empty($subscriptions->data)) {
                    \Stripe\Product::update($product_id, ['active' => false]);
                    error_log("Stripe product archived: $product_id");
                } else {
                    error_log("Stripe product NOT archived because it has active subscriptions: $product_id");
                }

                error_log("Stripe plan archived: $stripe_plan_id");
            }

            // Delete associated products from custom database
            $wpdb->delete("{$wpdb->prefix}box_products", ['plan_id' => $plan_id]);

            // Delete the subscription plan from custom database
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

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API error when deleting the plan: ' . $e->getMessage());
            return new WP_Error('stripe_error', 'Error deleting Stripe plan: ' . $e->getMessage(), ['status' => 500]);
        } catch (\Exception $e) {
            error_log('General error when deleting the plan: ' . $e->getMessage());
            return new WP_Error('error', 'Error deleting plan: ' . $e->getMessage(), ['status' => 500]);
        }
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