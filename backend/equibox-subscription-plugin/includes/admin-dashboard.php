<?php
// Add the menu item for the admin dashboard
add_action('admin_menu', function () {
    add_menu_page(
        'Admin Dashboard',
        'Admin Dashboard',
        'manage_options',
        'admin-dashboard',
        'render_admin_dashboard',
        'dashicons-chart-line',
        6
    );
});

function render_admin_dashboard() {
    global $wpdb;

    // Fetch analytics data
    $total_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}subscriptions");
    $active_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}subscriptions WHERE status = 'active'");
    $canceled_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}subscriptions WHERE status = 'canceled'");

    // Fetch all products for the checkboxes
    $products = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}products");

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

    // List Existing Subscription Plans
    echo '<h2>Subscription Plans</h2>';
    echo '<table id="subscription-plans-table" class="widefat fixed striped">';
    echo '<thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Interval</th><th>Description</th><th>Image URL</th><th>Actions</th></tr></thead>';
    echo '<tbody>';

    $plans = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}subscription_plans");
    foreach ($plans as $plan) {
        echo "<tr data-id='{$plan->id}'>
            <td>{$plan->id}</td>
            <td>{$plan->name}</td>
            <td>{$plan->price}</td>
            <td>{$plan->interval}</td>
            <td>{$plan->description}</td>
            <td>" . esc_html($plan->image_url) . "</td>
            <td>
                <button class='button edit-plan-button' 
                    data-id='{$plan->id}' 
                    data-name='{$plan->name}' 
                    data-price='{$plan->price}' 
                    data-interval='{$plan->interval}' 
                    data-description='{$plan->description}'
                    data-image-url='{$plan->image_url}'>Edit</button>
                <button class='button button-danger delete-plan-button' 
                    data-id='{$plan->id}' 
                    data-nonce='" . wp_create_nonce('delete_plan_action') . "'>Delete</button>
            </td>
        </tr>";

        // Fetch associated products
        $associated_products = $wpdb->get_results($wpdb->prepare(
            "SELECT p.name, p.price 
             FROM {$wpdb->prefix}box_products bp
             INNER JOIN {$wpdb->prefix}products p ON bp.product_id = p.id
             WHERE bp.plan_id = %d",
            $plan->id
        ));

        if (!empty($associated_products)) {
            echo "<tr><td colspan='7'><strong>Products in Plan:</strong>";
            echo "<div style='max-height: 100px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;'>"; 
            echo "<ul style='margin: 0; padding: 0; list-style-type: none;'>";
            foreach ($associated_products as $product) {
                echo "<li>{$product->name} (Price: {$product->price})</li>";
            }
            echo "</ul>";
            echo "</div>";
            echo "</td></tr>";
        }
        
    }
    echo '</tbody>';
    echo '</table>';

    // Add and Edit Forms
    echo '<h2>Manage Subscription Plans</h2>';
    echo '<div class="subscription-plan-forms" style="display: flex; gap: 20px;">';

    // Add Form
    echo '<div class="add_subscription_plan" style="flex: 1;">';
    echo '<h3>Add New Subscription Plan</h3>';
    echo '<form id="add-plan-form">';
    echo '<input type="hidden" name="add_plan_nonce" value="' . wp_create_nonce('add_plan_action') . '">';
    echo '<table class="form-table">';
    echo '<tr><th><label for="plan_name">Plan Name:</label></th>';
    echo '<td><input type="text" id="plan_name" name="name" required class="regular-text"></td></tr>';
    echo '<tr><th><label for="other_price">Other Price:</label></th>';
    echo '<td><input type="number" step="0.01" id="other_price" name="price" placeholder="Leave empty for calculated price" class="regular-text"></td></tr>';
    echo '<tr><th><label for="plan_interval">Interval:</label></th>';
    echo '<td><select id="plan_interval" name="interval" required class="regular-text"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></td></tr>';
    echo '<tr><th><label for="plan_description">Description:</label></th>';
    echo '<td><textarea id="plan_description" name="description" rows="3" class="regular-text"></textarea></td></tr>';
    echo '<tr><th><label for="plan_image_url">Image URL:</label></th>';
    echo '<td><input type="text" id="plan_image_url" name="image_url" class="regular-text"></td></tr>';
    echo '<tr><th><label for="products">Select Products:</label></th>';
    echo '<td>';
    echo '<div style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">'; 
    foreach ($products as $product) {
        echo "<label><input type='checkbox' class='add-product-checkbox' value='{$product->id}' data-price='{$product->price}'> {$product->name} (Price: {$product->price})</label><br>";
    }
    echo '</div>';
    echo '</td></tr>';
    
    echo '<tr><th>Calculated Price:</th><td><div id="calculated_price_display">0.00</div></td></tr>';
    echo '</table>';
    echo '<p class="submit"><button type="submit" class="button button-primary">Add Plan</button></p>';
    echo '</form>';
    echo '</div>';

    // Edit Form
    echo '<div class="edit-subscription-plan" style="flex: 1;">';
    echo '<h3>Edit Subscription Plan</h3>';
    echo '<form id="edit-plan-form">';
    echo '<input type="hidden" id="edit_plan_id" name="id">';
    echo '<input type="hidden" name="edit_plan_nonce" value="' . wp_create_nonce('edit_plan_action') . '">';
    echo '<table class="form-table">';
    echo '<tr><th><label for="edit_plan_name">Plan Name:</label></th>';
    echo '<td><input type="text" id="edit_plan_name" name="name" required class="regular-text"></td></tr>';
    echo '<tr><th><label for="edit_plan_price">Other Price:</label></th>';
    echo '<td><input type="number" step="0.01" id="edit_plan_price" name="price" placeholder="Leave empty for calculated price" class="regular-text"></td></tr>';
    echo '<tr><th><label for="edit_plan_interval">Interval:</label></th>';
    echo '<td><select id="edit_plan_interval" name="interval" required class="regular-text"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></td></tr>';
    echo '<tr><th><label for="edit_plan_description">Description:</label></th>';
    echo '<td><textarea id="edit_plan_description" name="description" rows="3" class="regular-text"></textarea></td></tr>';
    echo '<tr><th><label for="edit_plan_image_url">Image URL:</label></th>';
    echo '<td><input type="text" id="edit_plan_image_url" name="image_url" class="regular-text"></td></tr>';
    echo '<tr><th><label for="edit_products">Select Products:</label></th>';
    echo '<td>';
    echo '<div style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">'; 
    foreach ($products as $product) {
        echo "<label><input type='checkbox' class='edit-product-checkbox' value='{$product->id}' data-price='{$product->price}'> {$product->name} (Price: {$product->price})</label><br>";
    }
    echo '</div>';
    echo '</td></tr>';
    echo '<tr><th><label for="edit_calculated_price">Calculated Price:</label></th>';
    echo '<td><span id="edit-calculated-price-display">0.00</span></td></tr>';
    echo '</table>';
    echo '<p class="submit"><button type="submit" class="button button-primary">Update Plan</button></p>';
    echo '</form>';
    echo '</div>';

    echo '</div>'; // End of edit/add forms

