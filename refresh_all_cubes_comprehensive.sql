-- Comprehensive Cube Refresh and Performance Optimization
-- This script refreshes all existing cubes and creates new performance cubes

-- First, let's refresh all existing cubes individually
CALL populate_cube_dashboard();
CALL populate_cube_daily_commissions_plan();
CALL populate_cube_daily_commissions_platform();
CALL populate_cube_commissions_product();
CALL populate_cube_commissions_symbol();
CALL populate_cube_daily_signups();
CALL populate_cube_daily_funding();
CALL populate_cube_client_tiers();
CALL populate_cube_client_demographics();
CALL populate_cube_country_performance();
CALL populate_cube_product_volume();
CALL populate_cube_daily_trends();
CALL populate_cube_badge_progress();

-- Create additional performance cubes for faster chart loading

-- Cube for client age distribution (for population pyramid)
DROP TABLE IF EXISTS cube_age_distribution;
CREATE TABLE cube_age_distribution (
    age_group VARCHAR(20),
    gender VARCHAR(10),
    client_count INT,
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (age_group, gender, partner_id),
    INDEX idx_partner_age (partner_id, age_group),
    INDEX idx_gender_age (gender, age_group)
);

-- Cube for client funnel analysis
DROP TABLE IF EXISTS cube_client_funnel;
CREATE TABLE cube_client_funnel (
    funnel_stage VARCHAR(50),
    client_count INT,
    conversion_rate DECIMAL(5,2),
    partner_id INT,
    period_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (funnel_stage, partner_id, period_date),
    INDEX idx_partner_stage (partner_id, funnel_stage),
    INDEX idx_period_stage (period_date, funnel_stage)
);

-- Cube for client retention analysis
DROP TABLE IF EXISTS cube_client_retention;
CREATE TABLE cube_client_retention (
    cohort_month VARCHAR(7),
    retention_period INT,
    client_count INT,
    retention_rate DECIMAL(5,2),
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cohort_month, retention_period, partner_id),
    INDEX idx_partner_cohort (partner_id, cohort_month),
    INDEX idx_retention_period (retention_period)
);

-- Cube for client segmentation
DROP TABLE IF EXISTS cube_client_segments;
CREATE TABLE cube_client_segments (
    segment_name VARCHAR(50),
    client_count INT,
    total_volume DECIMAL(15,2),
    avg_volume DECIMAL(15,2),
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (segment_name, partner_id),
    INDEX idx_partner_segment (partner_id, segment_name)
);

-- Cube for country funnel analysis
DROP TABLE IF EXISTS cube_country_funnel;
CREATE TABLE cube_country_funnel (
    country VARCHAR(100),
    funnel_stage VARCHAR(50),
    client_count INT,
    conversion_rate DECIMAL(5,2),
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (country, funnel_stage, partner_id),
    INDEX idx_partner_country (partner_id, country),
    INDEX idx_stage_country (funnel_stage, country)
);

-- Cube for performance comparison
DROP TABLE IF EXISTS cube_performance_comparison;
CREATE TABLE cube_performance_comparison (
    metric_name VARCHAR(100),
    current_value DECIMAL(15,2),
    previous_value DECIMAL(15,2),
    change_percent DECIMAL(5,2),
    partner_id INT,
    period_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (metric_name, partner_id, period_date),
    INDEX idx_partner_metric (partner_id, metric_name),
    INDEX idx_period_metric (period_date, metric_name)
);

-- Cube for product adoption
DROP TABLE IF EXISTS cube_product_adoption;
CREATE TABLE cube_product_adoption (
    product_name VARCHAR(100),
    adoption_rate DECIMAL(5,2),
    client_count INT,
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_name, partner_id),
    INDEX idx_partner_product (partner_id, product_name)
);

-- Cube for tier distribution
DROP TABLE IF EXISTS cube_tier_distribution;
CREATE TABLE cube_tier_distribution (
    tier_name VARCHAR(50),
    client_count INT,
    percentage DECIMAL(5,2),
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tier_name, partner_id),
    INDEX idx_partner_tier (partner_id, tier_name)
);

-- Cube for tier progress
DROP TABLE IF EXISTS cube_tier_progress;
CREATE TABLE cube_tier_progress (
    tier_name VARCHAR(50),
    progress_percent DECIMAL(5,2),
    client_count INT,
    partner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tier_name, partner_id),
    INDEX idx_partner_tier_progress (partner_id, tier_name)
);

