<?php
/**
 * Metrics API endpoint
 */

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $partnerId = $_GET['partner_id'] ?? null;
            
            // Calculate metrics
            $metrics = calculatePartnerMetrics($db, $partnerId);
            
            echo json_encode(ApiResponse::success($metrics));
            break;
            
        default:
            http_response_code(405);
            echo json_encode(ApiResponse::error('Method not allowed', 405));
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(ApiResponse::error('Internal server error: ' . $e->getMessage(), 500));
}

/**
 * Calculate partner metrics
 */
function calculatePartnerMetrics($db, $partnerId = null) {
    $metrics = [
        'partnerName' => 'All partners',
        'partnerTier' => '—',
        'ltClients' => 0,
        'ltDeposits' => 0,
        'ltCommissions' => 0,
        'ltVolume' => 0,
        'mtdComm' => 0,
        'mtdVolume' => 0,
        'mtdDeposits' => 0,
        'mtdClients' => 0
    ];
    
    // Get partner info if specified
    if ($partnerId) {
        $stmt = $db->prepare("SELECT name, tier FROM partners WHERE partner_id = ?");
        $stmt->execute([$partnerId]);
        $partner = $stmt->fetch();
        if ($partner) {
            $metrics['partnerName'] = $partner['name'];
            $metrics['partnerTier'] = $partner['tier'] ?? '—';
        }
    }
    
    // Build WHERE clause for partner filter
    $whereClause = $partnerId ? "WHERE c.partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    // Lifetime metrics
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT c.customer_id) as total_clients,
            COALESCE(SUM(c.lifetime_deposits), 0) as total_deposits,
            COALESCE(SUM(t.commission), 0) as total_commissions,
            COUNT(t.id) as total_trades
        FROM clients c
        LEFT JOIN trades t ON c.customer_id = t.customer_id
        $whereClause
    ");
    $stmt->execute($params);
    $lifetime = $stmt->fetch();
    
    $metrics['ltClients'] = (int)$lifetime['total_clients'];
    $metrics['ltDeposits'] = (float)$lifetime['total_deposits'];
    $metrics['ltCommissions'] = (float)$lifetime['total_commissions'];
    $metrics['ltVolume'] = (int)$lifetime['total_trades'];
    
    // Monthly metrics (current month)
    $currentMonth = date('Y-m');
    $monthParams = array_merge($params, [$currentMonth . '-01', $currentMonth . '-31']);
    
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT c.customer_id) as new_clients,
            COALESCE(SUM(d.value), 0) as month_deposits,
            COALESCE(SUM(t.commission), 0) as month_commissions,
            COUNT(t.id) as month_trades
        FROM clients c
        LEFT JOIN trades t ON c.customer_id = t.customer_id AND DATE_FORMAT(t.date_time, '%Y-%m') = ?
        LEFT JOIN deposits d ON c.customer_id = d.customer_id AND DATE_FORMAT(d.date_time, '%Y-%m') = ?
        $whereClause
    ");
    $stmt->execute($monthParams);
    $monthly = $stmt->fetch();
    
    $metrics['mtdClients'] = (int)$monthly['new_clients'];
    $metrics['mtdDeposits'] = (float)$monthly['month_deposits'];
    $metrics['mtdComm'] = (float)$monthly['month_commissions'];
    $metrics['mtdVolume'] = (int)$monthly['month_trades'];
    
    return $metrics;
}
?>
