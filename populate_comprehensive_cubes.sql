-- ============================================================================
-- STORED PROCEDURES TO POPULATE ALL CUBES
-- ============================================================================

USE partner_report;

DELIMITER $$

-- ============================================================================
-- PROCEDURE 1: Populate Dashboard Cube
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_dashboard$$
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
        COALESCE(SUM(t.closed_pnl_usd), 0) as total_commissions,
        COALESCE(SUM(t.number_of_trades), 0) as total_trades,
        COUNT(DISTINCT CASE WHEN MONTH(c.joinDate) = MONTH(CURDATE()) AND YEAR(c.joinDate) = YEAR(CURDATE()) THEN c.binary_user_id END) as mtd_clients,
        COALESCE(SUM(CASE WHEN MONTH(d.transaction_time) = MONTH(CURDATE()) AND YEAR(d.transaction_time) = YEAR(CURDATE()) THEN d.amount_usd ELSE 0 END), 0) as mtd_deposits,
        COALESCE(SUM(CASE WHEN MONTH(t.date) = MONTH(CURDATE()) AND YEAR(t.date) = YEAR(CURDATE()) THEN t.closed_pnl_usd ELSE 0 END), 0) as mtd_commissions,
        COALESCE(SUM(CASE WHEN MONTH(t.date) = MONTH(CURDATE()) AND YEAR(t.date) = YEAR(CURDATE()) THEN t.number_of_trades ELSE 0 END), 0) as mtd_trades,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0) as month_1_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0) as month_2_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0) as month_3_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0) as month_4_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0) as month_5_commissions,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN t.closed_pnl_usd ELSE 0 END), 0) as month_6_commissions
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id AND t.affiliated_partner_id = p.partner_id
    GROUP BY p.partner_id, p.name, p.tier;
END$$

-- ============================================================================
-- PROCEDURE 2: Populate Daily Commissions by Plan
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_daily_commissions_plan$$
CREATE PROCEDURE populate_cube_daily_commissions_plan()
BEGIN
    TRUNCATE TABLE cube_daily_commissions_plan;
    
    INSERT INTO cube_daily_commissions_plan (partner_id, trade_date, commission_plan, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        t.date as trade_date,
        COALESCE(c.commissionPlan, 'Unknown') as commission_plan,
        SUM(t.closed_pnl_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    LEFT JOIN clients c ON t.binary_user_id = c.binary_user_id
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, c.commissionPlan;
END$$

-- ============================================================================
-- PROCEDURE 3: Populate Daily Commissions by Platform
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_daily_commissions_platform$$
CREATE PROCEDURE populate_cube_daily_commissions_platform()
BEGIN
    TRUNCATE TABLE cube_daily_commissions_platform;
    
    INSERT INTO cube_daily_commissions_platform (partner_id, trade_date, platform, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        t.date as trade_date,
        COALESCE(t.platform, 'Unknown') as platform,
        SUM(t.closed_pnl_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, t.platform;
END$$

-- ============================================================================
-- PROCEDURE 4: Populate Commissions by Product
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_commissions_product$$
CREATE PROCEDURE populate_cube_commissions_product()
BEGIN
    TRUNCATE TABLE cube_commissions_product;
    
    INSERT INTO cube_commissions_product (partner_id, asset_type, contract_type, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.asset_type, 'Unknown') as asset_type,
        COALESCE(t.contract_type, 'Unknown') as contract_type,
        SUM(t.closed_pnl_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset_type, t.contract_type;
END$$

-- ============================================================================
-- PROCEDURE 5: Populate Commissions by Symbol
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_commissions_symbol$$
CREATE PROCEDURE populate_cube_commissions_symbol()
BEGIN
    TRUNCATE TABLE cube_commissions_symbol;
    
    INSERT INTO cube_commissions_symbol (partner_id, asset, total_commissions, trade_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.asset, 'Unknown') as asset,
        SUM(t.closed_pnl_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset
    LIMIT 1000;
END$$

-- ============================================================================
-- PROCEDURE 6: Populate Daily Signups
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_daily_signups$$
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

-- ============================================================================
-- PROCEDURE 7: Populate Country Performance
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_country_performance$$
CREATE PROCEDURE populate_cube_country_performance()
BEGIN
    TRUNCATE TABLE cube_country_performance;
    
    INSERT INTO cube_country_performance (partner_id, country, client_count, total_deposits, total_commissions, total_trades, active_traders)
    SELECT 
        c.partnerId as partner_id,
        c.country,
        COUNT(DISTINCT c.binary_user_id) as client_count,
        COALESCE(SUM(d.amount_usd), 0) as total_deposits,
        COALESCE(SUM(t.closed_pnl_usd), 0) as total_commissions,
        COALESCE(SUM(t.number_of_trades), 0) as total_trades,
        COUNT(DISTINCT CASE WHEN t.number_of_trades > 0 THEN c.binary_user_id END) as active_traders
    FROM clients c
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id AND t.affiliated_partner_id = c.partnerId
    WHERE c.partnerId IS NOT NULL AND c.country IS NOT NULL
    GROUP BY c.partnerId, c.country;
END$$

-- ============================================================================
-- PROCEDURE 8: Populate Daily Funding
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_daily_funding$$
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

-- ============================================================================
-- PROCEDURE 9: Populate Client Tiers
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_client_tiers$$
CREATE PROCEDURE populate_cube_client_tiers()
BEGIN
    TRUNCATE TABLE cube_client_tiers;
    
    INSERT INTO cube_client_tiers (partner_id, tier, client_count, percentage)
    SELECT 
        c.partnerId as partner_id,
        COALESCE(c.tier, 'Unknown') as tier,
        COUNT(*) as client_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.partnerId), 2) as percentage
    FROM clients c
    WHERE c.partnerId IS NOT NULL
    GROUP BY c.partnerId, c.tier;
END$$

-- ============================================================================
-- PROCEDURE 10: Populate Client Demographics
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_client_demographics$$
CREATE PROCEDURE populate_cube_client_demographics()
BEGIN
    TRUNCATE TABLE cube_client_demographics;
    
    -- Gender breakdown
    INSERT INTO cube_client_demographics (partner_id, dimension, dimension_value, client_count, percentage)
    SELECT 
        c.partnerId as partner_id,
        'gender' as dimension,
        COALESCE(c.gender, 'Unknown') as dimension_value,
        COUNT(*) as client_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.partnerId), 2) as percentage
    FROM clients c
    WHERE c.partnerId IS NOT NULL
    GROUP BY c.partnerId, c.gender;
    
    -- Age groups
    INSERT INTO cube_client_demographics (partner_id, dimension, dimension_value, client_count, percentage)
    SELECT 
        c.partnerId as partner_id,
        'age_group' as dimension,
        CASE 
            WHEN c.age < 25 THEN '18-24'
            WHEN c.age < 35 THEN '25-34'
            WHEN c.age < 45 THEN '35-44'
            WHEN c.age < 55 THEN '45-54'
            WHEN c.age >= 55 THEN '55+'
            ELSE 'Unknown'
        END as dimension_value,
        COUNT(*) as client_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.partnerId), 2) as percentage
    FROM clients c
    WHERE c.partnerId IS NOT NULL
    GROUP BY c.partnerId, dimension_value;
