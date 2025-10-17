-- Data Cube Tables for Analytics
-- These tables will store pre-aggregated data for faster chart rendering

USE partner_report;

-- Commission cube by date and commission plan
CREATE TABLE IF NOT EXISTS cube_commissions_by_plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    commission_plan VARCHAR(100),
    date DATE NOT NULL,
    period_type ENUM('daily', 'monthly') NOT NULL,
    total_commission DECIMAL(15,2) DEFAULT 0.00,
    trade_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, date),
    INDEX idx_period_type (period_type),
    INDEX idx_commission_plan (commission_plan),
    INDEX idx_date (date)
);

-- Tier distribution cube
CREATE TABLE IF NOT EXISTS cube_tier_distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    tier VARCHAR(50),
    client_count INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0.00,
    total_commissions DECIMAL(15,2) DEFAULT 0.00,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_partner_tier (partner_id, tier),
    INDEX idx_snapshot_date (snapshot_date)
);

-- Country performance cube
CREATE TABLE IF NOT EXISTS cube_country_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    country VARCHAR(100),
    client_count INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0.00,
    total_commissions DECIMAL(15,2) DEFAULT 0.00,
    trade_count INT DEFAULT 0,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_partner_country (partner_id, country),
    INDEX idx_snapshot_date (snapshot_date)
);

-- Age distribution cube
CREATE TABLE IF NOT EXISTS cube_age_distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    age_group VARCHAR(20),
    client_count INT DEFAULT 0,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_partner_age (partner_id, age_group),
    INDEX idx_snapshot_date (snapshot_date)
);

-- Stored procedure to populate commission cube
DELIMITER //

CREATE PROCEDURE populate_commission_cube()
BEGIN
    -- Clear existing data
    TRUNCATE TABLE cube_commissions_by_plan;
    
    -- Populate daily data
    INSERT INTO cube_commissions_by_plan (
        partner_id, commission_plan, date, period_type, 
        total_commission, trade_count
    )
    SELECT 
        c.partner_id,
        c.commission_plan,
        DATE(t.date_time) as date,
        'daily' as period_type,
        SUM(t.commission) as total_commission,
        COUNT(t.id) as trade_count
    FROM trades t
    JOIN clients c ON t.customer_id = c.customer_id
    GROUP BY c.partner_id, c.commission_plan, DATE(t.date_time);
    
    -- Populate monthly data
    INSERT INTO cube_commissions_by_plan (
        partner_id, commission_plan, date, period_type, 
        total_commission, trade_count
    )
    SELECT 
        c.partner_id,
        c.commission_plan,
        DATE_FORMAT(t.date_time, '%Y-%m-01') as date,
        'monthly' as period_type,
        SUM(t.commission) as total_commission,
        COUNT(t.id) as trade_count
    FROM trades t
    JOIN clients c ON t.customer_id = c.customer_id
    GROUP BY c.partner_id, c.commission_plan, DATE_FORMAT(t.date_time, '%Y-%m-01');
    
END //

DELIMITER ;

-- Stored procedure to populate tier distribution cube
DELIMITER //

CREATE PROCEDURE populate_tier_cube()
BEGIN
    DECLARE current_date DATE;
    SET current_date = CURDATE();
    
    -- Clear old data
    DELETE FROM cube_tier_distribution WHERE snapshot_date < DATE_SUB(current_date, INTERVAL 30 DAY);
    
    -- Populate current data
    INSERT INTO cube_tier_distribution (
        partner_id, tier, client_count, total_deposits, 
        total_commissions, snapshot_date
    )
    SELECT 
        c.partner_id,
        c.tier,
        COUNT(c.customer_id) as client_count,
        SUM(c.lifetime_deposits) as total_deposits,
        COALESCE(SUM(t.commission), 0) as total_commissions,
        current_date as snapshot_date
    FROM clients c
    LEFT JOIN trades t ON c.customer_id = t.customer_id
    GROUP BY c.partner_id, c.tier
    ON DUPLICATE KEY UPDATE
        client_count = VALUES(client_count),
        total_deposits = VALUES(total_deposits),
        total_commissions = VALUES(total_commissions);
    
END //

DELIMITER ;

-- Stored procedure to populate country performance cube
DELIMITER //

CREATE PROCEDURE populate_country_cube()
BEGIN
    DECLARE current_date DATE;
    SET current_date = CURDATE();
    
    -- Clear old data
    DELETE FROM cube_country_performance WHERE snapshot_date < DATE_SUB(current_date, INTERVAL 30 DAY);
    
    -- Populate current data
    INSERT INTO cube_country_performance (
        partner_id, country, client_count, total_deposits, 
        total_commissions, trade_count, snapshot_date
    )
    SELECT 
        c.partner_id,
        c.country,
        COUNT(DISTINCT c.customer_id) as client_count,
        SUM(c.lifetime_deposits) as total_deposits,
        COALESCE(SUM(t.commission), 0) as total_commissions,
        COUNT(t.id) as trade_count,
        current_date as snapshot_date
    FROM clients c
    LEFT JOIN trades t ON c.customer_id = t.customer_id
    GROUP BY c.partner_id, c.country
    ON DUPLICATE KEY UPDATE
        client_count = VALUES(client_count),
        total_deposits = VALUES(total_deposits),
        total_commissions = VALUES(total_commissions),
        trade_count = VALUES(trade_count);
    
END //

DELIMITER ;

-- Stored procedure to populate age distribution cube
DELIMITER //

CREATE PROCEDURE populate_age_cube()
BEGIN
    DECLARE current_date DATE;
    SET current_date = CURDATE();
    
    -- Clear old data
    DELETE FROM cube_age_distribution WHERE snapshot_date < DATE_SUB(current_date, INTERVAL 30 DAY);
    
    -- Populate current data
    INSERT INTO cube_age_distribution (
        partner_id, age_group, client_count, snapshot_date
    )
    SELECT 
        partner_id,
        CASE 
            WHEN age BETWEEN 18 AND 25 THEN '18-25'
            WHEN age BETWEEN 26 AND 35 THEN '26-35'
            WHEN age BETWEEN 36 AND 45 THEN '36-45'
            WHEN age BETWEEN 46 AND 55 THEN '46-55'
            WHEN age BETWEEN 56 AND 65 THEN '56-65'
            WHEN age > 65 THEN '65+'
            ELSE 'Unknown'
        END as age_group,
        COUNT(*) as client_count,
        current_date as snapshot_date
    FROM clients
    GROUP BY partner_id, age_group
    ON DUPLICATE KEY UPDATE
        client_count = VALUES(client_count);
    
END //

DELIMITER ;

-- Populate all cubes initially
CALL populate_commission_cube();
CALL populate_tier_cube();
CALL populate_country_cube();
CALL populate_age_cube();

-- Create event to refresh cubes daily (optional)
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS refresh_cubes_daily
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_DATE + INTERVAL 1 DAY
-- DO BEGIN
--     CALL populate_commission_cube();
--     CALL populate_tier_cube();
--     CALL populate_country_cube();
--     CALL populate_age_cube();
-- END;
