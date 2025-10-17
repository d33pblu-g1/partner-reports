<?php
/**
 * Clients API endpoint
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $partnerId = $_GET['partner_id'] ?? null;
            $country = $_GET['country'] ?? null;
            $tier = $_GET['tier'] ?? null;
            $limit = (int)($_GET['limit'] ?? 100);
            $offset = (int)($_GET['offset'] ?? 0);
            
            // Build WHERE clause
            $whereConditions = [];
            $params = [];
            
            if ($partnerId) {
                $whereConditions[] = "partner_id = ?";
                $params[] = $partnerId;
            }
            
            if ($country) {
                $whereConditions[] = "country = ?";
                $params[] = $country;
            }
            
            if ($tier) {
                $whereConditions[] = "tier = ?";
                $params[] = $tier;
            }
            
            $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";
            
            // Get clients
            $stmt = $db->prepare("
                SELECT * FROM clients 
                $whereClause
                ORDER BY name 
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $clients = $stmt->fetchAll();
            
            // Get total count
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM clients $whereClause");
            $stmt->execute(array_slice($params, 0, -2)); // Remove limit and offset
            $total = $stmt->fetch()['total'];
            
            $response = [
                'clients' => $clients,
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset
            ];
            
            echo json_encode(ApiResponse::success($response));
            break;
            
        case 'POST':
            // Create new client
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Invalid JSON input', 400));
                break;
            }
            
            $requiredFields = ['binary_user_id', 'name', 'partner_id'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field])) {
                    http_response_code(400);
                    echo json_encode(ApiResponse::error("Missing required field: $field", 400));
                    return;
                }
            }
            
            $stmt = $db->prepare("
                INSERT INTO clients (
                    binary_user_id, name, join_date, account_type, account_number,
                    country, lifetime_deposits, commission_plan, tracking_link_used,
                    tier, sub_partner, partner_id, email, preferred_language,
                    gender, age
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $input['binary_user_id'],
                $input['name'],
                $input['join_date'] ?? null,
                $input['account_type'] ?? null,
                $input['account_number'] ?? null,
                $input['country'] ?? null,
                $input['lifetime_deposits'] ?? 0.0,
                $input['commission_plan'] ?? null,
                $input['tracking_link_used'] ?? null,
                $input['tier'] ?? null,
                $input['sub_partner'] ?? false,
                $input['partner_id'],
                $input['email'] ?? null,
                $input['preferred_language'] ?? null,
                $input['gender'] ?? null,
                $input['age'] ?? null
            ]);
            
            echo json_encode(ApiResponse::success(['id' => $input['binary_user_id']], 'Client created successfully'));
            break;
            
        case 'PUT':
            // Update client
            $customerId = $_GET['id'] ?? null;
            if (!$customerId) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Client ID required', 400));
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Invalid JSON input', 400));
                break;
            }
            
            // Build update query dynamically
            $updateFields = [];
            $params = [];
            
            $allowedFields = [
                'name', 'join_date', 'account_type', 'account_number', 'country',
                'lifetime_deposits', 'commission_plan', 'tracking_link_used', 'tier',
                'sub_partner', 'partner_id', 'email', 'preferred_language', 'gender', 'age'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('No fields to update', 400));
                break;
            }
            
            $params[] = $customerId;
            
            $stmt = $db->prepare("
                UPDATE clients 
                SET " . implode(', ', $updateFields) . "
                WHERE binary_user_id = ?
            ");
            $stmt->execute($params);
            
            echo json_encode(ApiResponse::success(null, 'Client updated successfully'));
            break;
            
        case 'DELETE':
            // Delete client
            $customerId = $_GET['id'] ?? null;
            if (!$customerId) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Client ID required', 400));
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM clients WHERE binary_user_id = ?");
            $stmt->execute([$customerId]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(ApiResponse::success(null, 'Client deleted successfully'));
            } else {
                http_response_code(404);
                echo json_encode(ApiResponse::error('Client not found', 404));
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