END$$

-- ============================================================================
-- PROCEDURE 11: Populate Product Volume
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_product_volume$$
CREATE PROCEDURE populate_cube_product_volume()
BEGIN
    TRUNCATE TABLE cube_product_volume;
    
    INSERT INTO cube_product_volume (partner_id, asset_type, total_volume, trade_count, avg_trade_size, client_count)
    SELECT 
        t.affiliated_partner_id as partner_id,
        COALESCE(t.asset_type, 'Unknown') as asset_type,
        SUM(t.volume_usd) as total_volume,
        SUM(t.number_of_trades) as trade_count,
        AVG(t.volume_usd / NULLIF(t.number_of_trades, 0)) as avg_trade_size,
        COUNT(DISTINCT t.binary_user_id) as client_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset_type;
END$$

-- ============================================================================
-- PROCEDURE 12: Populate Daily Trends
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_daily_trends$$
CREATE PROCEDURE populate_cube_daily_trends()
BEGIN
    TRUNCATE TABLE cube_daily_trends;
    
    -- Get all dates with activity
    INSERT INTO cube_daily_trends (partner_id, trend_date, signups, deposits, commissions, trades)
    SELECT 
        p.partner_id,
        dates.activity_date,
        COALESCE(s.signup_count, 0) as signups,
        COALESCE(d.deposit_amount, 0) as deposits,
        COALESCE(t.commission_amount, 0) as commissions,
        COALESCE(t.trade_count, 0) as trades
    FROM partners p
    CROSS JOIN (
        SELECT DISTINCT DATE(joinDate) as activity_date FROM clients WHERE joinDate IS NOT NULL
        UNION
        SELECT DISTINCT DATE(transaction_time) FROM deposits WHERE transaction_time IS NOT NULL
        UNION
        SELECT DISTINCT date FROM trades WHERE date IS NOT NULL
    ) dates
    LEFT JOIN (
        SELECT partnerId, DATE(joinDate) as signup_date, COUNT(*) as signup_count
        FROM clients
        GROUP BY partnerId, DATE(joinDate)
    ) s ON p.partner_id = s.partnerId AND dates.activity_date = s.signup_date
    LEFT JOIN (
        SELECT affiliate_id, DATE(transaction_time) as deposit_date, SUM(amount_usd) as deposit_amount
        FROM deposits
        GROUP BY affiliate_id, DATE(transaction_time)
    ) d ON p.partner_id = d.affiliate_id AND dates.activity_date = d.deposit_date
    LEFT JOIN (
        SELECT affiliated_partner_id, date, SUM(closed_pnl_usd) as commission_amount, SUM(number_of_trades) as trade_count
        FROM trades
        GROUP BY affiliated_partner_id, date
    ) t ON p.partner_id = t.affiliated_partner_id AND dates.activity_date = t.date
    WHERE dates.activity_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    ORDER BY p.partner_id, dates.activity_date;
