-- Badges Table Creation and Population
USE partner_report;

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    badge_name VARCHAR(50) NOT NULL UNIQUE,
    badge_criteria VARCHAR(50) NOT NULL,
    badge_trigger VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_badge_criteria (badge_criteria),
    INDEX idx_badge_name (badge_name)
);

-- Populate with commission badges
INSERT INTO badges (badge_name, badge_criteria, badge_trigger) VALUES
('com1', 'commissions', '$1'),
('com10', 'commissions', '$10'),
('com100', 'commissions', '$100'),
('com1k', 'commissions', '$1000'),
('com10k', 'commissions', '$10000'),
('com100k', 'commissions', '$100000'),
('dep1', 'deposits', '$1'),
('dep10', 'deposits', '$10'),
('dep100', 'deposits', '$100'),
('dep1k', 'deposits', '$1000'),
('dep10k', 'deposits', '$10000'),
('dep100k', 'deposits', '$100000')
ON DUPLICATE KEY UPDATE 
    badge_criteria = VALUES(badge_criteria),
    badge_trigger = VALUES(badge_trigger);

-- Create partner_badges junction table to track which partners have earned which badges
CREATE TABLE IF NOT EXISTS partner_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20) NOT NULL,
    badge_id INT NOT NULL,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_partner_badge (partner_id, badge_id),
    INDEX idx_partner_id (partner_id),
    INDEX idx_badge_id (badge_id)
);

-- Stored procedure to calculate and award badges to partners
DELIMITER //

CREATE PROCEDURE award_badges()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_partner_id VARCHAR(20);
    DECLARE v_total_commissions DECIMAL(15,2);
    DECLARE v_total_deposits DECIMAL(15,2);
    
    -- Cursor to iterate through all partners
    DECLARE partner_cursor CURSOR FOR 
        SELECT partner_id FROM partners;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN partner_cursor;
    
    read_loop: LOOP
        FETCH partner_cursor INTO v_partner_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calculate total commissions for this partner
        SELECT COALESCE(SUM(t.commission), 0)
        INTO v_total_commissions
        FROM clients c
        LEFT JOIN trades t ON c.customer_id = t.customer_id
        WHERE c.partner_id = v_partner_id;
        
        -- Calculate total deposits for this partner
        SELECT COALESCE(SUM(d.value), 0)
        INTO v_total_deposits
        FROM clients c
        LEFT JOIN deposits d ON c.customer_id = d.customer_id
        WHERE c.partner_id = v_partner_id;
        
        -- Award commission badges
        -- com1: $1+
        IF v_total_commissions >= 1 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'com1';
        END IF;
        
        -- com10: $10+
        IF v_total_commissions >= 10 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'com10';
        END IF;
        
        -- com100: $100+
        IF v_total_commissions >= 100 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'com100';
        END IF;
        
        -- com1k: $1000+
        IF v_total_commissions >= 1000 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'com1k';
        END IF;
        
        -- com10k: $10000+
        IF v_total_commissions >= 10000 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'com10k';
        END IF;
        
        -- com100k: $100000+
        IF v_total_commissions >= 100000 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'com100k';
        END IF;
        
        -- Award deposit badges
        -- dep1: $1+
        IF v_total_deposits >= 1 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'dep1';
        END IF;
        
        -- dep10: $10+
        IF v_total_deposits >= 10 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'dep10';
        END IF;
        
        -- dep100: $100+
        IF v_total_deposits >= 100 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'dep100';
        END IF;
        
        -- dep1k: $1000+
        IF v_total_deposits >= 1000 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'dep1k';
        END IF;
        
        -- dep10k: $10000+
        IF v_total_deposits >= 10000 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'dep10k';
        END IF;
        
        -- dep100k: $100000+
        IF v_total_deposits >= 100000 THEN
            INSERT IGNORE INTO partner_badges (partner_id, badge_id)
            SELECT v_partner_id, id FROM badges WHERE badge_name = 'dep100k';
        END IF;
        
    END LOOP;
    
    CLOSE partner_cursor;
END //

DELIMITER ;

-- Create view to easily see partner badges
CREATE OR REPLACE VIEW partner_badges_view AS
SELECT 
    p.partner_id,
    p.name as partner_name,
    p.tier as partner_tier,
    b.badge_name,
    b.badge_criteria,
    b.badge_trigger,
    pb.earned_date
FROM partner_badges pb
JOIN partners p ON pb.partner_id = p.partner_id
JOIN badges b ON pb.badge_id = b.id
ORDER BY p.partner_id, b.badge_criteria, CAST(REPLACE(REPLACE(b.badge_trigger, '$', ''), 'k', '000') AS UNSIGNED);

-- Function to get partner's earned badges
DELIMITER //

CREATE FUNCTION get_partner_badge_count(p_partner_id VARCHAR(20))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE badge_count INT;
    
    SELECT COUNT(*)
    INTO badge_count
    FROM partner_badges
    WHERE partner_id = p_partner_id;
    
    RETURN badge_count;
END //

DELIMITER ;

-- Award badges to existing partners
CALL award_badges();

-- Show summary
SELECT 
    badge_criteria,
    COUNT(*) as badge_count
FROM badges
GROUP BY badge_criteria;

SELECT 
    'Total partners with badges' as description,
    COUNT(DISTINCT partner_id) as count
FROM partner_badges
UNION ALL
SELECT 
    'Total badges awarded' as description,
    COUNT(*) as count
FROM partner_badges;
