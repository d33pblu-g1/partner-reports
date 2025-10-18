<?php
/**
 * All Tables API endpoint - Returns all database tables for database page
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Check if user wants to load all records (no limit)
            $loadAll = isset($_GET['load_all']) && $_GET['load_all'] === 'true';
            
            // Get all tables data
            $allTables = [];
            
            // Get partners
            $stmt = $db->prepare("SELECT * FROM partners ORDER BY name");
            $stmt->execute();
            $allTables['partners'] = $stmt->fetchAll();
            
            // Get clients
            $stmt = $db->prepare("SELECT * FROM clients ORDER BY name");
            $stmt->execute();
            $allTables['clients'] = $stmt->fetchAll();
            
            // Get trades (with optional limit)
            if ($loadAll) {
                $stmt = $db->prepare("SELECT * FROM trades ORDER BY date DESC");
            } else {
                $stmt = $db->prepare("SELECT * FROM trades ORDER BY date DESC LIMIT 1000");
            }
            $stmt->execute();
            $allTables['trades'] = $stmt->fetchAll();
            
            // Get deposits (with optional limit)
            if ($loadAll) {
                $stmt = $db->prepare("SELECT * FROM deposits ORDER BY date_time DESC");
            } else {
                $stmt = $db->prepare("SELECT * FROM deposits ORDER BY date_time DESC LIMIT 1000");
            }
            $stmt->execute();
            $allTables['deposits'] = $stmt->fetchAll();
            
            // Get badges
            $stmt = $db->prepare("SELECT * FROM badges ORDER BY badge_criteria, badge_name");
            $stmt->execute();
            $allTables['badges'] = $stmt->fetchAll();
            
            // Get partner_badges
            $stmt = $db->prepare("SELECT * FROM partner_badges ORDER BY partner_id, badge_name");
            $stmt->execute();
            $allTables['partner_badges'] = $stmt->fetchAll();
            
            // Get partner_tiers
            $stmt = $db->prepare("SELECT * FROM partner_tiers ORDER BY tier");
            $stmt->execute();
            $allTables['partner_tiers'] = $stmt->fetchAll();
            
            // Add metadata about whether all records were loaded
            $allTables['_metadata'] = [
                'load_all' => $loadAll,
                'has_limits' => !$loadAll
            ];
            
            echo json_encode(ApiResponse::success($allTables));
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

