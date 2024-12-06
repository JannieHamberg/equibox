<?php

class Product_Handler {

    public static function get_all_products($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'products';

        $products = $wpdb->get_results("SELECT * FROM $table_name");

        if (empty($products)) {
            return new WP_Error('no_products', 'No products found', ['status' => 404]);
        }

        return rest_ensure_response([
            'success' => true,
            'products' => $products,
        ]);
    }

    // Add product handler
    public static function add_product($request) {
        $name = sanitize_text_field($request->get_param('name'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $price = $request->get_param('price');
        $category = sanitize_text_field($request->get_param('category'));

        // Validate Name
        if (!$name || strlen($name) < 3) {
            return new WP_Error('invalid_name', 'Name is required and must be at least 3 characters long.', ['status' => 400]);
        }

        // Validate Price
        if (!$price || !is_numeric($price) || $price <= 0) {
            return new WP_Error('invalid_price', 'Price is required and must be a positive number.', ['status' => 400]);
        }

        // Validate Category 
        if ($category && strlen($category) > 50) {
            return new WP_Error('invalid_category', 'Category must not exceed 50 characters.', ['status' => 400]);
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'products';

        $inserted = $wpdb->insert(
            $table_name,
            [
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'category' => $category,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );

        if ($inserted === false) {
            return new WP_Error('db_error', 'Failed to add product', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Product added successfully!',
        ]);
    }
}
