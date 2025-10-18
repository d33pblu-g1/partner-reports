-- Data Cubes for Performance Optimization
-- These cubes pre-aggregate data for fast page loads
-- Auto-refresh on data changes via triggers

USE partner_report;

-- ============================================================================
-- CUBE 1: Partner Dashboard Metrics (Home Page)
-- ============================================================================
DROP TABLE IF EXISTS cube_partner_dashboard;
CREATE TABLE cube_partner_dashboard (
    partner_id VARCHAR(20) PRIMARY KEY,
    partner_name VARCHAR(255),
    partner_tier VARCHAR(50),
    
    -- Lifetime metrics
    total_clients INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_trades INT DEFAULT 0,
    
    -- Monthly metrics (current month)
    mtd_clients INT DEFAULT 0,
    mtd_deposits DECIMAL(15,2) DEFAULT 0,
    mtd_commissions DECIMAL(15,2) DEFAULT 0,
    mtd_trades INT DEFAULT 0,
    
    -- Last 6 months commissions
    month_1_commissions DECIMAL(15,2) DEFAULT 0,
    month_2_commissions DECIMAL(15,2) DEFAULT 0,
    month_3_commissions DECIMAL(15,2) DEFAULT 0,
    month_4_commissions DECIMAL(15,2) DEFAULT 0,
    month_5_commissions DECIMAL(15,2) DEFAULT 0,
    month_6_commissions DECIMAL(15,2) DEFAULT 0,
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_tier (partner_tier),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB;

-- ============================================================================
-- CUBE 2: Client Tier Distribution (Clients Page)
-- ============================================================================
DROP TABLE IF EXISTS cube_client_tiers;
CREATE TABLE cube_client_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    tier VARCHAR(50),
    client_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partner_tier (partner_id, tier),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- ============================================================================
-- CUBE 3: Client Demographics (Clients Page)
-- ============================================================================
DROP TABLE IF EXISTS cube_client_demographics;
CREATE TABLE cube_client_demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    dimension VARCHAR(50),
    dimension_value VARCHAR(50),
    client_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partner_dimension (partner_id, dimension, dimension_value),
    INDEX idx_partner_id (partner_id),
    INDEX idx_dimension (dimension)
) ENGINE=InnoDB;

-- ============================================================================
-- CUBE 4: Monthly Commissions by Plan (Commissions Page)
-- ============================================================================
DROP TABLE IF EXISTS cube_commissions_monthly;
CREATE TABLE cube_commissions_monthly (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    year_month VARCHAR(7),
    commission_plan VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partner_month_plan (partner_id, year_month, commission_plan),
    INDEX idx_partner_id (partner_id),
    INDEX idx_year_month (year_month)
) ENGINE=InnoDB;

-- ============================================================================
-- CUBE 5: Daily Commissions by Plan (Commissions Page)
-- ============================================================================
DROP TABLE IF EXISTS cube_commissions_daily;
CREATE TABLE cube_commissions_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trade_date DATE,
    commission_plan VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partner_date_plan (partner_id, trade_date, commission_plan),
    INDEX idx_partner_id (partner_id),
    INDEX idx_trade_date (trade_date)
) ENGINE=InnoDB;

-- ============================================================================
-- CUBE 6: Country Performance (Country Analysis Page)
-- ============================================================================
DROP TABLE IF EXISTS cube_country_performance;
CREATE TABLE cube_country_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    country VARCHAR(100),
    client_count INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_trades INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partner_country (partner_id, country),
    INDEX idx_partner_id (partner_id),
    INDEX idx_country (country)
) ENGINE=InnoDB;

