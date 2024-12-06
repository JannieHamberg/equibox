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

    echo '<div class="wrap">';
    echo '<h1 class="wp-heading-inline">Admin Dashboard</h1>';

    // Subscription Analytics
    echo '<h2>Subscription Analytics</h2>';
    echo '<table class="widefat fixed striped">';
    echo '<thead><tr><th>Total Subscriptions</th><th>Active Subscriptions</th><th>Canceled Subscriptions</th></tr></thead>';
    echo '<tbody>';
    echo "<tr><td>$total_subscriptions</td><td>$active_subscriptions</td><td>$canceled_subscriptions</td></tr>";
    echo '</tbody>';
    echo '</table>';

    // Add Product Form
    echo '<h2>Add Product to Subscription Box</h2>';
    echo '<form method="POST" action="" class="form-wrap">';
    echo '<table class="form-table">';
    echo '<tr><th><label for="plan_id">Subscription Plan:</label></th>';
    echo '<td><select id="plan_id" name="plan_id" required class="regular-text">';
    echo '<option value="">Select a subscription plan</option>';
    $plans = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}subscription_plans");
    foreach ($plans as $plan) {
        echo "<option value='{$plan->id}'>{$plan->name}</option>";
    }
    echo '</select></td></tr>';

    echo '<tr><th><label for="product_id">Product:</label></th>';
    echo '<td><select id="product_id" name="product_id" required class="regular-text">';
    echo '<option value="">Select a product</option>';
    $products = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}products");
    foreach ($products as $product) {
        echo "<option value='{$product->id}'>{$product->name}</option>";
    }
    echo '</select></td></tr>';

    echo '<tr><th><label for="month_year">Month/Year:</label></th>';
    echo '<td><input type="month" id="month_year" name="month_year" required class="regular-text"></td></tr>';

    echo '<tr><th><label for="quantity">Quantity:</label></th>';
    echo '<td><input type="number" id="quantity" name="quantity" required class="regular-text"></td></tr>';
    echo '</table>';

    echo '<p class="submit">';
    echo '<button type="submit" name="submit_add_product" class="button button-primary">Add Product</button>';
    echo '</p>';
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
            echo '<div class="notice notice-success is-dismissible"><p>Product added to box successfully!</p></div>';
        } else {
            echo '<div class="notice notice-error is-dismissible"><p>Error adding product to box.</p></div>';
        }
    }
    echo '</div>';
}


