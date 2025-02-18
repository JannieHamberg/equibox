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

// Enqueue Google Charts & Custom Dashboard JS
function enqueue_analytics_scripts($hook) {
    if ($hook !== 'toplevel_page_analytics-statistics') {
        return;
    }

    // Load Google Charts library
    wp_enqueue_script('google-charts', 'https://www.gstatic.com/charts/loader.js', [], null, true);
    
    // Load our custom analytics JS
    wp_enqueue_script(
        'analytics-dashboard-js', 
        plugin_dir_url(dirname(__FILE__)) . 'assets/js/analytics-dashboard.js', 
        ['google-charts'], 
        '1.0.0', 
        true
    );
}
add_action('admin_enqueue_scripts', 'enqueue_analytics_scripts');

function render_analytics_dashboard() {
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have sufficient permissions to access this page.'));
    }

    $analytics_data = fetch_ga4_data();

    if (isset($analytics_data['error'])) {
        echo '<div class="wrap">';
        echo '<h1>Analytics Statistics</h1>';
        echo '<div class="notice notice-error"><p>Error: <pre>' . esc_html(print_r($analytics_data['error'], true)) . '</pre></p></div>';
        echo '</div>';
        return;
    }

    // Initialize Data Arrays
    $total_users = 0;
    $total_sessions = 0;
    $total_pageviews = 0;
    $country_data = [];
    $page_data = [];
    $user_type_data = []; // Custom user type dimension

    // Process GA4 Data
    if (isset($analytics_data['rows'])) {
        foreach ($analytics_data['rows'] as $row) {
            $metrics = $row['metricValues'];
            $dimensions = $row['dimensionValues'];

            $total_users += intval($metrics[0]['value']);
            $total_sessions += intval($metrics[1]['value']);
            $total_pageviews += intval($metrics[2]['value']);

            // Organize by user type (Guest, Logged-in User)
            $user_type = !empty($dimensions[0]['value']) ? $dimensions[0]['value'] : 'guest';
            $page = isset($dimensions[1]['value']) ? $dimensions[1]['value'] : '(not set)'; 
            $country = isset($dimensions[2]['value']) ? $dimensions[2]['value'] : '(not set)'; 

            // Organize by user type (Guest, Admin, Logged-in User)
            if (!isset($user_type_data[$user_type])) {
                $user_type_data[$user_type] = [
                    'users' => 0,
                    'sessions' => 0,
                    'pageviews' => 0
                ];
            }
            $user_type_data[$user_type]['users'] += intval($metrics[0]['value']);
            $user_type_data[$user_type]['sessions'] += intval($metrics[1]['value']);
            $user_type_data[$user_type]['pageviews'] += intval($metrics[2]['value']);

            // Organize by country
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
            if (!isset($page_data[$page])) {
                $page_data[$page] = [
                    'users' => intval($metrics[0]['value']),
                    'sessions' => intval($metrics[1]['value']),
                    'pageviews' => intval($metrics[2]['value']),
                    'bounce_rate' => isset($metrics[5]['value']) ? floatval($metrics[5]['value']) : 0
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

            <h2>User Type Breakdown</h2>
            <div id="userTypeChart" style="width: 100%; height: 400px; margin-bottom: 30px;"></div>

            <?php
            // Prepare and localize the data for the chart
            $chart_data = array(array('User Type', 'Users'));
            foreach ($user_type_data as $type => $data) {
                // Skip "(not set)" entries
                if ($type !== '(not set)') {
                    $chart_data[] = array($type, intval($data['users']));
                }
            }
            wp_localize_script('analytics-dashboard-js', 'userTypeChartData', array('data' => $chart_data));
            ?>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>User Type</th>
                        <th>Users</th>
                        <th>Sessions</th>
                        <th>Pageviews</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    foreach ($user_type_data as $type => $data) {
                        echo "<tr>
                            <td>" . esc_html($type) . "</td>
                            <td>" . number_format($data['users']) . "</td>
                            <td>" . number_format($data['sessions']) . "</td>
                            <td>" . number_format($data['pageviews']) . "</td>
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