// Fetch all categories for the dropdown
$categories = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}categories");

// Add products to the database
echo '<h2>Add Products to Database</h2>';
echo '<div class="add-product-form">';
echo '<form id="add-product-form">';
echo '<input type="hidden" name="add_product_nonce" value="' . wp_create_nonce('add_product_action') . '">';
echo '<table class="form-table">';

// Product Name
echo '<tr><th><label for="product_name">Product Name:</label></th>';
echo '<td><input type="text" id="product_name" name="name" required class="regular-text"></td></tr>';

// Product Description
echo '<tr><th><label for="product_description">Description:</label></th>';
echo '<td><textarea id="product_description" name="description" rows="3" class="regular-text"></textarea></td></tr>';

// Product Price
echo '<tr><th><label for="product_price">Price:</label></th>';
echo '<td><input type="number" step="0.01" id="product_price" name="price" required class="regular-text"></td></tr>';

// Product Category Dropdown
echo '<tr><th><label for="product_category">Category:</label></th>';
echo '<td><select id="product_category" name="category_id" required class="regular-text">';
echo '<option value="">Select a Category</option>';
foreach ($categories as $category) {
    echo "<option value='{$category->id}'>{$category->name}</option>";
}
echo '</select></td></tr>';

echo '</table>';
echo '<p class="submit"><button type="submit" class="button button-primary">Add Product</button></p>';
echo '</form>';
echo '</div>'; // End of add product form

echo '</div>'; // End of wrap

}