-- Create stored procedures to populate new cubes

DELIMITER //

-- Procedure to populate age distribution cube
CREATE PROCEDURE populate_cube_age_distribution()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_age_distribution;
    
    -- Insert age distribution data
    INSERT INTO cube_age_distribution (age_group, gender, client_count, partner_id)
    SELECT 
        CASE 
            WHEN age < 18 THEN 'Under 18'
            WHEN age BETWEEN 18 AND 25 THEN '18-25'
            WHEN age BETWEEN 26 AND 35 THEN '26-35'
            WHEN age BETWEEN 36 AND 45 THEN '36-45'
            WHEN age BETWEEN 46 AND 55 THEN '46-55'
            WHEN age BETWEEN 56 AND 65 THEN '56-65'
            ELSE '65+'
        END as age_group,
        UPPER(gender) as gender,
        COUNT(*) as client_count,
        partnerId as partner_id
    FROM clients 
    WHERE age IS NOT NULL AND gender IS NOT NULL
    GROUP BY age_group, gender, partnerId;
    
    COMMIT;
END //

-- Procedure to populate client funnel cube
CREATE PROCEDURE populate_cube_client_funnel()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_client_funnel;
    
    -- Insert funnel data
    INSERT INTO cube_client_funnel (funnel_stage, client_count, conversion_rate, partner_id, period_date)
    SELECT 
        'Registered' as funnel_stage,
        COUNT(*) as client_count,
        100.00 as conversion_rate,
        partnerId as partner_id,
        DATE(joinDate) as period_date
    FROM clients
    GROUP BY partnerId, DATE(joinDate)
    
    UNION ALL
    
    SELECT 
        'First Deposit' as funnel_stage,
        COUNT(DISTINCT c.binary_user_id) as client_count,
        (COUNT(DISTINCT c.binary_user_id) / COUNT(DISTINCT c2.binary_user_id)) * 100 as conversion_rate,
        c.partnerId as partner_id,
        DATE(MIN(d.depositDate)) as period_date
    FROM clients c
    LEFT JOIN deposits d ON c.binary_user_id = d.clientId
    LEFT JOIN clients c2 ON c.partnerId = c2.partnerId
    WHERE d.depositDate IS NOT NULL
    GROUP BY c.partnerId, DATE(d.depositDate);
    
    COMMIT;
END //

-- Procedure to populate client retention cube
CREATE PROCEDURE populate_cube_client_retention()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_client_retention;
    
    -- Insert retention data (simplified version)
    INSERT INTO cube_client_retention (cohort_month, retention_period, client_count, retention_rate, partner_id)
    SELECT 
        DATE_FORMAT(joinDate, '%Y-%m') as cohort_month,
        0 as retention_period,
        COUNT(*) as client_count,
        100.00 as retention_rate,
        partnerId as partner_id
    FROM clients
    GROUP BY DATE_FORMAT(registrationDate, '%Y-%m'), partnerId;
    
    COMMIT;
END //

-- Procedure to populate client segments cube
CREATE PROCEDURE populate_cube_client_segments()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_client_segments;
    
    -- Insert segment data
    INSERT INTO cube_client_segments (segment_name, client_count, total_volume, avg_volume, partner_id)
    SELECT 
        CASE 
            WHEN totalVolume < 1000 THEN 'Low Volume'
            WHEN totalVolume BETWEEN 1000 AND 10000 THEN 'Medium Volume'
            ELSE 'High Volume'
        END as segment_name,
        COUNT(*) as client_count,
        SUM(totalVolume) as total_volume,
        AVG(totalVolume) as avg_volume,
        partnerId as partner_id
    FROM clients
    WHERE totalVolume IS NOT NULL
    GROUP BY segment_name, partnerId;
    
    COMMIT;
END //

-- Procedure to populate country funnel cube
CREATE PROCEDURE populate_cube_country_funnel()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_country_funnel;
    
    -- Insert country funnel data
    INSERT INTO cube_country_funnel (country, funnel_stage, client_count, conversion_rate, partner_id)
    SELECT 
        country as country,
        'Registered' as funnel_stage,
        COUNT(*) as client_count,
        100.00 as conversion_rate,
        partnerId as partner_id
    FROM clients
    WHERE country IS NOT NULL
    GROUP BY country, partnerId;
    
    COMMIT;
