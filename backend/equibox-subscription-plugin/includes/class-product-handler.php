<?php

class Product_Handler {

    public static function get_all_products($request) {
        global $wpdb;
        $products_table = $wpdb->prefix . 'products';
        $categories_table = $wpdb->prefix . 'categories';
    
        // Query all products with category names
        $products = $wpdb->get_results(
            "SELECT p.*, c.name as category_name
             FROM $products_table p
             LEFT JOIN $categories_table c ON p.category_id = c.id",
            ARRAY_A
        );
    
        if (empty($products)) {
            return rest_ensure_response([
                'success' => true,
                'products' => [],
                'message' => 'No products found',
            ]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'products' => $products,
        ]);
    }
    

    public static function add_product($request) {
        $name = sanitize_text_field($request->get_param('name'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $price = $request->get_param('price');
        $category_id = intval($request->get_param('category_id')); 
    
        // Validate Name
        if (!$name || strlen($name) < 3) {
            return new WP_Error('invalid_name', 'Name is required and must be at least 3 characters long.', ['status' => 400]);
        }
    
        // Validate Price
        if (!$price || !is_numeric($price) || $price <= 0) {
            return new WP_Error('invalid_price', 'Price is required and must be a positive number.', ['status' => 400]);
        }
    
        // Validate Category ID
        if (!$category_id || !is_numeric($category_id)) {
            return new WP_Error('invalid_category', 'A valid category ID is required.', ['status' => 400]);
        }
    
        global $wpdb;
    
        // Ensure the category exists
        $category_exists = $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}categories WHERE id = %d", $category_id)
        );
    
        if (!$category_exists) {
            return new WP_Error('invalid_category', 'The specified category does not exist.', ['status' => 400]);
        }
    
        $table_name = $wpdb->prefix . 'products';
    
        $inserted = $wpdb->insert(
            $table_name,
            [
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'category_id' => $category_id, 
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );
    
        if ($inserted === false) {
            error_log('Database Error: ' . $wpdb->last_error);
            return new WP_Error('db_error', 'Failed to add product', ['status' => 500]);
        }
    
        $product_id = $wpdb->insert_id;
    
        return rest_ensure_response([
            'success' => true,
            'message' => 'Product added successfully!',
            'product' => [
                'id' => $product_id,
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'category_id' => $category_id,
                'created_at' => current_time('mysql'),
            ],
        ]);
    }

    public static function get_all_categories($request) {
        global $wpdb;
        $categories_table = $wpdb->prefix . 'categories';
    
        $categories = $wpdb->get_results("SELECT id, name FROM $categories_table", ARRAY_A);
    
        if (empty($categories)) {
            return rest_ensure_response([
                'success' => false,
                'categories' => [],
                'message' => 'No categories found',
            ]);
        }
    
        return rest_ensure_response([
            'success' => true,
            'categories' => $categories,
        ]);
    }
    
    
}
