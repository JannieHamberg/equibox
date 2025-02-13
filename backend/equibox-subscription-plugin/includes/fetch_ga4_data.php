<?php

function create_jwt($key_data) {
    $header = [
        'alg' => 'RS256',
        'typ' => 'JWT'
    ];
    
    $time = time();
    $payload = [
        'iss' => $key_data['client_email'],
        'scope' => 'https://www.googleapis.com/auth/analytics.readonly',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $time + 3600,
        'iat' => $time
    ];

    $base64_header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($header)));
    $base64_payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    $private_key = openssl_pkey_get_private($key_data['private_key']);
    openssl_sign(
        $base64_header . '.' . $base64_payload,
        $signature,
        $private_key,
        'SHA256'
    );
    
    $base64_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64_header . '.' . $base64_payload . '.' . $base64_signature;
}

function fetch_ga4_data() {
    $property_id = '475314395';
    
    // Get JSON key file path from wp-config.php
    $KEY_FILE_LOCATION = defined('GA_KEY_FILE_PATH') ? GA_KEY_FILE_PATH : '';

    if (!file_exists($KEY_FILE_LOCATION)) {
        return ['error' => 'Google Analytics JSON key file not found'];
    }

    // Read the key file
    $key_data = json_decode(file_get_contents($KEY_FILE_LOCATION), true);

    // Get access token
    $token_url = 'https://oauth2.googleapis.com/token';
    $jwt = create_jwt($key_data);

    $token_response = wp_remote_post($token_url, [
        'body' => [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]
    ]);

    if (is_wp_error($token_response)) {
        return ['error' => $token_response->get_error_message()];
    }

    $token_data = json_decode(wp_remote_retrieve_body($token_response), true);
    
    if (!isset($token_data['access_token'])) {
        return ['error' => 'Failed to obtain access token'];
    }

    // Make the GA4 API request
    $api_endpoint = "https://analyticsdata.googleapis.com/v1beta/properties/{$property_id}:runReport";
    
    $request_body = [
        'dateRanges' => [
            ['startDate' => '30daysAgo', 'endDate' => 'today']
        ],
        'metrics' => [
            ['name' => 'activeUsers'],
            ['name' => 'sessions'],
            ['name' => 'screenPageViews'],
            ['name' => 'screenPageViewsPerSession'],
            ['name' => 'averageSessionDuration'],
            ['name' => 'bounceRate']
        ],
        'dimensions' => [
            ['name' => 'customEvent:user_type'], // Custom dimension 
            ['name' => 'pageTitle'],
            ['name' => 'country'],
          

        ]
    ];

    $response = wp_remote_post($api_endpoint, [
        'headers' => [
            'Authorization' => 'Bearer ' . $token_data['access_token'],
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode($request_body),
        'timeout' => 30,
    ]);

    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message()];
    }

    return json_decode(wp_remote_retrieve_body($response), true);
}
