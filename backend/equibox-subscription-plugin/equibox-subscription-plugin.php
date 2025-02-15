<?php
/*
Plugin Name: Equibox Subscription Plugin
Plugin URI: https://equibox.se
Description: Custom subscription plugin for Equibox using WordPress.
Version: 1.0.0
Author: Jannie Hamberg
Author URI: https://equibox.se
License: GPL2
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Enable debugging and logging during development
if (defined('WP_DEBUG') && WP_DEBUG) {
    if (!defined('WP_DEBUG_LOG')) {
        define('WP_DEBUG_LOG', true);
    }
}

// Include required classes

require_once plugin_dir_path(__FILE__) . 'includes/class-rest-api.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-stripe-integration.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-stripe-webhook-handler.php';

require_once plugin_dir_path(__FILE__) . 'includes/client-secret-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/subscription-user-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/subscription-admin-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-box-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-product-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-membershop-handler.php';

require_once plugin_dir_path(__FILE__) . 'includes/admin-dashboard.php';
require_once plugin_dir_path(__FILE__) . 'includes/analytics-dashboard.php';
require_once plugin_dir_path(__FILE__) . 'includes/fetch_ga4_data.php';

// Enqueue styles and scripts for the admin dashboard
add_action('admin_enqueue_scripts', function ($hook) {
    /* error_log('Current hook: ' . $hook); */

    // Load scripts only on the admin dashboard page
    if ($hook !== 'toplevel_page_admin-dashboard') {
        return;
    }

    wp_enqueue_style(
        'equibox-admin-dashboard',
        plugin_dir_url(__FILE__) . 'assets/css/admin-dashboard.css',
        [],
        '1.0.0'
    );

    wp_enqueue_script(
        'equibox-admin-dashboard',
        plugin_dir_url(__FILE__) . 'assets/js/admin-dashboard.js',
        [],
        '1.0.0',
        true
    );

    // Localize script to pass nonce and REST URL to the JS
    wp_localize_script('equibox-admin-dashboard', 'wpApiSettings', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
    ]);
});


// Initialize the plugin
function equibox_subscription_plugin_init() {
    REST_API::init();
    Stripe_Integration::init(); 
    
}
add_action('plugins_loaded', 'equibox_subscription_plugin_init');
