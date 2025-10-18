-- ============================================================================
-- COMPREHENSIVE DATABASE OPTIMIZATION AND CUBE REBUILD
-- ============================================================================

USE partner_report;

-- ============================================================================
-- 1. PERFORMANCE INDEXES
-- ============================================================================

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_clients_partner_country ON clients;
DROP INDEX IF EXISTS idx_clients_join_date ON clients;
DROP INDEX IF EXISTS idx_clients_tier_gender ON clients;
DROP INDEX IF EXISTS idx_trades_date_partner ON trades;
DROP INDEX IF EXISTS idx_trades_platform_contract ON trades;
DROP INDEX IF EXISTS idx_trades_asset_type ON trades;
DROP INDEX IF EXISTS idx_deposits_time_category ON deposits;
DROP INDEX IF EXISTS idx_deposits_affiliate ON deposits;

-- Clients table indexes
CREATE INDEX idx_clients_partner_country ON clients(partnerId, country);
CREATE INDEX idx_clients_join_date ON clients(joinDate);
CREATE INDEX idx_clients_tier_gender ON clients(tier, gender);
CREATE INDEX idx_clients_age_gender ON clients(age, gender);
CREATE INDEX idx_clients_commission_plan ON clients(commissionPlan);
CREATE INDEX idx_clients_account_type ON clients(account_type);

-- Trades table indexes
CREATE INDEX idx_trades_date_partner ON trades(date, affiliated_partner_id);
CREATE INDEX idx_trades_platform_contract ON trades(platform, contract_type);
CREATE INDEX idx_trades_asset_type ON trades(asset_type, asset);
CREATE INDEX idx_trades_user_date ON trades(binary_user_id, date);
CREATE INDEX idx_trades_revenue ON trades(expected_revenue_usd);
CREATE INDEX idx_trades_volume ON trades(volume_usd);

-- Deposits table indexes
CREATE INDEX idx_deposits_time_category ON deposits(transaction_time, category);
CREATE INDEX idx_deposits_affiliate ON deposits(affiliate_id);
CREATE INDEX idx_deposits_user_time ON deposits(binary_user_id_1, transaction_time);
CREATE INDEX idx_deposits_amount ON deposits(amount_usd);
CREATE INDEX idx_deposits_payment_method ON deposits(payment_method);

-- Partners table indexes
CREATE INDEX idx_partners_tier ON partners(tier);
CREATE INDEX idx_partners_country_rank ON partners(Country_Rank);

-- Partner badges indexes
CREATE INDEX idx_partner_badges_partner ON partner_badges(partner_id);
CREATE INDEX idx_partner_badges_date ON partner_badges(earned_date);

-- ============================================================================
-- 2. DROP AND RECREATE ALL CUBES
-- ============================================================================

-- Drop all existing cube tables
DROP TABLE IF EXISTS cube_partner_dashboard;
DROP TABLE IF EXISTS cube_daily_commissions_plan;
DROP TABLE IF EXISTS cube_daily_commissions_platform;
DROP TABLE IF EXISTS cube_daily_commissions_contract_type;
DROP TABLE IF EXISTS cube_commissions_product;
DROP TABLE IF EXISTS cube_commissions_symbol;
DROP TABLE IF EXISTS cube_daily_signups;
DROP TABLE IF EXISTS cube_daily_funding;
DROP TABLE IF EXISTS cube_client_tiers;
DROP TABLE IF EXISTS cube_client_demographics;
DROP TABLE IF EXISTS cube_country_performance;
DROP TABLE IF EXISTS cube_product_volume;
DROP TABLE IF EXISTS cube_daily_trends;
DROP TABLE IF EXISTS cube_badge_progress;
DROP TABLE IF EXISTS cube_partner_countries;
DROP TABLE IF EXISTS cube_monthly_commissions;
DROP TABLE IF EXISTS cube_platform_revenue;
DROP TABLE IF EXISTS cube_client_growth;
DROP TABLE IF EXISTS cube_deposit_trends;

