<?php
/**
 * Partner Links API endpoint
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $partnerId = $_GET['partner_id'] ?? null;
            $linkId = $_GET['id'] ?? null;
            
            if ($linkId) {
                // Get specific link
                $stmt = $db->prepare("SELECT * FROM partner_links WHERE id = ?");
                $stmt->execute([$linkId]);
                $data = $stmt->fetch();
            } elseif ($partnerId) {
                // Get all links for a partner
                $stmt = $db->prepare("
                    SELECT * FROM partner_links 
                    WHERE partner_id = ? AND is_active = TRUE 
                    ORDER BY link_type, created_at DESC
                ");
                $stmt->execute([$partnerId]);
                $data = $stmt->fetchAll();
            } else {
                // Get all links (for admin purposes)
                $stmt = $db->prepare("
                    SELECT pl.*, p.name as partner_name, p.tier as partner_tier
                    FROM partner_links pl
                    JOIN partners p ON pl.partner_id = p.partner_id
                    WHERE pl.is_active = TRUE 
                    ORDER BY p.name, pl.link_type
                ");
                $stmt->execute();
                $data = $stmt->fetchAll();
            }
            
            echo json_encode(ApiResponse::success($data));
            break;
            
        case 'POST':
            // Add new link
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Invalid JSON input', 400));
                break;
            }
            
            // Validate required fields
            $required = ['partner_id', 'link_type', 'link_url'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(ApiResponse::error("Missing required field: $field", 400));
                    return;
                }
            }
            
            // Validate URL
            if (!filter_var($input['link_url'], FILTER_VALIDATE_URL)) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Invalid URL format', 400));
                return;
            }
            
            // Check if partner exists
            $stmt = $db->prepare("SELECT partner_id FROM partners WHERE partner_id = ?");
            $stmt->execute([$input['partner_id']]);
            if (!$stmt->fetch()) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Partner not found', 400));
                return;
            }
            
            // Insert new link
            $stmt = $db->prepare("
                INSERT INTO partner_links (
                    partner_id, link_type, link_url, link_title, description,
                    follower_count, engagement_rate, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
            ");
            
            $result = $stmt->execute([
                $input['partner_id'],
                $input['link_type'],
                $input['link_url'],
                $input['link_title'] ?? null,
                $input['description'] ?? null,
                $input['follower_count'] ?? 0,
                $input['engagement_rate'] ?? 0.0
            ]);
            
            if ($result) {
                $linkId = $db->lastInsertId();
                echo json_encode(ApiResponse::success(['id' => $linkId, 'message' => 'Link added successfully']));
            } else {
                http_response_code(500);
                echo json_encode(ApiResponse::error('Failed to add link', 500));
            }
            break;
            
        case 'PUT':
            // Update existing link
            $linkId = $_GET['id'] ?? null;
            if (!$linkId) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Link ID required', 400));
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
            $values = [];
            
            $allowedFields = ['link_type', 'link_url', 'link_title', 'description', 'follower_count', 'engagement_rate', 'is_active'];
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "$field = ?";
                    $values[] = $input[$field];
                }
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('No fields to update', 400));
                break;
            }
            
            $values[] = $linkId;
            $sql = "UPDATE partner_links SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($values);
            
            if ($result) {
                echo json_encode(ApiResponse::success(['message' => 'Link updated successfully']));
            } else {
                http_response_code(500);
                echo json_encode(ApiResponse::error('Failed to update link', 500));
            }
            break;
            
        case 'DELETE':
            // Delete link (soft delete by setting is_active = FALSE)
            $linkId = $_GET['id'] ?? null;
            if (!$linkId) {
                http_response_code(400);
                echo json_encode(ApiResponse::error('Link ID required', 400));
                break;
            }
            
            $stmt = $db->prepare("UPDATE partner_links SET is_active = FALSE WHERE id = ?");
            $result = $stmt->execute([$linkId]);
            
            if ($result) {
                echo json_encode(ApiResponse::success(['message' => 'Link deleted successfully']));
            } else {
                http_response_code(500);
                echo json_encode(ApiResponse::error('Failed to delete link', 500));
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
