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

require_once plugin_dir_path(__FILE__) . 'includes/class-subscription-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-box-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-product-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-rest-api.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-stripe-webhooks.php';


// Initialize plugin
function equibox_subscription_plugin_init() {
    REST_API::init();
    Stripe_Webhooks::init();
}
add_action('plugins_loaded', 'equibox_subscription_plugin_init');
