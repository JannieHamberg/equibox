// Load Google Charts and set callback
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    // Check if we have data
    if (!window.userTypeChartData || !userTypeChartData.data) {
        console.error("No data found for Google Charts.");
        return;
    }

    // Create the data table
    var data = google.visualization.arrayToDataTable(userTypeChartData.data);

    // Set chart options
    var options = {
        title: 'Pie chart - user type',
        pieHole: 0.4, 
        colors: ['#2271b1', '#72aee6'], 
        chartArea: {
            width: '70%',
            height: '70%'
        },
        legend: {
            position: 'right',
            alignment: 'center',
            textStyle: {
                color: '#333',
                fontSize: 14
            }
        },
        animation: {
            startup: true,
            duration: 1000,
            easing: 'out'
        },
        tooltip: {
            showColorCode: true,
            text: 'value'
        },
        pieSliceText: 'percentage'
    };

    // Instantiate and draw the chart
    var chart = new google.visualization.PieChart(document.getElementById('userTypeChart'));
    chart.draw(data, options);
}

// Redraw chart on window resize
window.addEventListener('resize', drawChart);
