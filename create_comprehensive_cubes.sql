-- ============================================================================
-- COMPREHENSIVE DATA CUBES FOR PARTNER REPORTING
-- ============================================================================
-- These cubes pre-aggregate data for instant page loads across all sections
-- Auto-refresh on data changes via triggers
-- ============================================================================

USE partner_report;

-- ============================================================================
-- SECTION 1: DASHBOARD & HOME PAGE CUBES
-- ============================================================================

-- CUBE: Partner Dashboard Metrics
DROP TABLE IF EXISTS cube_partner_dashboard;
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
    INDEX idx_partner_tier (partner_tier)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 2: EARNINGS & COMMISSIONS CUBES
-- ============================================================================

-- CUBE: Daily Commissions by Plan
DROP TABLE IF EXISTS cube_daily_commissions_plan;
CREATE TABLE cube_daily_commissions_plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trade_date DATE,
    commission_plan VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_date_plan (partner_id, trade_date, commission_plan),
    INDEX idx_partner_id (partner_id),
    INDEX idx_trade_date (trade_date)
) ENGINE=InnoDB;

-- CUBE: Daily Commissions by Platform
DROP TABLE IF EXISTS cube_daily_commissions_platform;
CREATE TABLE cube_daily_commissions_platform (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trade_date DATE,
    platform VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_date_platform (partner_id, trade_date, platform),
    INDEX idx_partner_id (partner_id),
    INDEX idx_trade_date (trade_date)
) ENGINE=InnoDB;

-- CUBE: Commissions by Product Group
DROP TABLE IF EXISTS cube_commissions_product;
CREATE TABLE cube_commissions_product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    asset_type VARCHAR(100),
    contract_type VARCHAR(100),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_product (partner_id, asset_type, contract_type),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Commissions by Symbol
DROP TABLE IF EXISTS cube_commissions_symbol;
CREATE TABLE cube_commissions_symbol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    asset VARCHAR(255),
    total_commissions DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_symbol (partner_id, asset),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 3: CLIENT ACQUISITION & LIFECYCLE CUBES
-- ============================================================================

-- CUBE: Daily Client Signups
DROP TABLE IF EXISTS cube_daily_signups;
CREATE TABLE cube_daily_signups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    signup_date DATE,
    commission_plan VARCHAR(100),
    platform VARCHAR(100),
    signup_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_date_plan_platform (partner_id, signup_date, commission_plan, platform),
    INDEX idx_partner_id (partner_id),
    INDEX idx_signup_date (signup_date)
) ENGINE=InnoDB;

-- CUBE: Client Lifecycle Funnel
DROP TABLE IF EXISTS cube_client_funnel;
CREATE TABLE cube_client_funnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    stage VARCHAR(50),
    client_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_stage (partner_id, stage),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Daily Deposits & Withdrawals
DROP TABLE IF EXISTS cube_daily_funding;
CREATE TABLE cube_daily_funding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    funding_date DATE,
    category VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    transaction_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_date_category (partner_id, funding_date, category),
    INDEX idx_partner_id (partner_id),
    INDEX idx_funding_date (funding_date)
) ENGINE=InnoDB;

