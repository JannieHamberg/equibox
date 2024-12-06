<?php
// Add the menu item for admin dashboard
add_action('admin_menu', function () {
    add_menu_page(
        'Admin Dashboard',              
        'Admin Dashboard',              
        'manage_options',               
        'admin-dashboard',              
        'render_admin_dashboard',       
        'dashicons-chart-line',         
        6                               // Position
    );
});

function render_admin_dashboard() {
    global $wpdb;

    // Fetch analytics data
    $total_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}subscriptions");
    $active_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}subscriptions WHERE status = 'active'");
    $canceled_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}subscriptions WHERE status = 'canceled'");

    // Display analytics
    echo "<h1>Admin Dashboard</h1>";
    echo "<h2>Subscription Analytics</h2>";
    echo "<p>Total Subscriptions: $total_subscriptions</p>";
    echo "<p>Active Subscriptions: $active_subscriptions</p>";
    echo "<p>Canceled Subscriptions: $canceled_subscriptions</p>";

    // Fetch subscription plans and products
    $subscription_plans = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}subscription_plans");
    $products = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}products");

    // Add product to box form
    echo '<h2>Add Product to Subscription Box</h2>';
    echo '<form method="POST" action="">';

    echo '<label for="plan_id">Subscription Plan:</label>';
    echo '<select id="plan_id" name="plan_id" required>';
    echo '<option value="">Select a subscription plan</option>';
    foreach ($subscription_plans as $plan) {
        echo "<option value='{$plan->id}'>{$plan->name}</option>";
    }
    echo '</select><br>';

    echo '<label for="product_id">Product:</label>';
    echo '<select id="product_id" name="product_id" required>';
    echo '<option value="">Select a product</option>';
    foreach ($products as $product) {
        echo "<option value='{$product->id}'>{$product->name}</option>";
    }
    echo '</select><br>';

    echo '<label for="month_year">Month/Year:</label>';
    echo '<input type="month" id="month_year" name="month_year" required><br>';
    echo '<label for="quantity">Quantity:</label>';
    echo '<input type="number" id="quantity" name="quantity" required><br>';
    echo '<button type="submit" name="submit_add_product">Add Product</button>';
    echo '</form>';

    // Handle form submission
    if (isset($_POST['submit_add_product'])) {
        $plan_id = intval($_POST['plan_id']);
        $product_id = intval($_POST['product_id']);
        $month_year = sanitize_text_field($_POST['month_year']);
        $quantity = intval($_POST['quantity']);

        $table_name = $wpdb->prefix . 'box_products';
        $result = $wpdb->insert(
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

        if ($result !== false) {
            echo "<p>Product added to box successfully!</p>";
        } else {
            echo "<p>Error adding product to box.</p>";
        }
    }
}

