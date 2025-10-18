-- ============================================================================
-- FIX: Update commission calculations to use expected_revenue_usd
-- ============================================================================

USE partner_report;

DELIMITER $$

-- ============================================================================
-- PROCEDURE 1: Populate Dashboard Cube (FIXED)
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

-- ============================================================================
-- PROCEDURE 2: Populate Daily Commissions by Plan (FIXED)
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
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    LEFT JOIN clients c ON t.binary_user_id = c.binary_user_id
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, c.commissionPlan;
END$$

-- ============================================================================
-- PROCEDURE 3: Populate Daily Commissions by Platform (FIXED)
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
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, t.platform;
END$$

-- ============================================================================
-- PROCEDURE 4: Populate Daily Commissions by Contract Type (FIXED)
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_daily_commissions_contract_type$$
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
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.date, t.contract_type;
END$$

-- ============================================================================
-- PROCEDURE 5: Populate Commissions by Product (FIXED)
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
        SUM(t.expected_revenue_usd) as total_commissions,
        SUM(t.number_of_trades) as trade_count
    FROM trades t
    WHERE t.affiliated_partner_id IS NOT NULL
    GROUP BY t.affiliated_partner_id, t.asset_type, t.contract_type;
END$$

-- ============================================================================
-- PROCEDURE 6: Populate Commissions by Symbol (FIXED)
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_cube_commissions_symbol$$
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
    LIMIT 1000;
END$$

-- ============================================================================
-- Master procedure to populate all cubes
-- ============================================================================
DROP PROCEDURE IF EXISTS populate_all_cubes$$
CREATE PROCEDURE populate_all_cubes()
BEGIN
    CALL populate_cube_dashboard();
    CALL populate_cube_daily_commissions_plan();
    CALL populate_cube_daily_commissions_platform();
    CALL populate_cube_daily_commissions_contract_type();
    CALL populate_cube_commissions_product();
    CALL populate_cube_commissions_symbol();
    -- Add other cube procedures as needed
END$$

DELIMITER ;

-- Now repopulate all cubes with correct commission data
CALL populate_all_cubes();

SELECT 'Commission calculations fixed! All cubes updated with expected_revenue_usd.' as Status;