END //

-- Procedure to populate performance comparison cube
CREATE PROCEDURE populate_cube_performance_comparison()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_performance_comparison;
    
    -- Insert performance comparison data
    INSERT INTO cube_performance_comparison (metric_name, current_value, previous_value, change_percent, partner_id, period_date)
    SELECT 
        'Total Clients' as metric_name,
        COUNT(*) as current_value,
        LAG(COUNT(*)) OVER (PARTITION BY partnerId ORDER BY DATE(joinDate)) as previous_value,
        CASE 
            WHEN LAG(COUNT(*)) OVER (PARTITION BY partnerId ORDER BY DATE(joinDate)) > 0 
            THEN ((COUNT(*) - LAG(COUNT(*)) OVER (PARTITION BY partnerId ORDER BY DATE(joinDate))) / LAG(COUNT(*)) OVER (PARTITION BY partnerId ORDER BY DATE(joinDate))) * 100
            ELSE 0
        END as change_percent,
        partnerId as partner_id,
        DATE(joinDate) as period_date
    FROM clients
    GROUP BY partnerId, DATE(joinDate);
    
    COMMIT;
END //

-- Procedure to populate product adoption cube
CREATE PROCEDURE populate_cube_product_adoption()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_product_adoption;
    
    -- Insert product adoption data
    INSERT INTO cube_product_adoption (product_name, adoption_rate, client_count, partner_id)
    SELECT 
        assetType as product_name,
        (COUNT(DISTINCT clientId) / (SELECT COUNT(*) FROM clients WHERE partnerId = t.partnerId)) * 100 as adoption_rate,
        COUNT(DISTINCT clientId) as client_count,
        partnerId as partner_id
    FROM trades t
    GROUP BY assetType, partnerId;
    
    COMMIT;
END //

-- Procedure to populate tier distribution cube
CREATE PROCEDURE populate_cube_tier_distribution()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_tier_distribution;
    
    -- Insert tier distribution data
    INSERT INTO cube_tier_distribution (tier_name, client_count, percentage, partner_id)
    SELECT 
        tier as tier_name,
        COUNT(*) as client_count,
        (COUNT(*) / (SELECT COUNT(*) FROM clients WHERE partnerId = c.partnerId)) * 100 as percentage,
        partnerId as partner_id
    FROM clients c
    WHERE tier IS NOT NULL
    GROUP BY tier, partnerId;
    
    COMMIT;
END //

-- Procedure to populate tier progress cube
CREATE PROCEDURE populate_cube_tier_progress()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_tier_progress;
    
    -- Insert tier progress data (simplified)
    INSERT INTO cube_tier_progress (tier_name, progress_percent, client_count, partner_id)
    SELECT 
        tier as tier_name,
        75.0 as progress_percent, -- Placeholder progress
        COUNT(*) as client_count,
        partnerId as partner_id
    FROM clients
    WHERE tier IS NOT NULL
    GROUP BY tier, partnerId;
    
    COMMIT;
END //

-- Master procedure to refresh all cubes
CREATE PROCEDURE refresh_all_cubes_comprehensive()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Refresh existing cubes
    CALL populate_cube_dashboard();
    CALL populate_cube_daily_commissions_plan();
    CALL populate_cube_daily_commissions_platform();
    CALL populate_cube_commissions_product();
    CALL populate_cube_commissions_symbol();
    CALL populate_cube_daily_signups();
    CALL populate_cube_daily_funding();
    CALL populate_cube_client_tiers();
    CALL populate_cube_client_demographics();
    CALL populate_cube_country_performance();
    CALL populate_cube_product_volume();
    CALL populate_cube_daily_trends();
    CALL populate_cube_badge_progress();
    
    -- Populate new performance cubes
    CALL populate_cube_age_distribution();
    CALL populate_cube_client_funnel();
    CALL populate_cube_client_retention();
    CALL populate_cube_client_segments();
    CALL populate_cube_country_funnel();
    CALL populate_cube_performance_comparison();
    CALL populate_cube_product_adoption();
    CALL populate_cube_tier_distribution();
    CALL populate_cube_tier_progress();
    
    COMMIT;
    
    SELECT 'All cubes refreshed successfully!' as message;
END //

DELIMITER ;

-- Execute the comprehensive refresh
CALL refresh_all_cubes_comprehensive();
