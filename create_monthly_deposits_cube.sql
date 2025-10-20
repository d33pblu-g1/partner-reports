-- ============================================================================
-- MONTHLY DEPOSITS CUBE FOR PARTNER REPORTING
-- ============================================================================
-- This cube provides monthly deposit data for all charts that show deposits by month
-- Used by: Home page lifetime deposits, MTD deposits, deposit trends, etc.
-- ============================================================================

USE partner_report;

-- CUBE: Monthly Deposits by Partner
DROP TABLE IF EXISTS cube_monthly_deposits;
CREATE TABLE cube_monthly_deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20),
    year_month_str VARCHAR(7), -- Format: YYYY-MM
    year_val INT,
    month_val INT,
    month_name VARCHAR(10), -- January, February, etc.
    total_deposits DECIMAL(15,2) DEFAULT 0,
    deposit_count INT DEFAULT 0,
    avg_deposit_size DECIMAL(15,2) DEFAULT 0,
    max_deposit DECIMAL(15,2) DEFAULT 0,
    min_deposit DECIMAL(15,2) DEFAULT 0,
    total_withdrawals DECIMAL(15,2) DEFAULT 0,
    withdrawal_count INT DEFAULT 0,
    net_deposits DECIMAL(15,2) DEFAULT 0, -- deposits - withdrawals
    unique_depositors INT DEFAULT 0,
    repeat_depositors INT DEFAULT 0,
    first_time_depositors INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_month (partner_id, year_month_str),
    INDEX idx_year_month (year_month_str),
    INDEX idx_partner_id (partner_id),
    UNIQUE KEY unique_partner_month (partner_id, year_month_str)
) ENGINE=InnoDB;

-- ============================================================================
-- POPULATE MONTHLY DEPOSITS CUBE
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS populate_cube_monthly_deposits$$

CREATE PROCEDURE populate_cube_monthly_deposits()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_monthly_deposits;
    
    -- Insert monthly deposit data
    INSERT INTO cube_monthly_deposits (
        partner_id,
        year_month_str,
        year_val,
        month_val,
        month_name,
        total_deposits,
        deposit_count,
        avg_deposit_size,
        max_deposit,
        min_deposit,
        total_withdrawals,
        withdrawal_count,
        net_deposits,
        unique_depositors,
        repeat_depositors,
        first_time_depositors
    )
    SELECT 
        COALESCE(c.partnerId, d.affiliate_id) as partner_id,
        DATE_FORMAT(d.transaction_time, '%Y-%m') as year_month_str,
        YEAR(d.transaction_time) as year_val,
        MONTH(d.transaction_time) as month_val,
        MONTHNAME(d.transaction_time) as month_name,
        
        -- Deposit metrics
        SUM(CASE WHEN d.category = 'deposit' THEN d.amount_usd ELSE 0 END) as total_deposits,
        COUNT(CASE WHEN d.category = 'deposit' THEN 1 END) as deposit_count,
        AVG(CASE WHEN d.category = 'deposit' THEN d.amount_usd END) as avg_deposit_size,
        MAX(CASE WHEN d.category = 'deposit' THEN d.amount_usd ELSE 0 END) as max_deposit,
        MIN(CASE WHEN d.category = 'deposit' AND d.amount_usd > 0 THEN d.amount_usd END) as min_deposit,
        
        -- Withdrawal metrics
        SUM(CASE WHEN d.category = 'withdrawal' THEN d.amount_usd ELSE 0 END) as total_withdrawals,
        COUNT(CASE WHEN d.category = 'withdrawal' THEN 1 END) as withdrawal_count,
        
        -- Net deposits (deposits - withdrawals)
        SUM(CASE WHEN d.category = 'deposit' THEN d.amount_usd ELSE 0 END) - 
        SUM(CASE WHEN d.category = 'withdrawal' THEN d.amount_usd ELSE 0 END) as net_deposits,
        
        -- Depositor metrics
        COUNT(DISTINCT CASE WHEN d.category = 'deposit' THEN d.binary_user_id_1 END) as unique_depositors,
        
        -- Repeat depositors (deposited more than once in the month)
        COUNT(DISTINCT CASE 
            WHEN d.category = 'deposit' AND 
                 d.binary_user_id_1 IN (
                     SELECT binary_user_id_1 
                     FROM deposits d2 
                     WHERE d2.category = 'deposit' 
                     AND DATE_FORMAT(d2.transaction_time, '%Y-%m') = DATE_FORMAT(d.transaction_time, '%Y-%m')
                     AND d2.binary_user_id_1 = d.binary_user_id_1
                     GROUP BY d2.binary_user_id_1 
                     HAVING COUNT(*) > 1
                 )
            THEN d.binary_user_id_1 
        END) as repeat_depositors,
        
        -- First-time depositors (first deposit ever for this user)
        COUNT(DISTINCT CASE 
            WHEN d.category = 'deposit' AND 
                 d.binary_user_id_1 NOT IN (
                     SELECT DISTINCT binary_user_id_1 
                     FROM deposits d2 
                     WHERE d2.category = 'deposit' 
                     AND d2.transaction_time < d.transaction_time
                 )
            THEN d.binary_user_id_1 
        END) as first_time_depositors
        
    FROM deposits d
    LEFT JOIN clients c ON d.binary_user_id_1 = c.binary_user_id
    WHERE d.transaction_time IS NOT NULL
    GROUP BY 
        COALESCE(c.partnerId, d.affiliate_id),
        DATE_FORMAT(d.transaction_time, '%Y-%m'),
        YEAR(d.transaction_time),
        MONTH(d.transaction_time),
        MONTHNAME(d.transaction_time)
    ORDER BY partner_id, year_month_str;
    
    COMMIT;
    
    SELECT CONCAT('Monthly deposits cube populated with ', ROW_COUNT(), ' records') as status;
END$$

DELIMITER ;

-- ============================================================================
-- REFRESH PROCEDURE
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS refresh_monthly_deposits_cube$$

CREATE PROCEDURE refresh_monthly_deposits_cube()
BEGIN
    CALL populate_cube_monthly_deposits();
    SELECT 'Monthly deposits cube refreshed successfully' as status;
END$$

DELIMITER ;

-- ============================================================================
-- USEFUL QUERIES FOR TESTING
-- ============================================================================

-- Test query: Get monthly deposits for a specific partner
-- SELECT * FROM cube_monthly_deposits WHERE partner_id = 'P-0001' ORDER BY year_month_str DESC LIMIT 12;

-- Test query: Get all-time totals by partner
-- SELECT 
--     partner_id,
--     SUM(total_deposits) as lifetime_deposits,
--     SUM(deposit_count) as total_deposit_transactions,
--     AVG(avg_deposit_size) as avg_monthly_deposit_size,
--     COUNT(*) as months_active
-- FROM cube_monthly_deposits 
-- GROUP BY partner_id 
-- ORDER BY lifetime_deposits DESC;

-- Test query: Get current month deposits (MTD)
-- SELECT 
--     partner_id,
--     total_deposits as mtd_deposits,
--     deposit_count as mtd_deposit_count,
--     unique_depositors as mtd_unique_depositors
-- FROM cube_monthly_deposits 
-- WHERE year_month_str = DATE_FORMAT(CURDATE(), '%Y-%m');

-- ============================================================================
-- INITIAL POPULATION
-- ============================================================================

-- Populate the cube with existing data
CALL populate_cube_monthly_deposits();

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
    'Monthly Deposits Cube Created Successfully' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT partner_id) as unique_partners,
    MIN(year_month_str) as earliest_month,
    MAX(year_month_str) as latest_month
FROM cube_monthly_deposits;
