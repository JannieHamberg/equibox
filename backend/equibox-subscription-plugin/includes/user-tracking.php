<?php
if (!defined('ABSPATH')) {
    exit;
}

function add_user_type_to_datalayer() {
    if (!is_user_logged_in()) {
        $user_type = 'Guest';
    } else {
        $user = wp_get_current_user();
        if (in_array('administrator', $user->roles)) {
            $user_type = 'Admin';
        } else {
            $user_type = 'Subscriber';
        }
    }

    echo "<script>
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'user_type': '{$user_type}'
        });
    </script>";
} 

add_action('wp_head', 'add_user_type_to_datalayer'); 