END$$

-- ============================================================================
-- PROCEDURE 13: Populate Badge Progress
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_badge_progress$$
CREATE PROCEDURE populate_cube_badge_progress()
BEGIN
    TRUNCATE TABLE cube_badge_progress;
    
    INSERT INTO cube_badge_progress (partner_id, badge_criteria, current_value, earned_badges, total_badges, progress_pct)
    SELECT 
        p.partner_id,
        'commissions' as badge_criteria,
        COALESCE(SUM(t.closed_pnl_usd), 0) as current_value,
        (SELECT COUNT(*) FROM partner_badges pb JOIN badges b ON pb.badge_name = b.badge_name 
         WHERE pb.partner_id = p.partner_id AND b.badge_criteria = 'commissions') as earned_badges,
        (SELECT COUNT(*) FROM badges WHERE badge_criteria = 'commissions') as total_badges,
        ROUND(
            (SELECT COUNT(*) FROM partner_badges pb JOIN badges b ON pb.badge_name = b.badge_name 
             WHERE pb.partner_id = p.partner_id AND b.badge_criteria = 'commissions') * 100.0 /
            NULLIF((SELECT COUNT(*) FROM badges WHERE badge_criteria = 'commissions'), 0),
            2
        ) as progress_pct
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id AND t.affiliated_partner_id = p.partner_id
    GROUP BY p.partner_id
    
    UNION ALL
    
    SELECT 
        p.partner_id,
        'deposits' as badge_criteria,
        COALESCE(SUM(d.amount_usd), 0) as current_value,
        (SELECT COUNT(*) FROM partner_badges pb JOIN badges b ON pb.badge_name = b.badge_name 
         WHERE pb.partner_id = p.partner_id AND b.badge_criteria = 'deposits') as earned_badges,
        (SELECT COUNT(*) FROM badges WHERE badge_criteria = 'deposits') as total_badges,
        ROUND(
            (SELECT COUNT(*) FROM partner_badges pb JOIN badges b ON pb.badge_name = b.badge_name 
             WHERE pb.partner_id = p.partner_id AND b.badge_criteria = 'deposits') * 100.0 /
            NULLIF((SELECT COUNT(*) FROM badges WHERE badge_criteria = 'deposits'), 0),
            2
        ) as progress_pct
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    GROUP BY p.partner_id;
END$$

-- ============================================================================
-- MASTER PROCEDURE: Populate All Cubes
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_all_cubes$$
CREATE PROCEDURE populate_all_cubes()
BEGIN
    DECLARE start_time DATETIME;
    SET start_time = NOW();
    
    SELECT 'Starting cube population...' AS Status, start_time AS StartTime;
    
    CALL populate_cube_dashboard();
    SELECT 'Dashboard cube populated' AS Status;
    
    CALL populate_cube_daily_commissions_plan();
    SELECT 'Daily commissions by plan populated' AS Status;
    
    CALL populate_cube_daily_commissions_platform();
    SELECT 'Daily commissions by platform populated' AS Status;
    
    CALL populate_cube_commissions_product();
    SELECT 'Commissions by product populated' AS Status;
    
    CALL populate_cube_commissions_symbol();
    SELECT 'Commissions by symbol populated' AS Status;
    
    CALL populate_cube_daily_signups();
    SELECT 'Daily signups populated' AS Status;
    
    CALL populate_cube_country_performance();
    SELECT 'Country performance populated' AS Status;
    
    CALL populate_cube_daily_funding();
    SELECT 'Daily funding populated' AS Status;
    
    CALL populate_cube_client_tiers();
    SELECT 'Client tiers populated' AS Status;
    
    CALL populate_cube_client_demographics();
    SELECT 'Client demographics populated' AS Status;
    
    CALL populate_cube_product_volume();
    SELECT 'Product volume populated' AS Status;
    
    CALL populate_cube_daily_trends();
    SELECT 'Daily trends populated' AS Status;
    
    CALL populate_cube_badge_progress();
    SELECT 'Badge progress populated' AS Status;
    
    SELECT 'All cubes populated successfully!' AS Status, 
           TIMEDIFF(NOW(), start_time) AS Duration;
END$$

DELIMITER ;

-- Run the master procedure
CALL populate_all_cubes();