-- ============================================================================
-- CUBE 7: Badge Progress Cache
-- ============================================================================
DROP TABLE IF EXISTS cube_badge_progress;
CREATE TABLE cube_badge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    badges_earned INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partner (partner_id),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- ============================================================================
-- Stored Procedure: Refresh All Cubes for a Partner
-- ============================================================================
DROP PROCEDURE IF EXISTS refresh_partner_cubes;
DELIMITER //
CREATE PROCEDURE refresh_partner_cubes(IN p_partner_id VARCHAR(20))
BEGIN
    DECLARE current_month VARCHAR(7);
    DECLARE month_start DATE;
    
    SET current_month = DATE_FORMAT(CURDATE(), '%Y-%m');
    SET month_start = DATE_FORMAT(CURDATE(), '%Y-%m-01');
    
    -- ========================================================================
    -- CUBE 1: Partner Dashboard Metrics
    -- ========================================================================
    INSERT INTO cube_partner_dashboard (
        partner_id, partner_name, partner_tier,
        total_clients, total_deposits, total_commissions, total_trades,
        mtd_clients, mtd_deposits, mtd_commissions, mtd_trades,
        month_1_commissions, month_2_commissions, month_3_commissions,
        month_4_commissions, month_5_commissions, month_6_commissions
    )
    SELECT 
        p.partner_id,
        p.name,
        p.tier,
        -- Lifetime metrics
        COUNT(DISTINCT c.binary_user_id),
        COALESCE(SUM(DISTINCT c.lifetimeDeposits), 0),
        COALESCE(SUM(t.closed_pnl_usd), 0),
        COUNT(t.id),
        -- MTD metrics
        COUNT(DISTINCT CASE WHEN c.joinDate >= month_start THEN c.binary_user_id END),
        COALESCE(SUM(CASE WHEN d.transaction_time >= month_start THEN d.amount_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = current_month THEN t.closed_pnl_usd ELSE 0 END), 0),
        COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = current_month THEN t.id END),
        -- Last 6 months commissions
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0)
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    WHERE p.partner_id = p_partner_id
    GROUP BY p.partner_id, p.name, p.tier
    ON DUPLICATE KEY UPDATE
        partner_name = VALUES(partner_name),
        partner_tier = VALUES(partner_tier),
        total_clients = VALUES(total_clients),
        total_deposits = VALUES(total_deposits),
        total_commissions = VALUES(total_commissions),
        total_trades = VALUES(total_trades),
        mtd_clients = VALUES(mtd_clients),
        mtd_deposits = VALUES(mtd_deposits),
        mtd_commissions = VALUES(mtd_commissions),
        mtd_trades = VALUES(mtd_trades),
        month_1_commissions = VALUES(month_1_commissions),
        month_2_commissions = VALUES(month_2_commissions),
        month_3_commissions = VALUES(month_3_commissions),
        month_4_commissions = VALUES(month_4_commissions),
        month_5_commissions = VALUES(month_5_commissions),
        month_6_commissions = VALUES(month_6_commissions);
    
    -- ========================================================================
    -- CUBE 2: Client Tier Distribution
    -- ========================================================================
    DELETE FROM cube_client_tiers WHERE partner_id = p_partner_id;
    
    INSERT INTO cube_client_tiers (partner_id, tier, client_count, percentage)
    SELECT 
        c.partnerId,
        COALESCE(c.tier, 'Unknown') as tier,
        COUNT(*) as client_count,
        (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.partnerId)) as percentage
    FROM clients c
    WHERE c.partnerId = p_partner_id
    GROUP BY c.partnerId, tier;
    
    -- ========================================================================
    -- CUBE 3: Client Demographics
    -- ========================================================================
    DELETE FROM cube_client_demographics WHERE partner_id = p_partner_id;
    
    -- Gender distribution
    INSERT INTO cube_client_demographics (partner_id, dimension, dimension_value, client_count, percentage)
    SELECT 
        c.partnerId,
        'gender',
        COALESCE(c.gender, 'Unknown'),
        COUNT(*),
        (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.partnerId))
    FROM clients c
    WHERE c.partnerId = p_partner_id
    GROUP BY c.partnerId, c.gender;
    
    -- Age group distribution
    INSERT INTO cube_client_demographics (partner_id, dimension, dimension_value, client_count, percentage)
    SELECT 
        c.partnerId,
        'age_group',
        CASE 
            WHEN c.age < 18 THEN 'Under 18'
            WHEN c.age BETWEEN 18 AND 24 THEN '18-24'
            WHEN c.age BETWEEN 25 AND 34 THEN '25-34'
            WHEN c.age BETWEEN 35 AND 44 THEN '35-44'
            WHEN c.age BETWEEN 45 AND 54 THEN '45-54'
            WHEN c.age >= 55 THEN '55+'
            ELSE 'Unknown'
        END as age_group,
        COUNT(*),
        (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.partnerId))
    FROM clients c
    WHERE c.partnerId = p_partner_id
    GROUP BY c.partnerId, age_group;
    
    -- ========================================================================
    -- CUBE 6: Country Performance
    -- ========================================================================
    DELETE FROM cube_country_performance WHERE partner_id = p_partner_id;
    
    INSERT INTO cube_country_performance (
        partner_id, country, client_count, total_deposits, total_commissions, total_trades
    )
    SELECT 
        c.partnerId,
        c.country,
        COUNT(DISTINCT c.binary_user_id),
        COALESCE(SUM(d.amount_usd), 0),
        COALESCE(SUM(t.closed_pnl_usd), 0),
        COUNT(t.id)
    FROM clients c
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = c.partnerId
    WHERE c.partnerId = p_partner_id
    GROUP BY c.partnerId, c.country;
    
    -- ========================================================================
    -- CUBE 7: Badge Progress
    -- ========================================================================
    INSERT INTO cube_badge_progress (
        partner_id, total_commissions, total_deposits, badges_earned
    )
    SELECT 
        p.partner_id,
        COALESCE(SUM(t.closed_pnl_usd), 0),
        COALESCE(SUM(d.amount_usd), 0),
        COUNT(DISTINCT pb.badge_name)
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    LEFT JOIN partner_badges pb ON p.partner_id = pb.partner_id
    WHERE p.partner_id = p_partner_id
    GROUP BY p.partner_id
    ON DUPLICATE KEY UPDATE
        total_commissions = VALUES(total_commissions),
        total_deposits = VALUES(total_deposits),
        badges_earned = VALUES(badges_earned);
        