-- ============================================================================
-- 3. CREATE OPTIMIZED CUBE TABLES
-- ============================================================================

-- Main dashboard cube
CREATE TABLE cube_partner_dashboard (
    partner_id VARCHAR(20) PRIMARY KEY,
    partner_name VARCHAR(255),
    partner_tier VARCHAR(50),
    total_clients INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_trades INT DEFAULT 0,
    mtd_clients INT DEFAULT 0,
    mtd_deposits DECIMAL(15,2) DEFAULT 0,
    mtd_commissions DECIMAL(15,2) DEFAULT 0,
    mtd_trades INT DEFAULT 0,
    month_1_commissions DECIMAL(15,2) DEFAULT 0,
    month_2_commissions DECIMAL(15,2) DEFAULT 0,
    month_3_commissions DECIMAL(15,2) DEFAULT 0,
    month_4_commissions DECIMAL(15,2) DEFAULT 0,
    month_5_commissions DECIMAL(15,2) DEFAULT 0,
    month_6_commissions DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_tier (partner_tier),
    INDEX idx_total_commissions (total_commissions),
    INDEX idx_last_updated (last_updated)
);

-- Daily commissions by plan
CREATE TABLE cube_daily_commissions_plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trade_date DATE,
    commission_plan VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, trade_date),
    INDEX idx_commission_plan (commission_plan),
    INDEX idx_trade_date (trade_date)
);

-- Daily commissions by platform
CREATE TABLE cube_daily_commissions_platform (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trade_date DATE,
    platform VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, trade_date),
    INDEX idx_platform (platform),
    INDEX idx_trade_date (trade_date)
);

-- Daily commissions by contract type
CREATE TABLE cube_daily_commissions_contract_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trade_date DATE,
    contract_type VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, trade_date),
    INDEX idx_contract_type (contract_type),
    INDEX idx_trade_date (trade_date)
);

-- Commissions by product
CREATE TABLE cube_commissions_product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    asset_type VARCHAR(100),
    contract_type VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_asset_type (asset_type),
    INDEX idx_contract_type (contract_type)
);

-- Commissions by symbol
CREATE TABLE cube_commissions_symbol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    asset VARCHAR(255),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_asset (asset),
    INDEX idx_total_commissions (total_commissions)
);

-- Daily signups
CREATE TABLE cube_daily_signups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    signup_date DATE,
    commission_plan VARCHAR(100),
    platform VARCHAR(100),
    signup_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, signup_date),
    INDEX idx_signup_date (signup_date),
    INDEX idx_commission_plan (commission_plan)
);

-- Daily funding
CREATE TABLE cube_daily_funding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    funding_date DATE,
    category VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    transaction_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, funding_date),
    INDEX idx_funding_date (funding_date),
    INDEX idx_category (category)
);

-- Client tiers
CREATE TABLE cube_client_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    tier VARCHAR(50),
    client_count INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_tier (tier)
);

-- Client demographics
CREATE TABLE cube_client_demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    dimension VARCHAR(50),
    dimension_value VARCHAR(100),
    client_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_dimension (dimension),
    INDEX idx_dimension_value (dimension_value)
);

-- Country performance
CREATE TABLE cube_country_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    country VARCHAR(100),
    client_count INT DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_country (country),
    INDEX idx_client_count (client_count)
);

-- Product volume
CREATE TABLE cube_product_volume (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    asset_type VARCHAR(100),
    total_volume DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    avg_trade_size DECIMAL(15,2) DEFAULT 0,
    client_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_asset_type (asset_type),
    INDEX idx_total_volume (total_volume)
);

-- Daily trends
CREATE TABLE cube_daily_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trend_date DATE,
    signups INT DEFAULT 0,
    deposits DECIMAL(15,2) DEFAULT 0,
    commissions DECIMAL(15,2) DEFAULT 0,
    trades INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, trend_date),
    INDEX idx_trend_date (trend_date)
);

