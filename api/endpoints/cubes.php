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
                    
                case 'refresh':
                    // Manual refresh (admin only - add auth check in production)
                    if ($partnerId) {
                        $stmt = $db->prepare("CALL refresh_partner_cubes(?)");
                        $stmt->execute([$partnerId]);
                        $message = "Cubes refreshed for partner {$partnerId}";
                    } else {
                        $stmt = $db->prepare("CALL refresh_all_cubes()");
                        $stmt->execute();
                        $message = "All cubes refreshed successfully";
                    }
                    echo json_encode(ApiResponse::success(null, $message));
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

