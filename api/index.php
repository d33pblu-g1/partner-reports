<?php
/**
 * Partner Report API - Main endpoint
 */

require_once 'config.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];

// Check if endpoint is provided as query parameter (for direct access)
if (isset($_GET['endpoint'])) {
    $path = $_GET['endpoint'];
} else {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = str_replace('/api', '', $path);
    $path = trim($path, '/');
}

// Get query parameters
$queryParams = $_GET;

// Route handling
switch ($path) {
    case '':
    case 'dashboard':
        require_once 'endpoints/dashboard.php';
        break;
        
    case 'partners':
        require_once 'endpoints/partners.php';
        break;
        
    case 'clients':
        require_once 'endpoints/clients.php';
        break;
        
    case 'trades':
        require_once 'endpoints/trades.php';
        break;
        
    case 'deposits':
        require_once 'endpoints/deposits.php';
        break;
        
    case 'metrics':
        require_once 'endpoints/metrics.php';
        break;
        
    case 'charts':
        require_once 'endpoints/charts.php';
        break;
        
    case 'commissions':
        require_once 'endpoints/commissions.php';
        break;
        
    case 'badges':
        require_once 'endpoints/badges.php';
        break;
        
    case 'all_tables':
        require_once 'endpoints/all_tables.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode(ApiResponse::error('Endpoint not found', 404));
        break;
}
?>
