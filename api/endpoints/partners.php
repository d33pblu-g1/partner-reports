<?php
/**
 * Partners API endpoint
 */

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $partnerId = $_GET['id'] ?? null;
            
            if ($partnerId) {
                // Get single partner
                $stmt = $db->prepare("SELECT * FROM partners WHERE partner_id = ?");
                $stmt->execute([$partnerId]);
                $partner = $stmt->fetch();
                
                if ($partner) {
                    echo json_encode(ApiResponse::success($partner));
                } else {
                    http_response_code(404);
                    echo json_encode(ApiResponse::error('Partner not found', 404));
                }
            } else {
                // Get all partners
                $stmt = $db->prepare("SELECT * FROM partners ORDER BY name");
                $stmt->execute();
                $partners = $stmt->fetchAll();
                
                echo json_encode(ApiResponse::success($partners));
            }
            break;
            
        case 'POST':
            // Create new partner
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Invalid JSON input', 400));
                break;
            }
            
            $requiredFields = ['partner_id', 'name'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field])) {
                    http_response_code(400);
                    echo json_encode(ApiResponse::error("Missing required field: $field", 400));
                    return;
                }
            }
            
            $stmt = $db->prepare("
                INSERT INTO partners (partner_id, name, tier) 
                VALUES (?, ?, ?)
            ");
            
            $stmt->execute([
                $input['partner_id'],
                $input['name'],
                $input['tier'] ?? null
            ]);
            
            echo json_encode(ApiResponse::success(['id' => $input['partner_id']], 'Partner created successfully'));
            break;
            
        case 'PUT':
            // Update partner
            $partnerId = $_GET['id'] ?? null;
            if (!$partnerId) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Partner ID required', 400));
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Invalid JSON input', 400));
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE partners 
                SET name = ?, tier = ?
                WHERE partner_id = ?
            ");
            
            $stmt->execute([
                $input['name'] ?? '',
                $input['tier'] ?? null,
                $partnerId
            ]);
            
            echo json_encode(ApiResponse::success(null, 'Partner updated successfully'));
            break;
            
        case 'DELETE':
            // Delete partner
            $partnerId = $_GET['id'] ?? null;
            if (!$partnerId) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Partner ID required', 400));
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM partners WHERE partner_id = ?");
            $stmt->execute([$partnerId]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(ApiResponse::success(null, 'Partner deleted successfully'));
            } else {
                http_response_code(404);
                echo json_encode(ApiResponse::error('Partner not found', 404));
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
