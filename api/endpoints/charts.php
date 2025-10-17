<?php
/**
 * Charts API endpoint
 */

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $chartType = $_GET['type'] ?? '';
            $partnerId = $_GET['partner_id'] ?? null;
            
            switch ($chartType) {
                case 'six-month-commissions':
                    $data = getSixMonthCommissions($db, $partnerId);
                    break;
                    
                case 'tier-distribution':
                    $data = getTierDistribution($db, $partnerId);
                    break;
                    
                case 'population':
                    $data = getPopulationDistribution($db, $partnerId);
                    break;
                    
                case 'country-analysis':
                    $data = getCountryAnalysis($db, $partnerId);
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(ApiResponse::error('Invalid chart type', 400));
                    return;
            }
            
            echo json_encode(ApiResponse::success($data));
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
 * Get six months commission data
 */
function getSixMonthCommissions($db, $partnerId = null) {
    $data = [];
    $currentDate = new DateTime();
    
    // Generate last 6 months
    for ($i = 5; $i >= 0; $i--) {
        $date = clone $currentDate;
        $date->modify("-$i months");
        $monthKey = $date->format('Y-m');
        $monthLabel = $date->format('M');
        
        $data[] = [
            'key' => $monthKey,
            'label' => $monthLabel,
            'value' => 0
        ];
    }
    
    // Build query
    $whereClause = $partnerId ? "WHERE c.partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            DATE_FORMAT(t.date_time, '%Y-%m') as month,
            SUM(t.commission) as total_commission
        FROM clients c
        JOIN trades t ON c.customer_id = t.customer_id
        $whereClause
        AND t.date_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(t.date_time, '%Y-%m')
        ORDER BY month
    ");
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    // Update data with actual values
    foreach ($results as $result) {
        foreach ($data as &$item) {
            if ($item['key'] === $result['month']) {
                $item['value'] = (float)$result['total_commission'];
                break;
            }
        }
    }
    
    return $data;
}

/**
 * Get tier distribution data
 */
function getTierDistribution($db, $partnerId = null) {
    $whereClause = $partnerId ? "WHERE partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            tier,
            COUNT(*) as count
        FROM clients
        $whereClause
        GROUP BY tier
        ORDER BY 
            CASE tier
                WHEN 'Bronze' THEN 1
                WHEN 'Silver' THEN 2
                WHEN 'Gold' THEN 3
                WHEN 'Platinum' THEN 4
                ELSE 5
            END
    ");
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    $data = [];
    foreach ($results as $result) {
        $data[] = [
            'tier' => $result['tier'],
            'count' => (int)$result['count']
        ];
    }
    
    return $data;
}

/**
 * Get population distribution by age groups
 */
function getPopulationDistribution($db, $partnerId = null) {
    $whereClause = $partnerId ? "WHERE partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            CASE 
                WHEN age BETWEEN 18 AND 25 THEN '18-25'
                WHEN age BETWEEN 26 AND 35 THEN '26-35'
                WHEN age BETWEEN 36 AND 45 THEN '36-45'
                WHEN age BETWEEN 46 AND 55 THEN '46-55'
                WHEN age BETWEEN 56 AND 65 THEN '56-65'
                WHEN age > 65 THEN '65+'
                ELSE 'Unknown'
            END as age_group,
            COUNT(*) as count
        FROM clients
        $whereClause
        GROUP BY age_group
        ORDER BY 
            CASE age_group
                WHEN '18-25' THEN 1
                WHEN '26-35' THEN 2
                WHEN '36-45' THEN 3
                WHEN '46-55' THEN 4
                WHEN '56-65' THEN 5
                WHEN '65+' THEN 6
                ELSE 7
            END
    ");
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    $data = [];
    foreach ($results as $result) {
        $data[] = [
            'age_group' => $result['age_group'],
            'count' => (int)$result['count']
        ];
    }
    
    return $data;
}

/**
 * Get country analysis data
 */
function getCountryAnalysis($db, $partnerId = null) {
    $whereClause = $partnerId ? "WHERE c.partner_id = ?" : "";
    $params = $partnerId ? [$partnerId] : [];
    
    $stmt = $db->prepare("
        SELECT 
            c.country,
            COUNT(DISTINCT c.customer_id) as client_count,
            COALESCE(SUM(c.lifetime_deposits), 0) as total_deposits,
            COALESCE(SUM(t.commission), 0) as total_commissions,
            COUNT(t.id) as total_trades
        FROM clients c
        LEFT JOIN trades t ON c.customer_id = t.customer_id
        $whereClause
        GROUP BY c.country
        ORDER BY client_count DESC
    ");
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    $data = [];
    foreach ($results as $result) {
        $data[] = [
            'country' => $result['country'],
            'clients' => (int)$result['client_count'],
            'deposits' => (float)$result['total_deposits'],
            'commissions' => (float)$result['total_commissions'],
            'trades' => (int)$result['total_trades']
        ];
    }
    
    return $data;
}
?>