-- CUBE: Client Retention Metrics
DROP TABLE IF EXISTS cube_client_retention;
CREATE TABLE cube_client_retention (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    client_tier VARCHAR(50),
    new_clients INT DEFAULT 0,
    active_clients INT DEFAULT 0,
    dormant_clients INT DEFAULT 0,
    churned_clients INT DEFAULT 0,
    retention_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_tier (partner_id, client_tier),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Client Segmentation
DROP TABLE IF EXISTS cube_client_segments;
CREATE TABLE cube_client_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    segment_type VARCHAR(50),
    segment_value VARCHAR(100),
    client_count INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_segment (partner_id, segment_type, segment_value),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 4: COUNTRY & REGIONAL PERFORMANCE CUBES
-- ============================================================================

-- CUBE: Country Performance
DROP TABLE IF EXISTS cube_country_performance;
CREATE TABLE cube_country_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    country VARCHAR(100),
    client_count INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_trades INT DEFAULT 0,
    active_traders INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_country (partner_id, country),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Country Funnel (Signups to Active)
DROP TABLE IF EXISTS cube_country_funnel;
CREATE TABLE cube_country_funnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    country VARCHAR(100),
    signups INT DEFAULT 0,
    deposited INT DEFAULT 0,
    active_traders INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_country (partner_id, country),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 5: PRODUCT & TRADING INSIGHTS CUBES
-- ============================================================================

-- CUBE: Product Volume by Asset Class
DROP TABLE IF EXISTS cube_product_volume;
CREATE TABLE cube_product_volume (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    asset_type VARCHAR(100),
    total_volume DECIMAL(15,2) DEFAULT 0,
    trade_count INT DEFAULT 0,
    avg_trade_size DECIMAL(15,2) DEFAULT 0,
    client_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_asset (partner_id, asset_type),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Product Adoption
DROP TABLE IF EXISTS cube_product_adoption;
CREATE TABLE cube_product_adoption (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    product_category VARCHAR(100),
    single_product_clients INT DEFAULT 0,
    multi_product_clients INT DEFAULT 0,
    adoption_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_product (partner_id, product_category),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 6: PERFORMANCE HEALTH & TRENDS CUBES
-- ============================================================================

-- CUBE: Daily Performance Trends
DROP TABLE IF EXISTS cube_daily_trends;
CREATE TABLE cube_daily_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    trend_date DATE,
    signups INT DEFAULT 0,
    deposits DECIMAL(15,2) DEFAULT 0,
    commissions DECIMAL(15,2) DEFAULT 0,
    trades INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_date (partner_id, trend_date),
    INDEX idx_partner_id (partner_id),
    INDEX idx_trend_date (trend_date)
) ENGINE=InnoDB;

-- CUBE: Performance Comparison (MoM, YoY)
DROP TABLE IF EXISTS cube_performance_comparison;
CREATE TABLE cube_performance_comparison (
    partner_id VARCHAR(20) PRIMARY KEY,
    current_month_commissions DECIMAL(15,2) DEFAULT 0,
    last_month_commissions DECIMAL(15,2) DEFAULT 0,
    mom_change_pct DECIMAL(5,2) DEFAULT 0,
    last_year_commissions DECIMAL(15,2) DEFAULT 0,
    yoy_change_pct DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 7: BADGES & RECOGNITION CUBES
-- ============================================================================

-- CUBE: Badge Progress
DROP TABLE IF EXISTS cube_badge_progress;
CREATE TABLE cube_badge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    badge_criteria VARCHAR(100),
    current_value DECIMAL(15,2) DEFAULT 0,
    earned_badges INT DEFAULT 0,
    total_badges INT DEFAULT 0,
    progress_pct DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_criteria (partner_id, badge_criteria),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Tier Progress
DROP TABLE IF EXISTS cube_tier_progress;
CREATE TABLE cube_tier_progress (
    partner_id VARCHAR(20) PRIMARY KEY,
    current_tier VARCHAR(50),
    next_tier VARCHAR(50),
    current_metric_value DECIMAL(15,2) DEFAULT 0,
    next_tier_requirement DECIMAL(15,2) DEFAULT 0,
    progress_pct DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 8: ADDITIONAL UTILITY CUBES
-- ============================================================================

-- CUBE: Client Tiers Distribution
DROP TABLE IF EXISTS cube_client_tiers;
CREATE TABLE cube_client_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    tier VARCHAR(50),
    client_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_tier (partner_id, tier),
    INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB;

-- CUBE: Client Demographics
DROP TABLE IF EXISTS cube_client_demographics;
CREATE TABLE cube_client_demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    dimension VARCHAR(50),
    dimension_value VARCHAR(50),
    client_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_partner_dimension (partner_id, dimension, dimension_value),
    INDEX idx_partner_id (partner_id),
    INDEX idx_dimension (dimension)
) ENGINE=InnoDB;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'All cube tables created successfully!' AS Status;
SELECT COUNT(*) AS TotalCubes FROM information_schema.tables 
WHERE table_schema = 'partner_report' AND table_name LIKE 'cube_%';

