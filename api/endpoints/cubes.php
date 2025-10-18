<?php
/**
 * Data Cubes API endpoint - Fast pre-aggregated data access
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $cube = $_GET['cube'] ?? null;
            $partnerId = $_GET['partner_id'] ?? null;
            
            switch ($cube) {
                case 'dashboard':
                    // Partner dashboard metrics (home page)
                    if ($partnerId) {
                        $stmt = $db->prepare("SELECT * FROM cube_partner_dashboard WHERE partner_id = ?");
                        $stmt->execute([$partnerId]);
                    } else {
                        $stmt = $db->prepare("SELECT * FROM cube_partner_dashboard ORDER BY total_commissions DESC");
                        $stmt->execute();
                    }
                    $data = $partnerId ? $stmt->fetch() : $stmt->fetchAll();
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'client_tiers':
                    // Client tier distribution
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT tier, client_count, percentage 
                        FROM cube_client_tiers 
                        WHERE partner_id = ?
                        ORDER BY client_count DESC
                    ");
                    $stmt->execute([$partnerId]);
                    $data = $stmt->fetchAll();
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'demographics':
                    // Client demographics
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $dimension = $_GET['dimension'] ?? 'all';
                    
                    if ($dimension === 'all') {
                        $stmt = $db->prepare("
                            SELECT dimension, dimension_value, client_count, percentage 
                            FROM cube_client_demographics 
                            WHERE partner_id = ?
                            ORDER BY dimension, client_count DESC
                        ");
                        $stmt->execute([$partnerId]);
                    } else {
                        $stmt = $db->prepare("
                            SELECT dimension_value, client_count, percentage 
                            FROM cube_client_demographics 
                            WHERE partner_id = ? AND dimension = ?
                            ORDER BY client_count DESC
                        ");
                        $stmt->execute([$partnerId, $dimension]);
                    }
                    
                    $data = $stmt->fetchAll();
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'commissions':
                    // Commissions by time period
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $grouping = $_GET['grouping'] ?? 'monthly'; // 'daily' or 'monthly'
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
                    
                    if ($grouping === 'daily') {
                        $stmt = $db->prepare("
                            SELECT 
                                trade_date as date,
                                commission_plan,
                                total_commissions,
                                trade_count
                            FROM cube_commissions_daily
                            WHERE partner_id = ?
                            ORDER BY trade_date DESC
                            LIMIT ?
                        ");
                    } else {
                        $stmt = $db->prepare("
                            SELECT 
                                year_month as date,
                                commission_plan,
                                total_commissions,
                                trade_count
                            FROM cube_commissions_monthly
                            WHERE partner_id = ?
                            ORDER BY year_month DESC
                            LIMIT ?
                        ");
                    }
                    
                    $stmt->execute([$partnerId, $limit]);
                    $data = $stmt->fetchAll();
                    echo json_encode(ApiResponse::success([
                        'grouping' => $grouping,
                        'data' => $data
                    ]));
                    break;
                    
                case 'countries':
                    // Country performance
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT 
                            country,
                            client_count,
                            total_deposits,
                            total_commissions,
                            total_trades
                        FROM cube_country_performance
                        WHERE partner_id = ?
                        ORDER BY client_count DESC
                    ");
                    $stmt->execute([$partnerId]);
                    $data = $stmt->fetchAll();
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'badge_progress':
                    // Badge progress
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT 
                            total_commissions,
                            total_deposits,
                            badges_earned,
                            last_updated
                        FROM cube_badge_progress
                        WHERE partner_id = ?
                    ");
                    $stmt->execute([$partnerId]);
                    $data = $stmt->fetch();
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'daily_commissions_plan':
                    // Daily commissions by plan
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT trade_date, commission_plan, total_commissions, trade_count
                        FROM cube_daily_commissions_plan
                        WHERE partner_id = ?
                        ORDER BY trade_date DESC
                        LIMIT 90
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'daily_commissions_platform':
                    // Daily commissions by platform
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT trade_date, platform, total_commissions, trade_count
                        FROM cube_daily_commissions_platform
                        WHERE partner_id = ?
                        ORDER BY trade_date DESC
                        LIMIT 90
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'commissions_product':
                    // Commissions by product (asset type/contract type)
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT asset_type, contract_type, total_commissions, trade_count
                        FROM cube_commissions_product
                        WHERE partner_id = ?
                        ORDER BY total_commissions DESC
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'commissions_symbol':
                    // Top symbols by commissions
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                    $stmt = $db->prepare("
                        SELECT asset, total_commissions, trade_count
                        FROM cube_commissions_symbol
                        WHERE partner_id = ?
                        ORDER BY total_commissions DESC
                        LIMIT ?
                    ");
                    $stmt->execute([$partnerId, $limit]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'daily_signups':
                    // Daily client signups
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT signup_date, commission_plan, platform, signup_count
                        FROM cube_daily_signups
                        WHERE partner_id = ?
                        ORDER BY signup_date DESC
                        LIMIT 90
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'daily_funding':
                    // Daily deposits & withdrawals
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT funding_date, category, total_amount, transaction_count
                        FROM cube_daily_funding
                        WHERE partner_id = ?
                        ORDER BY funding_date DESC
                        LIMIT 90
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'product_volume':
                    // Product volume and trading activity
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT asset_type, total_volume, trade_count, avg_trade_size, client_count
                        FROM cube_product_volume
                        WHERE partner_id = ?
                        ORDER BY total_volume DESC
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'daily_trends':
                    // Daily performance trends
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
                    $stmt = $db->prepare("
                        SELECT trend_date, signups, deposits, commissions, trades
                        FROM cube_daily_trends
                        WHERE partner_id = ?
                        ORDER BY trend_date DESC
                        LIMIT ?
                    ");
                    $stmt->execute([$partnerId, $days]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'partner_countries':
                    // Get countries for a specific partner
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $stmt = $db->prepare("
                        SELECT country, client_count
                        FROM cube_partner_countries
                        WHERE partner_id = ?
                        ORDER BY client_count DESC
                    ");
                    $stmt->execute([$partnerId]);
                    echo json_encode(ApiResponse::success($stmt->fetchAll()));
                    break;
                    
                case 'refresh':
                    // Manual refresh (admin only - add auth check in production)
                    try {
                        $stmt = $db->prepare("CALL populate_all_cubes()");
                        $stmt->execute();
                        $message = "All cubes refreshed successfully";
                        echo json_encode(ApiResponse::success(null, $message));
                    } catch (Exception $e) {
                        http_response_code(500);
                        echo json_encode(ApiResponse::error('Refresh failed: ' . $e->getMessage(), 500));
                    }
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(ApiResponse::error('Invalid cube type', 400));
                    break;
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
?>

