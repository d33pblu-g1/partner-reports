<?php
/**
 * Badges API endpoint
 */

$db = getDB();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $partnerId = $_GET['partner_id'] ?? null;
            $action = $_GET['action'] ?? 'list';
            
            switch ($action) {
                case 'list':
                    // Get all badges
                    $stmt = $db->prepare("SELECT * FROM badges ORDER BY badge_criteria, CAST(REPLACE(REPLACE(badge_trigger, '$', ''), 'k', '000') AS UNSIGNED)");
                    $stmt->execute();
                    $badges = $stmt->fetchAll();
                    echo json_encode(ApiResponse::success($badges));
                    break;
                    
                case 'partner':
                    // Get badges for a specific partner
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $data = getPartnerBadges($db, $partnerId);
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'progress':
                    // Get badge progress for a partner
                    if (!$partnerId) {
                        http_response_code(400);
                        echo json_encode(ApiResponse::error('Partner ID required', 400));
                        break;
                    }
                    
                    $data = getPartnerBadgeProgress($db, $partnerId);
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                case 'summary':
                    // Get badge summary statistics
                    $data = getBadgeSummary($db);
                    echo json_encode(ApiResponse::success($data));
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(ApiResponse::error('Invalid action', 400));
                    break;
            }
            break;
            
        case 'POST':
            // Award badges (trigger badge calculation)
            awardBadges($db);
            echo json_encode(ApiResponse::success(null, 'Badges awarded successfully'));
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
 * Get badges earned by a partner
 */
function getPartnerBadges($db, $partnerId) {
    $stmt = $db->prepare("
        SELECT 
            b.id,
            b.badge_name,
            b.badge_criteria,
            b.badge_trigger,
            pb.earned_date,
            p.name as partner_name,
            p.tier as partner_tier
        FROM partner_badges pb
        JOIN badges b ON pb.badge_id = b.id
        JOIN partners p ON pb.partner_id = p.partner_id
        WHERE pb.partner_id = ?
        ORDER BY b.badge_criteria, CAST(REPLACE(REPLACE(b.badge_trigger, '$', ''), 'k', '000') AS UNSIGNED)
    ");
    $stmt->execute([$partnerId]);
    
    $badges = $stmt->fetchAll();
    
    // Get totals
    $stmt = $db->prepare("
        SELECT 
            COALESCE(SUM(t.commission), 0) as total_commissions,
            COALESCE(SUM(d.value), 0) as total_deposits
        FROM clients c
        LEFT JOIN trades t ON c.customer_id = t.customer_id
        LEFT JOIN deposits d ON c.customer_id = d.customer_id
        WHERE c.partner_id = ?
    ");
    $stmt->execute([$partnerId]);
    $totals = $stmt->fetch();
    
    return [
        'partner_id' => $partnerId,
        'badges' => $badges,
        'total_commissions' => (float)$totals['total_commissions'],
        'total_deposits' => (float)$totals['total_deposits'],
        'badge_count' => count($badges)
    ];
}

/**
 * Get badge progress for a partner
 */
function getPartnerBadgeProgress($db, $partnerId) {
    // Get all badges
    $stmt = $db->prepare("SELECT * FROM badges ORDER BY badge_criteria, CAST(REPLACE(REPLACE(badge_trigger, '$', ''), 'k', '000') AS UNSIGNED)");
    $stmt->execute();
    $allBadges = $stmt->fetchAll();
    
    // Get earned badges
    $stmt = $db->prepare("
        SELECT badge_id 
        FROM partner_badges 
        WHERE partner_id = ?
    ");
    $stmt->execute([$partnerId]);
    $earnedBadgeIds = array_column($stmt->fetchAll(), 'badge_id');
    
    // Get partner totals
    $stmt = $db->prepare("
        SELECT 
            COALESCE(SUM(t.commission), 0) as total_commissions,
            COALESCE(SUM(d.value), 0) as total_deposits
        FROM clients c
        LEFT JOIN trades t ON c.customer_id = t.customer_id
        LEFT JOIN deposits d ON c.customer_id = d.customer_id
        WHERE c.partner_id = ?
    ");
    $stmt->execute([$partnerId]);
    $totals = $stmt->fetch();
    
    $totalCommissions = (float)$totals['total_commissions'];
    $totalDeposits = (float)$totals['total_deposits'];
    
    // Calculate progress for each badge
    $progress = [];
    foreach ($allBadges as $badge) {
        $triggerAmount = parseBadgeTrigger($badge['badge_trigger']);
        $currentAmount = $badge['badge_criteria'] === 'commissions' ? $totalCommissions : $totalDeposits;
        
        $earned = in_array($badge['id'], $earnedBadgeIds);
        $progressPercent = $earned ? 100 : min(100, ($currentAmount / $triggerAmount) * 100);
        
        $progress[] = [
            'badge_id' => $badge['id'],
            'badge_name' => $badge['badge_name'],
            'badge_criteria' => $badge['badge_criteria'],
            'badge_trigger' => $badge['badge_trigger'],
            'trigger_amount' => $triggerAmount,
            'current_amount' => $currentAmount,
            'progress_percent' => round($progressPercent, 2),
            'earned' => $earned,
            'remaining' => max(0, $triggerAmount - $currentAmount)
        ];
    }
    
    return [
        'partner_id' => $partnerId,
        'total_commissions' => $totalCommissions,
        'total_deposits' => $totalDeposits,
        'badges' => $progress
    ];
}

/**
 * Get badge summary statistics
 */
function getBadgeSummary($db) {
    // Total badges by criteria
    $stmt = $db->prepare("
        SELECT 
            badge_criteria,
            COUNT(*) as badge_count
        FROM badges
        GROUP BY badge_criteria
    ");
    $stmt->execute();
    $badgesByCriteria = $stmt->fetchAll();
    
    // Total badges awarded
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM partner_badges");
    $stmt->execute();
    $totalAwarded = $stmt->fetch()['total'];
    
    // Partners with badges
    $stmt = $db->prepare("SELECT COUNT(DISTINCT partner_id) as total FROM partner_badges");
    $stmt->execute();
    $partnersWithBadges = $stmt->fetch()['total'];
    
    // Most earned badge
    $stmt = $db->prepare("
        SELECT 
            b.badge_name,
            b.badge_criteria,
            b.badge_trigger,
            COUNT(pb.partner_id) as earned_count
        FROM badges b
        LEFT JOIN partner_badges pb ON b.id = pb.badge_id
        GROUP BY b.id
        ORDER BY earned_count DESC
        LIMIT 5
    ");
    $stmt->execute();
    $topBadges = $stmt->fetchAll();
    
    return [
        'badges_by_criteria' => $badgesByCriteria,
        'total_badges_awarded' => (int)$totalAwarded,
        'partners_with_badges' => (int)$partnersWithBadges,
        'top_badges' => $topBadges
    ];
}

/**
 * Award badges to all partners
 */
function awardBadges($db) {
    $stmt = $db->prepare("CALL award_badges()");
    $stmt->execute();
}

/**
 * Parse badge trigger amount
 */
function parseBadgeTrigger($trigger) {
    $trigger = str_replace('$', '', $trigger);
    $trigger = str_replace('k', '000', $trigger);
    return (float)$trigger;
}
?>
