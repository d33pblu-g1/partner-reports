<?php
/**
 * Metrics API endpoint
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $partnerId = $_GET['partner_id'] ?? null;
            $useCache = !isset($_GET['no_cache']); // Allow bypassing cache for debugging
            
            // Try to get from cube first for better performance
            if ($useCache && $partnerId) {
                $stmt = $db->prepare("SELECT * FROM cube_partner_dashboard WHERE partner_id = ?");
                $stmt->execute([$partnerId]);
                $cached = $stmt->fetch();
                
                if ($cached) {
                    // Transform cube data to metrics format
                    $metrics = [
                        'partnerName' => $cached['partner_name'],
                        'partnerTier' => $cached['partner_tier'] ?? '—',
                        'ltClients' => (int)$cached['total_clients'],
                        'ltDeposits' => (float)$cached['total_deposits'],
                        'ltCommissions' => (float)$cached['total_commissions'],
                        'ltVolume' => (int)$cached['total_trades'],
                        'mtdClients' => (int)$cached['mtd_clients'],
                        'mtdDeposits' => (float)$cached['mtd_deposits'],
                        'mtdComm' => (float)$cached['mtd_commissions'],
                        'mtdVolume' => (int)$cached['mtd_trades'],
                        'last6Months' => [
                            (float)$cached['month_1_commissions'],
                            (float)$cached['month_2_commissions'],
                            (float)$cached['month_3_commissions'],
                            (float)$cached['month_4_commissions'],
                            (float)$cached['month_5_commissions'],
                            (float)$cached['month_6_commissions']
                        ],
                        '_cached' => true,
                        '_cache_time' => $cached['last_updated']
                    ];
                    echo json_encode(ApiResponse::success($metrics));
                    break;
                }
            }
            
            // Fallback to live calculation if no cache
            $metrics = calculatePartnerMetrics($db, $partnerId);
            $metrics['_cached'] = false;
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
            COUNT(DISTINCT c.binary_user_id) as total_clients,
            COALESCE(SUM(c.lifetimeDeposits), 0) as total_deposits,
            COALESCE(SUM(t.expected_revenue_usd), 0) as total_commissions,
            COUNT(t.id) as total_trades
        FROM clients c
        LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
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
            COUNT(DISTINCT c.binary_user_id) as new_clients,
            COALESCE(SUM(d.amount_usd), 0) as month_deposits,
            COALESCE(SUM(t.expected_revenue_usd), 0) as month_commissions,
            COUNT(t.id) as month_trades
        FROM clients c
        LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id AND DATE_FORMAT(t.date, '%Y-%m') = ?
        LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND DATE_FORMAT(d.transaction_time, '%Y-%m') = ?
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
