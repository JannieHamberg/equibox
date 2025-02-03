<?php
// Add the menu item for the analytics dashboard
add_action('admin_menu', function () {
    add_menu_page(
        'Analytics Statistics',
        'Analytics Stats',
        'manage_options',
        'analytics-statistics',
        'render_analytics_dashboard',
        'dashicons-chart-area',
        7
    );
});

function render_analytics_dashboard() {
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have sufficient permissions to access this page.'));
    }

    $analytics_data = fetch_ga4_data();

    if (isset($analytics_data['error'])) {
        echo '<div class="wrap">';
        echo '<h1>Analytics Statistics</h1>';
        echo '<div class="notice notice-error"><p>Error: ' . esc_html($analytics_data['error']) . '</p></div>';
        echo '</div>';
        return;
    }

    // Process the data
    $total_users = 0;
    $total_sessions = 0;
    $total_pageviews = 0;
    $country_data = [];
    $page_data = [];

    if (isset($analytics_data['rows'])) {
        foreach ($analytics_data['rows'] as $row) {
            $metrics = $row['metricValues'];
            $dimensions = $row['dimensionValues'];
            
            $total_users += intval($metrics[0]['value']);
            $total_sessions += intval($metrics[1]['value']);
            $total_pageviews += intval($metrics[2]['value']);

            // Organize by country
            $country = $dimensions[1]['value'];
            if (!isset($country_data[$country])) {
                $country_data[$country] = [
                    'users' => 0,
                    'sessions' => 0,
                    'pageviews' => 0
                ];
            }
            $country_data[$country]['users'] += intval($metrics[0]['value']);
            $country_data[$country]['sessions'] += intval($metrics[1]['value']);
            $country_data[$country]['pageviews'] += intval($metrics[2]['value']);

            // Organize by page
            $page = $dimensions[0]['value'];
            if (!isset($page_data[$page])) {
                $page_data[$page] = [
                    'users' => intval($metrics[0]['value']),
                    'sessions' => intval($metrics[1]['value']),
                    'pageviews' => intval($metrics[2]['value']),
                    'bounce_rate' => floatval($metrics[5]['value'])
                ];
            }
        }
    }

    // Display the dashboard
    ?>
    <div class="wrap">
        <h1>Analytics Statistics</h1>
        
        <div class="analytics-overview">
            <h2>Overview (Last 30 Days)</h2>
            <div class="analytics-cards">
                <div class="analytics-card">
                    <h3>Total Users</h3>
                    <p><?php echo number_format($total_users); ?></p>
                </div>
                <div class="analytics-card">
                    <h3>Total Sessions</h3>
                    <p><?php echo number_format($total_sessions); ?></p>
                </div>
                <div class="analytics-card">
                    <h3>Total Pageviews</h3>
                    <p><?php echo number_format($total_pageviews); ?></p>
                </div>
            </div>

            <h2>Top Countries</h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Users</th>
                        <th>Sessions</th>
                        <th>Pageviews</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    arsort($country_data);
                    foreach (array_slice($country_data, 0, 10) as $country => $data) {
                        echo "<tr>
                            <td>" . esc_html($country) . "</td>
                            <td>" . number_format($data['users']) . "</td>
                            <td>" . number_format($data['sessions']) . "</td>
                            <td>" . number_format($data['pageviews']) . "</td>
                        </tr>";
                    }
                    ?>
                </tbody>
            </table>

            <h2>Top Pages</h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Users</th>
                        <th>Sessions</th>
                        <th>Pageviews</th>
                        <th>Bounce Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    uasort($page_data, function($a, $b) {
                        return $b['pageviews'] - $a['pageviews'];
                    });
                    foreach (array_slice($page_data, 0, 10) as $page => $data) {
                        echo "<tr>
                            <td>" . esc_html($page) . "</td>
                            <td>" . number_format($data['users']) . "</td>
                            <td>" . number_format($data['sessions']) . "</td>
                            <td>" . number_format($data['pageviews']) . "</td>
                            <td>" . number_format($data['bounce_rate'], 2) . "%</td>
                        </tr>";
                    }
                    ?>
                </tbody>
            </table>
        </div>
    </div>

    <style>
        .analytics-overview {
            margin-top: 20px;
        }
        .analytics-cards {
            display: flex;
            gap: 20px;
            margin: 20px 0 30px;
        }
        .analytics-card {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            flex: 1;
            text-align: center;
        }
        .analytics-card h3 {
            margin: 0 0 10px 0;
            color: #23282d;
        }
        .analytics-card p {
            font-size: 24px;
            margin: 0;
            color: #2271b1;
        }
        .wp-list-table {
            margin-top: 15px;
            margin-bottom: 30px;
        }
    </style>
    <?php
}
