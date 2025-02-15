<?php

function check_user_auth_status() {
    if (is_user_logged_in()) {
        $user = wp_get_current_user();
        return new WP_REST_Response([
            'logged_in' => true,
            'user_type' => in_array('administrator', $user->roles) ? 'admin' : 'subscriber'
        ], 200);
    } else {
        return new WP_REST_Response(['logged_in' => false, 'user_type' => 'guest'], 200);
    }
}