-- Badge progress
CREATE TABLE cube_badge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    badge_name VARCHAR(100),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    target_value DECIMAL(15,2) DEFAULT 0,
    is_earned BOOLEAN DEFAULT FALSE,
    earned_date DATE NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_badge_name (badge_name),
    INDEX idx_is_earned (is_earned)
);

-- Partner countries
CREATE TABLE cube_partner_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    country VARCHAR(100),
    client_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_country (country),
    INDEX idx_client_count (client_count)
);

-- NEW CUBES FOR ADDITIONAL CHARTS

-- Monthly commissions
CREATE TABLE cube_monthly_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    year_month VARCHAR(7),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_month (partner_id, year_month),
    INDEX idx_year_month (year_month)
);

-- Platform revenue
CREATE TABLE cube_platform_revenue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    platform VARCHAR(100),
    total_revenue DECIMAL(15,2) DEFAULT 0,
    client_count INT DEFAULT 0,
    avg_revenue_per_client DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner (partner_id),
    INDEX idx_platform (platform),
    INDEX idx_total_revenue (total_revenue)
);

-- Client growth
CREATE TABLE cube_client_growth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    growth_date DATE,
    new_clients INT DEFAULT 0,
    cumulative_clients INT DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, growth_date),
    INDEX idx_growth_date (growth_date)
);

-- Deposit trends
CREATE TABLE cube_deposit_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trend_date DATE,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    deposit_count INT DEFAULT 0,
    avg_deposit_size DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_date (partner_id, trend_date),
    INDEX idx_trend_date (trend_date)
);

-- ============================================================================
-- 4. STORED PROCEDURES FOR CUBE POPULATION
-- ============================================================================

DELIMITER $$

-- Drop existing procedures
DROP PROCEDURE IF EXISTS populate_all_cubes$$
DROP PROCEDURE IF EXISTS populate_cube_dashboard$$
DROP PROCEDURE IF EXISTS populate_cube_daily_commissions_plan$$
DROP PROCEDURE IF EXISTS populate_cube_daily_commissions_platform$$
DROP PROCEDURE IF EXISTS populate_cube_daily_commissions_contract_type$$
DROP PROCEDURE IF EXISTS populate_cube_commissions_product$$
DROP PROCEDURE IF EXISTS populate_cube_commissions_symbol$$
DROP PROCEDURE IF EXISTS populate_cube_daily_signups$$
DROP PROCEDURE IF EXISTS populate_cube_daily_funding$$
DROP PROCEDURE IF EXISTS populate_cube_client_tiers$$
DROP PROCEDURE IF EXISTS populate_cube_client_demographics$$
DROP PROCEDURE IF EXISTS populate_cube_country_performance$$
DROP PROCEDURE IF EXISTS populate_cube_product_volume$$
DROP PROCEDURE IF EXISTS populate_cube_daily_trends$$
DROP PROCEDURE IF EXISTS populate_cube_badge_progress$$
DROP PROCEDURE IF EXISTS populate_cube_partner_countries$$
DROP PROCEDURE IF EXISTS populate_cube_monthly_commissions$$
DROP PROCEDURE IF EXISTS populate_cube_platform_revenue$$
DROP PROCEDURE IF EXISTS populate_cube_client_growth$$
DROP PROCEDURE IF EXISTS populate_cube_deposit_trends$$