END //
DELIMITER ;

-- ============================================================================
-- Stored Procedure: Refresh All Partners
-- ============================================================================
DROP PROCEDURE IF EXISTS refresh_all_cubes;
DELIMITER //
CREATE PROCEDURE refresh_all_cubes()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_partner_id VARCHAR(20);
    DECLARE partner_cursor CURSOR FOR SELECT partner_id FROM partners;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN partner_cursor;
    
    read_loop: LOOP
        FETCH partner_cursor INTO v_partner_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL refresh_partner_cubes(v_partner_id);
    END LOOP;
    
    CLOSE partner_cursor;
    
    SELECT 'All cubes refreshed successfully' as status;
END //
DELIMITER ;

-- ============================================================================
-- Stored Procedure: Refresh Commissions Cubes for Partner
-- ============================================================================
DROP PROCEDURE IF EXISTS refresh_commissions_cubes;
DELIMITER //
CREATE PROCEDURE refresh_commissions_cubes(IN p_partner_id VARCHAR(20))
BEGIN
    -- Monthly commissions
    DELETE FROM cube_commissions_monthly WHERE partner_id = p_partner_id;
    
    INSERT INTO cube_commissions_monthly (
        partner_id, year_month, commission_plan, total_commissions, trade_count
    )
    SELECT 
        c.partnerId,
        DATE_FORMAT(t.date, '%Y-%m'),
        c.commissionPlan,
        SUM(t.closed_pnl_usd),
        COUNT(t.id)
    FROM clients c
    JOIN trades t ON c.binary_user_id = t.binary_user_id
    WHERE c.partnerId = p_partner_id
    GROUP BY c.partnerId, DATE_FORMAT(t.date, '%Y-%m'), c.commissionPlan;
    
    -- Daily commissions
    DELETE FROM cube_commissions_daily WHERE partner_id = p_partner_id;
    
    INSERT INTO cube_commissions_daily (
        partner_id, trade_date, commission_plan, total_commissions, trade_count
    )
    SELECT 
        c.partnerId,
        t.date,
        c.commissionPlan,
        SUM(t.closed_pnl_usd),
        COUNT(t.id)
    FROM clients c
    JOIN trades t ON c.binary_user_id = t.binary_user_id
    WHERE c.partnerId = p_partner_id
    GROUP BY c.partnerId, t.date, c.commissionPlan;
END //
DELIMITER ;

-- ============================================================================
-- Initial population of all cubes
-- ============================================================================
CALL refresh_all_cubes();

-- Show summary
SELECT 'Data cubes created and populated' as status;
SELECT COUNT(*) as partner_dashboards FROM cube_partner_dashboard;
SELECT COUNT(*) as client_tiers FROM cube_client_tiers;
SELECT COUNT(*) as demographics FROM cube_client_demographics;
SELECT COUNT(*) as country_data FROM cube_country_performance;
SELECT COUNT(*) as badge_progress FROM cube_badge_progress;

