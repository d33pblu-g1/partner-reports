<?php
/**
 * Commissions API endpoint
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $chartType = $_GET['chart'] ?? '';
            $partnerId = $_GET['partner_id'] ?? null;
            $periodType = $_GET['period_type'] ?? 'daily';
            $limit = (int)($_GET['limit'] ?? 30);
            
            if ($chartType === 'stacked') {
                $data = getStackedCommissionData($db, $partnerId, $periodType, $limit);
                echo json_encode(ApiResponse::success($data));
            } else {
                // Get commission summary
                $data = getCommissionSummary($db, $partnerId);
                echo json_encode(ApiResponse::success($data));
            }
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
 * Get stacked commission data by plan
 */
function getStackedCommissionData($db, $partnerId = null, $periodType = 'daily', $limit = 30) {
    // Use cube table - cube_daily_commissions_plan
    $cubeName = 'cube_daily_commissions_plan';
    $useCube = tableExists($db, $cubeName);
    
    if ($useCube) {
        return getStackedDataFromCube($db, $partnerId, $periodType, $limit);
    } else {
        return getStackedDataFromTables($db, $partnerId, $periodType, $limit);
    }
}

/**
 * Get stacked data from cube table
 */
function getStackedDataFromCube($db, $partnerId, $periodType, $limit) {
    $params = [];
    $wherePartner = "";
    
    if ($partnerId) {
        $wherePartner = "WHERE partner_id = ?";
        $params[] = $partnerId;
    }
    
    if ($periodType === 'daily') {
        // Daily data - direct from cube
        $sql = "
            SELECT 
                trade_date as date,
                commission_plan,
                total_commissions as commission,
                trade_count
            FROM cube_daily_commissions_plan
            $wherePartner
            " . ($wherePartner ? "AND" : "WHERE") . " trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY trade_date ASC
            LIMIT ?
        ";
        $params[] = $limit;
        $params[] = $limit * 2; // Safety limit
    } else {
        // Monthly data - aggregate daily data by month
        $sql = "
            SELECT 
                DATE_FORMAT(trade_date, '%Y-%m-01') as date,
                commission_plan,
                SUM(total_commissions) as commission,
                SUM(trade_count) as trade_count
            FROM cube_daily_commissions_plan
            $wherePartner
            " . ($wherePartner ? "AND" : "WHERE") . " trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE_FORMAT(trade_date, '%Y-%m'), commission_plan
            ORDER BY date ASC
            LIMIT ?
        ";
        $params[] = $limit * 30; // Look back more days for monthly
        $params[] = $limit * 2;
    }
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    return formatStackedData($results, $periodType);
}

/**
 * Get stacked data from original tables
 */
function getStackedDataFromTables($db, $partnerId, $periodType, $limit) {
    $dateFormat = $periodType === 'daily' ? 'DATE(t.date)' : 'DATE_FORMAT(t.date, \'%Y-%m-01\')';
    $whereClause = $partnerId ? "WHERE t.affiliated_partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            $dateFormat as date,
            COALESCE(c.commissionPlan, 'Unknown') as commission_plan,
            SUM(t.closed_pnl_usd) as commission,
            SUM(t.number_of_trades) as trade_count
        FROM trades t
        LEFT JOIN clients c ON t.binary_user_id = c.binary_user_id
        $whereClause
        AND t.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY date, c.commissionPlan
        ORDER BY date ASC
    ");
    
    $params[] = $periodType === 'daily' ? $limit : $limit * 30;
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    return formatStackedData($results, $periodType);
}

/**
 * Format stacked data for chart
 */
function formatStackedData($results, $periodType) {
    $data = [
        'dates' => [],
        'series' => []
    ];
    
    // If no results, return empty data structure
    if (empty($results)) {
        return $data;
    }
    
    // Collect all unique dates and commission plans
    $dates = [];
    $plans = [];
    $dataByDate = [];
    
    foreach ($results as $row) {
        $date = $row['date'];
        $plan = $row['commission_plan'] ?? 'Unknown';
        $commission = (float)$row['commission'];
        
        if (!in_array($date, $dates)) {
            $dates[] = $date;
        }
        
        if (!in_array($plan, $plans)) {
            $plans[] = $plan;
        }
        
        if (!isset($dataByDate[$date])) {
            $dataByDate[$date] = [];
        }
        
        $dataByDate[$date][$plan] = $commission;
    }
    
    // Sort dates
    sort($dates);
    
    // Format dates for display
    $data['dates'] = array_map(function($date) use ($periodType) {
        try {
            $dt = new DateTime($date);
            return $periodType === 'daily' 
                ? $dt->format('M d') 
                : $dt->format('M Y');
        } catch (Exception $e) {
            return $date;
        }
    }, $dates);
    
    // Create series data
    $colors = [
        'RevShare 30%' => '#38bdf8',
        'RevShare 40%' => '#22c55e',
        'RevShare 50%' => '#f59e0b',
        'CPA' => '#ef4444',
        'Hybrid' => '#a855f7',
        'Unknown' => '#94a3b8'
    ];
    
    foreach ($plans as $plan) {
        $seriesData = [];
        foreach ($dates as $date) {
            $seriesData[] = $dataByDate[$date][$plan] ?? 0;
        }
        
        $data['series'][] = [
            'name' => $plan,
            'data' => $seriesData,
            'color' => $colors[$plan] ?? '#94a3b8'
        ];
    }
    
    return $data;
}

/**
 * Get commission summary
 */
function getCommissionSummary($db, $partnerId = null) {
    $whereClause = $partnerId ? "WHERE t.affiliated_partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT t.binary_user_id) as unique_clients,
            SUM(t.number_of_trades) as total_trades,
            SUM(t.closed_pnl_usd) as total_commission,
            AVG(t.closed_pnl_usd) as avg_commission,
            COALESCE(c.commissionPlan, 'Unknown') as commission_plan,
            SUM(CASE WHEN t.date = CURDATE() THEN t.number_of_trades ELSE 0 END) as trades_today,
            SUM(CASE WHEN t.date = CURDATE() THEN t.closed_pnl_usd ELSE 0 END) as commission_today
        FROM trades t
        LEFT JOIN clients c ON t.binary_user_id = c.binary_user_id
        $whereClause
        GROUP BY c.commissionPlan
    ");
    
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Check if table exists
 */
function tableExists($db, $tableName) {
    try {
        $stmt = $db->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$tableName]);
        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        return false;
    }
}
?>