-- Main dashboard cube
CREATE PROCEDURE populate_cube_dashboard()
BEGIN
    TRUNCATE TABLE cube_partner_dashboard;
    
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
        COUNT(DISTINCT c.binary_user_id) as total_clients,
        COALESCE(SUM(d.amount_usd), 0) as total_deposits,
        COALESCE(SUM(t.expected_revenue_usd), 0) as total_commissions,
        COALESCE(SUM(t.number_of_trades), 0) as total_trades,
        COUNT(DISTINCT CASE WHEN MONTH(c.joinDate) = MONTH(CURDATE()) AND YEAR(c.joinDate) = YEAR(CURDATE()) THEN c.binary_user_id END) as mtd_clients,
        COALESCE(SUM(CASE WHEN MONTH(d.transaction_time) = MONTH(CURDATE()) AND YEAR(d.transaction_time) = YEAR(CURDATE()) THEN d.amount_usd ELSE 0 END), 0) as mtd_deposits,
        COALESCE(SUM(CASE WHEN MONTH(t.date) = MONTH(CURDATE()) AND YEAR(t.date) = YEAR(CURDATE()) THEN t.expected_revenue_usd ELSE 0 END), 0) as mtd_commissions,
        COALESCE(SUM(CASE WHEN MONTH(t.date) = MONTH(CURDATE()) AND YEAR(t.date) = YEAR(CURDATE()) THEN t.number_of_trades ELSE 0 END), 0) as mtd_trades,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_1_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_2_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_3_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_4_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_5_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_6_commissions
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id AND t.affiliated_partner_id = p.partner_id
    GROUP BY p.partner_id, p.name, p.tier;
END$$

