<?php
/**
 * Dashboard API endpoint
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get dashboard data
            $partnerId = $_GET['partner_id'] ?? null;
            
            // Get all data for dashboard
            $dashboardData = [
                'partners' => [],
                'clients' => [],
                'trades' => [],
                'deposits' => [],
                'partnerTiers' => []
            ];
            
            // Get partners
            $stmt = $db->prepare("SELECT * FROM partners ORDER BY name");
            $stmt->execute();
            $dashboardData['partners'] = $stmt->fetchAll();
            
            // Get partner tiers
            $stmt = $db->prepare("SELECT * FROM partner_tiers ORDER BY tier");
            $stmt->execute();
            $dashboardData['partnerTiers'] = $stmt->fetchAll();
            
            // Get clients (with optional partner filter)
            if ($partnerId) {
                $stmt = $db->prepare("SELECT * FROM clients WHERE partner_id = ? ORDER BY name");
                $stmt->execute([$partnerId]);
            } else {
                $stmt = $db->prepare("SELECT * FROM clients ORDER BY name");
                $stmt->execute();
            }
            $dashboardData['clients'] = $stmt->fetchAll();
            
            // Get trades for filtered clients
            $clientIds = array_column($dashboardData['clients'], 'customer_id');
            if (!empty($clientIds)) {
                $placeholders = str_repeat('?,', count($clientIds) - 1) . '?';
                $stmt = $db->prepare("SELECT * FROM trades WHERE customer_id IN ($placeholders) ORDER BY date_time DESC");
                $stmt->execute($clientIds);
                $dashboardData['trades'] = $stmt->fetchAll();
                
                // Get deposits for filtered clients
                $stmt = $db->prepare("SELECT * FROM deposits WHERE customer_id IN ($placeholders) ORDER BY date_time DESC");
                $stmt->execute($clientIds);
                $dashboardData['deposits'] = $stmt->fetchAll();
            }
            
            echo json_encode(ApiResponse::success($dashboardData));
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
