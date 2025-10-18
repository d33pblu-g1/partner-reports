-- Create simplified partner_badges table with badge_name
USE partner_report;

-- Drop existing partner_badges table if it exists
DROP TABLE IF EXISTS partner_badges;

-- Create new partner_badges table with partner_id and badge_name
CREATE TABLE partner_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20) NOT NULL,
    badge_name VARCHAR(50) NOT NULL,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE CASCADE,
    UNIQUE KEY unique_partner_badge (partner_id, badge_name),
    INDEX idx_partner_id (partner_id),
    INDEX idx_badge_name (badge_name)
);

-- Insert random dummy data for partner badges
-- Get all partners and randomly assign badges to them
INSERT INTO partner_badges (partner_id, badge_name)
SELECT DISTINCT
    p.partner_id,
    b.badge_name
FROM partners p
CROSS JOIN badges b
WHERE RAND() < 0.4  -- 40% chance of earning each badge
ON DUPLICATE KEY UPDATE earned_date = earned_date;

-- Ensure at least some partners have multiple badges
INSERT IGNORE INTO partner_badges (partner_id, badge_name)
SELECT 
    p.partner_id,
    'com1'
FROM partners p
WHERE RAND() < 0.8;

INSERT IGNORE INTO partner_badges (partner_id, badge_name)
SELECT 
    p.partner_id,
    'dep1'
FROM partners p
WHERE RAND() < 0.8;

INSERT IGNORE INTO partner_badges (partner_id, badge_name)
SELECT 
    p.partner_id,
    'com10'
FROM partners p
WHERE RAND() < 0.6;

INSERT IGNORE INTO partner_badges (partner_id, badge_name)
SELECT 
    p.partner_id,
    'dep10'
FROM partners p
WHERE RAND() < 0.6;

-- Show summary
SELECT 
    'Total badge assignments' as description,
    COUNT(*) as count
FROM partner_badges
UNION ALL
SELECT 
    'Total partners with badges' as description,
    COUNT(DISTINCT partner_id) as count
FROM partner_badges
UNION ALL
SELECT 
    'Average badges per partner' as description,
    ROUND(COUNT(*) / COUNT(DISTINCT partner_id), 2) as count
FROM partner_badges;

-- Show badge distribution
SELECT 
    badge_name,
    COUNT(*) as partners_earned,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM partners), 1), '%') as percentage
FROM partner_badges
GROUP BY badge_name
ORDER BY partners_earned DESC;

-- Show first few partner badge assignments
SELECT 
    p.partner_id,
    p.name,
    p.tier,
    GROUP_CONCAT(pb.badge_name ORDER BY pb.badge_name SEPARATOR ', ') as earned_badges,
    COUNT(pb.badge_name) as total_badges
FROM partners p
LEFT JOIN partner_badges pb ON p.partner_id = pb.partner_id
GROUP BY p.partner_id, p.name, p.tier
LIMIT 10;

