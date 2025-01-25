<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class MailPoet_Subscriber_Handler {
    public static function add_subscriber($request) {
        if (!class_exists(\MailPoet\API\API::class)) {
            return new WP_Error('mailpoet_not_loaded', 'MailPoet is not available.', ['status' => 500]);
        }

        $parameters = $request->get_json_params();
        $email = sanitize_email($parameters['email']);
        $list_ids = array_map('intval', $parameters['lists'] ?? []);

        if (empty($email) || empty($list_ids)) {
            return new WP_Error('invalid_data', 'Email and List IDs are required.', ['status' => 400]);
        }

        $mailpoet_api = \MailPoet\API\API::MP('v1');
        $subscriber_data = [
            'email' => $email,
            'first_name' => $parameters['first_name'] ?? '',
            'last_name' => $parameters['last_name'] ?? '',
        ];

        $result = $mailpoet_api->addSubscriber($subscriber_data, $list_ids);

        if (is_wp_error($result)) {
            return $result;
        }

        return ['success' => true, 'message' => 'Subscriber added successfully.'];
    }
}
