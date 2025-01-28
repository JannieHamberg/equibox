<?php

if (!defined('ABSPATH')) {
    exit;
}

class MemberShop_Handler {

    public static function get_shop_products($request) {
        global $wpdb;

        $category = $request->get_param('category');
        $query = "SELECT * FROM {$wpdb->prefix}shop_products";
        $params = [];

        if ($category) {
            $query .= " WHERE category = %s";
            $params[] = $category;
        }

        $products = $wpdb->get_results($wpdb->prepare($query, $params));

        return new WP_REST_Response($products, 200);
    }

    public static function get_shop_categories($request) {
        global $wpdb;

        $categories = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}shop_categories");

        return new WP_REST_Response($categories, 200);
    }

    public static function get_filtered_products($request) {
        global $wpdb;

        $category = $request->get_param('category');
        $min_price = $request->get_param('min_price');
        $max_price = $request->get_param('max_price');

        $query = "SELECT id, title, description, price, category, image_url, created_at 
                 FROM {$wpdb->prefix}shop_products WHERE 1=1";
        $params = [];

        if ($category) {
            $query .= " AND category = %s";
            $params[] = $category;
        }

        if ($min_price && $max_price) {
            $query .= " AND price BETWEEN %d AND %d";
            $params[] = $min_price;
            $params[] = $max_price;
        }

        $products = $wpdb->get_results($wpdb->prepare($query, $params));

        return new WP_REST_Response($products, 200);
    }
}
