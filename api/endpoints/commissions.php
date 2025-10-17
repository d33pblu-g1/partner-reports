<?php
/**
 * Commissions API endpoint
 */

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
    // Try to use cube table first for better performance
    $useCube = tableExists($db, 'cube_commissions_by_plan');
    
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
    $whereClause = $partnerId ? "WHERE partner_id = ?" : "WHERE partner_id IS NOT NULL OR partner_id IS NULL";
    $params = $partnerId ? [$periodType, $partnerId] : [$periodType];
    
    $stmt = $db->prepare("
        SELECT 
            date,
            commission_plan,
            SUM(total_commission) as commission
        FROM cube_commissions_by_plan
        WHERE period_type = ?
        " . ($partnerId ? "AND partner_id = ?" : "") . "
        AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY date, commission_plan
        ORDER BY date ASC
    ");
    
    $params[] = $periodType === 'daily' ? $limit : $limit * 30;
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    return formatStackedData($results, $periodType);
}

/**
 * Get stacked data from original tables
 */
function getStackedDataFromTables($db, $partnerId, $periodType, $limit) {
    $dateFormat = $periodType === 'daily' ? 'DATE(t.date_time)' : 'DATE_FORMAT(t.date_time, \'%Y-%m-01\')';
    $whereClause = $partnerId ? "WHERE c.partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            $dateFormat as date,
            c.commission_plan,
            SUM(t.commission) as commission
        FROM trades t
        JOIN clients c ON t.customer_id = c.customer_id
        $whereClause
        AND t.date_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY date, c.commission_plan
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
        $dt = new DateTime($date);
        return $periodType === 'daily' 
            ? $dt->format('M d') 
            : $dt->format('M Y');
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
    $whereClause = $partnerId ? "WHERE c.partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT t.customer_id) as unique_clients,
            COUNT(t.id) as total_trades,
            SUM(t.commission) as total_commission,
            AVG(t.commission) as avg_commission,
            c.commission_plan,
            COUNT(CASE WHEN DATE(t.date_time) = CURDATE() THEN 1 END) as trades_today,
            SUM(CASE WHEN DATE(t.date_time) = CURDATE() THEN t.commission ELSE 0 END) as commission_today
        FROM trades t
        JOIN clients c ON t.customer_id = c.customer_id
        $whereClause
        GROUP BY c.commission_plan
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