-- Daily commissions by plan
CREATE PROCEDURE populate_cube_daily_commissions_plan()
BEGIN
    TRUNCATE TABLE cube_daily_commissions_plan;
    
    INSERT INTO cube_daily_commissions_plan (partner_id, trade_date, commission_plan, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        t.date as trade_date,
        COALESCE(c.commissionPlan, 'Unknown') as commission_plan,
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    LEFT JOIN clients c ON t.binary_user_id = c.binary_user_id
    WHERE t.affiliated_partner_id IS NOT NULL AND t.date IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, c.commissionPlan;
END$$

-- Daily commissions by platform
CREATE PROCEDURE populate_cube_daily_commissions_platform()
BEGIN
    TRUNCATE TABLE cube_daily_commissions_platform;
    
    INSERT INTO cube_daily_commissions_platform (partner_id, trade_date, platform, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        t.date as trade_date,
        COALESCE(t.platform, 'Unknown') as platform,
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL AND t.date IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, t.platform;
END$$

-- Daily commissions by contract type
CREATE PROCEDURE populate_cube_daily_commissions_contract_type()
BEGIN
    TRUNCATE TABLE cube_daily_commissions_contract_type;
    
    INSERT INTO cube_daily_commissions_contract_type (partner_id, trade_date, contract_type, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        t.date as trade_date,
        COALESCE(t.contract_type, 'Unknown') as contract_type,
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL AND t.date IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, t.contract_type;
END$$

-- Commissions by product
CREATE PROCEDURE populate_cube_commissions_product()
BEGIN
    TRUNCATE TABLE cube_commissions_product;
    
    INSERT INTO cube_commissions_product (partner_id, asset_type, contract_type, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.asset_type, 'Unknown') as asset_type,
        COALESCE(t.contract_type, 'Unknown') as contract_type,
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset_type, t.contract_type;
END$$

-- Commissions by symbol
CREATE PROCEDURE populate_cube_commissions_symbol()
BEGIN
    TRUNCATE TABLE cube_commissions_symbol;
    
    INSERT INTO cube_commissions_symbol (partner_id, asset, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.asset, 'Unknown') as asset,
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset
    ORDER BY total_commissions DESC
    LIMIT 1000;
END$$

-- Daily signups
CREATE PROCEDURE populate_cube_daily_signups()
BEGIN
    TRUNCATE TABLE cube_daily_signups;
    
    INSERT INTO cube_daily_signups (partner_id, signup_date, commission_plan, platform, signup_count)
    SELECT 
        c.partnerId as partner_id,
        DATE(c.joinDate) as signup_date,
        COALESCE(c.commissionPlan, 'Unknown') as commission_plan,
        COALESCE(c.account_type, 'Unknown') as platform,
        COUNT(*) as signup_count
    FROM clients c
    WHERE c.partnerId IS NOT NULL AND c.joinDate IS NOT NULL
    GROUP BY c.partnerId, DATE(c.joinDate), c.commissionPlan, c.account_type;
END$$

-- Daily funding
CREATE PROCEDURE populate_cube_daily_funding()
BEGIN
    TRUNCATE TABLE cube_daily_funding;
    
    INSERT INTO cube_daily_funding (partner_id, funding_date, category, total_amount, transaction_count)
    SELECT 
        d.affiliate_id as partner_id,
        DATE(d.transaction_time) as funding_date,
        COALESCE(d.category, 'Unknown') as category,
        SUM(d.amount_usd) as total_amount,
        COUNT(*) as transaction_count
    FROM deposits d
    WHERE d.affiliate_id IS NOT NULL AND d.transaction_time IS NOT NULL
    GROUP BY d.affiliate_id, DATE(d.transaction_time), d.category;
END$$

-- Client tiers
CREATE PROCEDURE populate_cube_client_tiers()
BEGIN
    TRUNCATE TABLE cube_client_tiers;
    
    INSERT INTO cube_client_tiers (partner_id, tier, client_count, total_deposits)
    SELECT 
        c.partnerId as partner_id,
        COALESCE(c.tier, 'Unknown') as tier,
        COUNT(*) as client_count,
        SUM(COALESCE(c.lifetimeDeposits, 0)) as total_deposits
    FROM clients c
    WHERE c.partnerId IS NOT NULL
    GROUP BY c.partnerId, c.tier;
END$$

-- Client demographics
CREATE PROCEDURE populate_cube_client_demographics()
BEGIN
    TRUNCATE TABLE cube_client_demographics;
    
    -- Age groups
    INSERT INTO cube_client_demographics (partner_id, dimension, dimension_value, client_count)
    SELECT 
        c.partnerId as partner_id,
        'age_group' as dimension,
        CASE 
            WHEN c.age < 25 THEN '18-24'
            WHEN c.age < 35 THEN '25-34'
            WHEN c.age < 45 THEN '35-44'
            WHEN c.age < 55 THEN '45-54'
            WHEN c.age < 65 THEN '55-64'
            ELSE '65+'
        END as dimension_value,
        COUNT(*) as client_count
    FROM clients c
    WHERE c.partnerId IS NOT NULL AND c.age IS NOT NULL
    GROUP BY c.partnerId, dimension_value;
    
    -- Gender
    INSERT INTO cube_client_demographics (partner_id, dimension, dimension_value, client_count)
    SELECT 
        c.partnerId as partner_id,
        'gender' as dimension,
        COALESCE(c.gender, 'Unknown') as dimension_value,
        COUNT(*) as client_count
    FROM clients c
    WHERE c.partnerId IS NOT NULL AND c.gender IS NOT NULL
    GROUP BY c.partnerId, c.gender;
END$$

-- Country performance
CREATE PROCEDURE populate_cube_country_performance()
BEGIN
    TRUNCATE TABLE cube_country_performance;
    
    INSERT INTO cube_country_performance (partner_id, country, client_count, total_commissions, total_deposits)
    SELECT 
        c.partnerId as partner_id,
        c.country,
        COUNT(DISTINCT c.binary_user_id) as client_count,
        COALESCE(SUM(t.expected_revenue_usd), 0) as total_commissions,
        COALESCE(SUM(d.amount_usd), 0) as total_deposits
    FROM clients c
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1
    WHERE c.partnerId IS NOT NULL AND c.country IS NOT NULL
    GROUP BY c.partnerId, c.country;
END$$

-- Product volume
CREATE PROCEDURE populate_cube_product_volume()
BEGIN
    TRUNCATE TABLE cube_product_volume;
    
    INSERT INTO cube_product_volume (partner_id, asset_type, total_volume, trade_count, avg_trade_size, client_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.asset_type, 'Unknown') as asset_type,
        SUM(t.volume_usd) as total_volume,
        SUM(t.number_of_trades) as trade_count,
        AVG(t.volume_usd) as avg_trade_size,
        COUNT(DISTINCT t.binary_user_id) as client_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset_type;
END$$

-- Daily trends
CREATE PROCEDURE populate_cube_daily_trends()
BEGIN
    TRUNCATE TABLE cube_daily_trends;
    
    INSERT INTO cube_daily_trends (partner_id, trend_date, signups, deposits, commissions, trades)
    SELECT 
        COALESCE(c.partnerId, t.affiliated_partner_id, d.affiliate_id) as partner_id,
        COALESCE(DATE(c.joinDate), t.date, DATE(d.transaction_time)) as trend_date,
        COUNT(DISTINCT CASE WHEN c.joinDate IS NOT NULL THEN c.binary_user_id END) as signups,
        COALESCE(SUM(d.amount_usd), 0) as deposits,
        COALESCE(SUM(t.expected_revenue_usd), 0) as commissions,
        COALESCE(SUM(t.number_of_trades), 0) as trades
    FROM clients c
    FULL OUTER JOIN trades t ON c.binary_user_id = t.binary_user_id
    FULL OUTER JOIN deposits d ON c.binary_user_id = d.binary_user_id_1
    WHERE COALESCE(c.partnerId, t.affiliated_partner_id, d.affiliate_id) IS NOT NULL
    GROUP BY partner_id, trend_date;
END$$

-- Badge progress
CREATE PROCEDURE populate_cube_badge_progress()
BEGIN
    TRUNCATE TABLE cube_badge_progress;
    
    INSERT INTO cube_badge_progress (partner_id, badge_name, progress_percentage, current_value, target_value, is_earned, earned_date)
    SELECT 
        pb.partner_id,
        pb.badge_name,
        CASE 
            WHEN pb.earned_date IS NOT NULL THEN 100.00
            ELSE LEAST(100.00, (COALESCE(SUM(t.expected_revenue_usd), 0) / CAST(REPLACE(REPLACE(b.badge_trigger, '$', ''), 'k', '000') AS UNSIGNED)) * 100)
        END as progress_percentage,
        COALESCE(SUM(t.expected_revenue_usd), 0) as current_value,
        CAST(REPLACE(REPLACE(b.badge_trigger, '$', ''), 'k', '000') AS UNSIGNED) as target_value,
        pb.earned_date IS NOT NULL as is_earned,
        pb.earned_date
    FROM partner_badges pb
    JOIN badges b ON pb.badge_name = b.badge_name
    LEFT JOIN clients c ON pb.partner_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    GROUP BY pb.partner_id, pb.badge_name, b.badge_trigger, pb.earned_date;
END$$

-- Partner countries
CREATE PROCEDURE populate_cube_partner_countries()
BEGIN
    TRUNCATE TABLE cube_partner_countries;
    
    INSERT INTO cube_partner_countries (partner_id, country, client_count)
    SELECT 
        c.partnerId as partner_id,
        c.country,
        COUNT(*) as client_count
    FROM clients c
    WHERE c.partnerId IS NOT NULL AND c.country IS NOT NULL
    GROUP BY c.partnerId, c.country;
END$$

-- Monthly commissions
CREATE PROCEDURE populate_cube_monthly_commissions()
BEGIN
    TRUNCATE TABLE cube_monthly_commissions;
    
    INSERT INTO cube_monthly_commissions (partner_id, year_month, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        DATE_FORMAT(t.date, '%Y-%m') as year_month,
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL AND t.date IS NOT NULL
    GROUP BY t.affiliated_partner_id, DATE_FORMAT(t.date, '%Y-%m');
END$$

-- Platform revenue
CREATE PROCEDURE populate_cube_platform_revenue()
BEGIN
    TRUNCATE TABLE cube_platform_revenue;
    
    INSERT INTO cube_platform_revenue (partner_id, platform, total_revenue, client_count, avg_revenue_per_client)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.platform, 'Unknown') as platform,
        SUM(t.expected_revenue_usd) as total_revenue,
        COUNT(DISTINCT t.binary_user_id) as client_count,
        SUM(t.expected_revenue_usd) / COUNT(DISTINCT t.binary_user_id) as avg_revenue_per_client
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.platform;
END$$

-- Client growth
CREATE PROCEDURE populate_cube_client_growth()
BEGIN
    TRUNCATE TABLE cube_client_growth;
    
    INSERT INTO cube_client_growth (partner_id, growth_date, new_clients, cumulative_clients, growth_rate)
    SELECT 
        c.partnerId as partner_id,
        DATE(c.joinDate) as growth_date,
        COUNT(*) as new_clients,
        (SELECT COUNT(*) FROM clients c2 WHERE c2.partnerId = c.partnerId AND c2.joinDate <= c.joinDate) as cumulative_clients,
        CASE 
            WHEN (SELECT COUNT(*) FROM clients c3 WHERE c3.partnerId = c.partnerId AND c3.joinDate < c.joinDate) > 0 
            THEN (COUNT(*) / (SELECT COUNT(*) FROM clients c3 WHERE c3.partnerId = c.partnerId AND c3.joinDate < c.joinDate)) * 100
            ELSE 0
        END as growth_rate
    FROM clients c
    WHERE c.partnerId IS NOT NULL AND c.joinDate IS NOT NULL
    GROUP BY c.partnerId, DATE(c.joinDate);
END$$

-- Deposit trends
CREATE PROCEDURE populate_cube_deposit_trends()
BEGIN
    TRUNCATE TABLE cube_deposit_trends;
    
    INSERT INTO cube_deposit_trends (partner_id, trend_date, total_deposits, deposit_count, avg_deposit_size)
    SELECT 
        d.affiliate_id as partner_id,
        DATE(d.transaction_time) as trend_date,
        SUM(d.amount_usd) as total_deposits,
        COUNT(*) as deposit_count,
        AVG(d.amount_usd) as avg_deposit_size
    FROM deposits d
    WHERE d.affiliate_id IS NOT NULL AND d.transaction_time IS NOT NULL
    GROUP BY d.affiliate_id, DATE(d.transaction_time);
END$$

-- Master procedure to populate all cubes
CREATE PROCEDURE populate_all_cubes()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    CALL populate_cube_dashboard();
    CALL populate_cube_daily_commissions_plan();
    CALL populate_cube_daily_commissions_platform();
    CALL populate_cube_daily_commissions_contract_type();
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
    CALL populate_cube_partner_countries();
    CALL populate_cube_monthly_commissions();
    CALL populate_cube_platform_revenue();
    CALL populate_cube_client_growth();
    CALL populate_cube_deposit_trends();
    
    COMMIT;
    
    SELECT 'All cubes populated successfully!' as Status;
END$$

DELIMITER ;

-- ============================================================================
-- 5. POPULATE ALL CUBES
-- ============================================================================

CALL populate_all_cubes();

-- ============================================================================
-- 6. PERFORMANCE ANALYSIS
-- ============================================================================

-- Show cube statistics
SELECT 
    'Cube Statistics' as Info,
    COUNT(*) as Total_Cubes,
    SUM(TABLE_ROWS) as Total_Rows,
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as Size_MB
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'partner_report' 
AND TABLE_NAME LIKE 'cube_%';

-- Show index statistics
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    ROUND((CARDINALITY / TABLE_ROWS) * 100, 2) as Selectivity_Percent
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'partner_report' 
AND TABLE_NAME LIKE 'cube_%'
ORDER BY TABLE_NAME, CARDINALITY DESC;

SELECT 'Database optimization and cube rebuild completed successfully!' as Status;
