-- Partner Report MySQL Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS partner_report;
USE partner_report;

-- Partners table
CREATE TABLE partners (
    partner_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Partner tiers configuration
CREATE TABLE partner_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tier VARCHAR(50) NOT NULL,
    range_description VARCHAR(255),
    reward VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    binary_user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    country VARCHAR(100),
    joinDate DATE,
    partnerId VARCHAR(20),
    tier VARCHAR(50),
    gender VARCHAR(20),
    age INT,
    account_type VARCHAR(50),
    accountNumber TEXT,
    sub_partner BOOLEAN DEFAULT FALSE,
    preferredLanguage VARCHAR(100),
    commissionPlan VARCHAR(100),
    trackingLinkUsed VARCHAR(255),
    total_trades INT,
    lifetimeDeposits DECIMAL(15,2),
    PNL DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (partnerId) REFERENCES partners(partner_id) ON DELETE SET NULL,
    INDEX idx_partnerId (partnerId),
    INDEX idx_country (country),
    INDEX idx_tier (tier),
    INDEX idx_joinDate (joinDate)
);

-- Trades table
CREATE TABLE trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    binary_user_id VARCHAR(50),
    loginid VARCHAR(50),
    platform VARCHAR(100),
    app_name VARCHAR(100),
    account_type VARCHAR(50),
    contract_type VARCHAR(100),
    asset_type VARCHAR(100),
    asset VARCHAR(255),
    number_of_trades INT,
    closed_pnl_usd DECIMAL(15,2),
    closed_pnl_usd_abook DECIMAL(15,2),
    closed_pnl_usd_bbook DECIMAL(15,2),
    floating_pnl_usd DECIMAL(15,2),
    floating_pnl DECIMAL(15,2),
    expected_revenue_usd DECIMAL(15,2),
    closed_pnl DECIMAL(15,2),
    swaps_usd DECIMAL(15,2),
    volume_usd DECIMAL(15,2),
    is_synthetic BOOLEAN,
    is_financial BOOLEAN,
    app_markup_usd DECIMAL(15,2),
    affiliated_partner_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (binary_user_id) REFERENCES clients(binary_user_id) ON DELETE CASCADE,
    INDEX idx_date (date),
    INDEX idx_binary_user_id (binary_user_id),
    INDEX idx_affiliated_partner_id (affiliated_partner_id),
    INDEX idx_platform (platform),
    INDEX idx_contract_type (contract_type)
);

-- Deposits table
CREATE TABLE deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    binary_user_id VARCHAR(20) NOT NULL,
    date_time DATETIME NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (binary_user_id) REFERENCES clients(binary_user_id) ON DELETE CASCADE,
    INDEX idx_binary_user_id (binary_user_id),
    INDEX idx_date_time (date_time),
    INDEX idx_value (value)
);

-- Create views for common queries
CREATE VIEW client_metrics AS
SELECT 
    c.partner_id,
    p.name as partner_name,
    p.tier as partner_tier,
    COUNT(c.customer_id) as total_clients,
    SUM(c.lifetime_deposits) as total_deposits,
    COALESCE(SUM(t.commission), 0) as total_commissions,
    COUNT(t.id) as total_trades,
    COUNT(DISTINCT CASE WHEN c.join_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN c.customer_id END) as new_clients_this_month
FROM clients c
LEFT JOIN partners p ON c.partner_id = p.partner_id
LEFT JOIN trades t ON c.customer_id = t.customer_id
GROUP BY c.partner_id, p.name, p.tier;

-- Create view for monthly commissions
CREATE VIEW monthly_commissions AS
SELECT 
    c.partner_id,
    DATE_FORMAT(t.date_time, '%Y-%m') as month,
    SUM(t.commission) as total_commission
FROM clients c
JOIN trades t ON c.customer_id = t.customer_id
GROUP BY c.partner_id, DATE_FORMAT(t.date_time, '%Y-%m')
ORDER BY month DESC;

-- Create view for country statistics
CREATE VIEW country_stats AS
SELECT 
    c.partner_id,
    c.country,
    COUNT(c.customer_id) as client_count,
    SUM(c.lifetime_deposits) as total_deposits,
    COALESCE(SUM(t.commission), 0) as total_commissions,
    COUNT(t.id) as total_trades
FROM clients c
LEFT JOIN trades t ON c.customer_id = t.customer_id
GROUP BY c.partner_id, c.country
ORDER BY client_count DESC;
