-- ============================================================================
-- PARTNER PERFORMANCE SCORECARD CUBE
-- ============================================================================
-- This cube provides optimized data for the partner performance scorecard
-- on the home page, ensuring fast loading and comprehensive metrics
-- ============================================================================

USE partner_report;

-- CUBE: Partner Performance Scorecard
DROP TABLE IF EXISTS cube_partner_scorecard;
CREATE TABLE cube_partner_scorecard (
    partner_id VARCHAR(20) PRIMARY KEY,
    partner_name VARCHAR(255),
    partner_tier VARCHAR(50),
    
    -- Core Performance Metrics
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_clients INT DEFAULT 0,
    total_trades INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    avg_trade_size DECIMAL(15,2) DEFAULT 0,
    
    -- MTD (Month-to-Date) Metrics
    mtd_revenue DECIMAL(15,2) DEFAULT 0,
    mtd_clients INT DEFAULT 0,
    mtd_trades INT DEFAULT 0,
    mtd_deposits DECIMAL(15,2) DEFAULT 0,
    
    -- Growth Metrics
    client_growth_rate DECIMAL(5,2) DEFAULT 0,
    revenue_growth_rate DECIMAL(5,2) DEFAULT 0,
    trade_growth_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Indicators
    avg_client_value DECIMAL(15,2) DEFAULT 0,
    client_retention_rate DECIMAL(5,2) DEFAULT 0,
    active_client_ratio DECIMAL(5,2) DEFAULT 0,
    
    -- Monthly Breakdown (Last 6 Months)
    month_1_revenue DECIMAL(15,2) DEFAULT 0,
    month_2_revenue DECIMAL(15,2) DEFAULT 0,
    month_3_revenue DECIMAL(15,2) DEFAULT 0,
    month_4_revenue DECIMAL(15,2) DEFAULT 0,
    month_5_revenue DECIMAL(15,2) DEFAULT 0,
    month_6_revenue DECIMAL(15,2) DEFAULT 0,
    
    month_1_clients INT DEFAULT 0,
    month_2_clients INT DEFAULT 0,
    month_3_clients INT DEFAULT 0,
    month_4_clients INT DEFAULT 0,
    month_5_clients INT DEFAULT 0,
    month_6_clients INT DEFAULT 0,
    
    -- Benchmark Comparisons
    revenue_percentile INT DEFAULT 0,
    client_percentile INT DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_partner_tier (partner_tier),
    INDEX idx_performance_score (performance_score),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB;

-- ============================================================================
-- POPULATE PARTNER SCORECARD CUBE
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS populate_cube_partner_scorecard$$

CREATE PROCEDURE populate_cube_partner_scorecard()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_partner_scorecard;
    
    -- Calculate current month start
    SET @current_month_start = DATE_FORMAT(CURDATE(), '%Y-%m-01');
    SET @current_month_end = LAST_DAY(CURDATE());
    
    -- Insert comprehensive scorecard data
    INSERT INTO cube_partner_scorecard (
        partner_id, partner_name, partner_tier,
        total_revenue, total_clients, total_trades, total_deposits, avg_trade_size,
        mtd_revenue, mtd_clients, mtd_trades, mtd_deposits,
        client_growth_rate, revenue_growth_rate, trade_growth_rate,
        avg_client_value, client_retention_rate, active_client_ratio,
        month_1_revenue, month_2_revenue, month_3_revenue, month_4_revenue, month_5_revenue, month_6_revenue,
        month_1_clients, month_2_clients, month_3_clients, month_4_clients, month_5_clients, month_6_clients,
        revenue_percentile, client_percentile, performance_score
    )
    SELECT 
        p.partner_id,
        p.name as partner_name,
        p.tier as partner_tier,
        
        -- Core Performance Metrics
        COALESCE(SUM(t.expected_revenue_usd), 0) as total_revenue,
        COUNT(DISTINCT c.binary_user_id) as total_clients,
        COUNT(t.id) as total_trades,
        COALESCE(SUM(c.lifetimeDeposits), 0) as total_deposits,
        CASE 
            WHEN COUNT(t.id) > 0 THEN COALESCE(SUM(t.expected_revenue_usd), 0) / COUNT(t.id)
            ELSE 0 
        END as avg_trade_size,
        
        -- MTD Metrics
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as mtd_revenue,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN c.binary_user_id END) as mtd_clients,
        COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN t.id END) as mtd_trades,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(d.transaction_time, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN d.amount_usd ELSE 0 END), 0) as mtd_deposits,
        
        -- Growth Rates (comparing current month to previous month)
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN c.binary_user_id END) > 0
            THEN ((COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN c.binary_user_id END) - 
                   COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN c.binary_user_id END)) * 100.0) /
                  COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN c.binary_user_id END)
            ELSE 0 
        END as client_growth_rate,
        
        CASE 
            WHEN COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) > 0
            THEN ((COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) - 
                   COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0)) * 100.0) /
                  COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0)
            ELSE 0 
        END as revenue_growth_rate,
        
        CASE 
            WHEN COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.id END) > 0
            THEN ((COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN t.id END) - 
                   COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.id END)) * 100.0) /
                  COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.id END)
            ELSE 0 
        END as trade_growth_rate,
        
        -- Performance Indicators
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 THEN COALESCE(SUM(c.lifetimeDeposits), 0) / COUNT(DISTINCT c.binary_user_id)
            ELSE 0 
        END as avg_client_value,
        
        -- Client retention rate (clients who traded in last 30 days / total clients)
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.binary_user_id END) * 100.0) / COUNT(DISTINCT c.binary_user_id)
            ELSE 0 
        END as client_retention_rate,
        
        -- Active client ratio (clients with trades in last 30 days / total clients)
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.binary_user_id END) * 100.0) / COUNT(DISTINCT c.binary_user_id)
            ELSE 0 
        END as active_client_ratio,
        
        -- Monthly Breakdown (Last 6 Months)
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_1_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_2_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_3_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_4_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_5_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_6_revenue,
        
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_1_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_2_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_3_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_4_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_5_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_6_clients,
        
        -- Benchmark Comparisons (will be calculated in a separate step)
        0 as revenue_percentile,
        0 as client_percentile,
        0 as performance_score
        
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    GROUP BY p.partner_id, p.name, p.tier;
    
    -- Calculate percentiles and performance scores
    UPDATE cube_partner_scorecard ps1
    JOIN (
        SELECT 
            partner_id,
            PERCENT_RANK() OVER (ORDER BY total_revenue) * 100 as revenue_percentile,
            PERCENT_RANK() OVER (ORDER BY total_clients) * 100 as client_percentile
        FROM cube_partner_scorecard
    ) ps2 ON ps1.partner_id = ps2.partner_id
    SET 
        ps1.revenue_percentile = ROUND(ps2.revenue_percentile),
        ps1.client_percentile = ROUND(ps2.client_percentile),
        ps1.performance_score = ROUND((ps2.revenue_percentile + ps2.client_percentile) / 2, 2);
    
    COMMIT;
    
    SELECT CONCAT('Partner scorecard cube populated with ', ROW_COUNT(), ' records') as status;
END$$

DELIMITER ;

-- ============================================================================
-- REFRESH PROCEDURE
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS refresh_partner_scorecard_cube$$

CREATE PROCEDURE refresh_partner_scorecard_cube()
BEGIN
    CALL populate_cube_partner_scorecard();
    SELECT 'Partner scorecard cube refreshed successfully' as status;
END$$

DELIMITER ;

-- ============================================================================
-- INITIAL POPULATION
-- ============================================================================

-- Populate the cube with existing data
CALL populate_cube_partner_scorecard();

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
    'Partner Scorecard Cube Created Successfully' as status,
    COUNT(*) as total_partners,
    AVG(total_revenue) as avg_revenue,
    AVG(total_clients) as avg_clients,
    AVG(performance_score) as avg_performance_score
FROM cube_partner_scorecard;
