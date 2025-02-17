<?php
    
class Box_Handler {

    public static function assign_product_to_box($request) {
        // Get request parameters
        $plan_id = $request->get_param('plan_id');
        $product_id = $request->get_param('product_id');
        $month_year = $request->get_param('month_year');
        $quantity = $request->get_param('quantity');
        
        // Validate inputs
        if (!$plan_id || !is_numeric($plan_id)) {
            return new WP_Error('invalid_plan_id', 'Plan ID is required and must be a numeric value.', ['status' => 400]);
        }
    
        if (!$product_id || !is_numeric($product_id)) {
            return new WP_Error('invalid_product_id', 'Product ID is required and must be a numeric value.', ['status' => 400]);
        }
    
        if (!$month_year || !preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month_year)) {
            return new WP_Error('invalid_month_year', 'Month/Year is required and must be in the format YYYY-MM.', ['status' => 400]);
        }
    
        if (!$quantity || !is_numeric($quantity) || $quantity < 1) {
            return new WP_Error('invalid_quantity', 'Quantity is required and must be a positive number.', ['status' => 400]);
        }
    
        global $wpdb;
    
        // Ensure the plan exists
        $plan_table = $wpdb->prefix . 'subscription_plans';
        $plan_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $plan_table WHERE id = %d", $plan_id));
        if (!$plan_exists) {
            return new WP_Error('invalid_plan_id', 'The specified plan ID does not exist.', ['status' => 404]);
        }
    
        // Ensure the product exists
        $product_table = $wpdb->prefix . 'products';
        $product_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $product_table WHERE id = %d", $product_id));
        if (!$product_exists) {
            return new WP_Error('invalid_product_id', 'The specified product ID does not exist.', ['status' => 404]);
        }
    
        // Insert into the database
        $table_name = $wpdb->prefix . 'box_products';
        $inserted = $wpdb->insert(
            $table_name,
            [
                'plan_id' => $plan_id,
                'product_id' => $product_id,
                'month_year' => $month_year . '-01',
                'quantity' => $quantity,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );
    
        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to assign product to box.', ['status' => 500]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'message' => 'Product assigned to box successfully!',
        ]);
    }
    
    


    public static function get_box_products($request) {
        $plan_id = $request->get_param('plan_id');
        $month_year = $request->get_param('month_year'); 
    
        if (!$plan_id || !$month_year) {
            return new WP_Error('missing_data', 'Plan ID and Month/Year are required.', ['status' => 400]);
        }
    
        global $wpdb;
        $table_name = $wpdb->prefix . 'box_products';
    
        $products = $wpdb->get_results($wpdb->prepare(
            "SELECT bp.*, p.name, p.description, p.price 
            FROM $table_name bp 
            INNER JOIN {$wpdb->prefix}products p ON bp.product_id = p.id 
            WHERE bp.plan_id = %d AND bp.month_year = %s",
            $plan_id,
            $month_year . '-01'
        ), ARRAY_A);
    
        if (empty($products)) {
            return new WP_Error('no_products', 'No products found for this plan and month.', ['status' => 404]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'products' => $products,
        ]);
    }


    public static function update_box_product($request) {
        $id = $request->get_param('id');
        $quantity = $request->get_param('quantity');
    
        // Validate ID
        if (!$id || !is_numeric($id)) {
            return new WP_Error('invalid_id', 'ID is required and must be a numeric value.', ['status' => 400]);
        }
    
        // Validate Quantity
        if (!$quantity || !is_numeric($quantity) || $quantity < 1) {
            return new WP_Error('invalid_quantity', 'Quantity is required and must be a positive number.', ['status' => 400]);
        }
    
        global $wpdb;
        $table_name = $wpdb->prefix . 'box_products';
    
        // Check if the box product exists
        $box_product_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE id = %d", $id));
        if (!$box_product_exists) {
            return new WP_Error('not_found', 'The specified box product does not exist.', ['status' => 404]);
        }
    
        // Update the box product
        $updated = $wpdb->update(
            $table_name,
            [
                'quantity' => $quantity,
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $id]
        );
    
        if ($updated === false) {
            return new WP_Error('db_error', 'Failed to update box product.', ['status' => 500]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'message' => 'Box product updated successfully!',
        ]);
    }
    
}