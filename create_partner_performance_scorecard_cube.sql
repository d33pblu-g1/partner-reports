-- ============================================================================
-- PARTNER PERFORMANCE SCORECARD CUBE
-- ============================================================================
-- This cube provides comprehensive performance metrics for the Partner Performance Scorecard
-- Includes KPIs, trends, benchmarks, and scoring for each partner
-- ============================================================================

USE partner_report;

-- CUBE: Partner Performance Scorecard
DROP TABLE IF EXISTS cube_partner_performance_scorecard;
CREATE TABLE cube_partner_performance_scorecard (
    partner_id VARCHAR(20) PRIMARY KEY,
    partner_name VARCHAR(255),
    partner_tier VARCHAR(50),
    partner_rank INT,
    
    -- Core Performance Metrics
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_clients INT DEFAULT 0,
    total_trades INT DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_volume DECIMAL(15,2) DEFAULT 0,
    
    -- MTD (Month-to-Date) Metrics
    mtd_revenue DECIMAL(15,2) DEFAULT 0,
    mtd_clients INT DEFAULT 0,
    mtd_trades INT DEFAULT 0,
    mtd_deposits DECIMAL(15,2) DEFAULT 0,
    mtd_volume DECIMAL(15,2) DEFAULT 0,
    
    -- Growth Metrics (Month-over-Month)
    revenue_growth_rate DECIMAL(5,2) DEFAULT 0,
    client_growth_rate DECIMAL(5,2) DEFAULT 0,
    trade_growth_rate DECIMAL(5,2) DEFAULT 0,
    deposit_growth_rate DECIMAL(5,2) DEFAULT 0,
    volume_growth_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Indicators
    avg_client_value DECIMAL(15,2) DEFAULT 0,
    avg_trade_size DECIMAL(15,2) DEFAULT 0,
    client_retention_rate DECIMAL(5,2) DEFAULT 0,
    active_client_ratio DECIMAL(5,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Monthly Breakdown (Last 12 Months)
    month_1_revenue DECIMAL(15,2) DEFAULT 0,
    month_2_revenue DECIMAL(15,2) DEFAULT 0,
    month_3_revenue DECIMAL(15,2) DEFAULT 0,
    month_4_revenue DECIMAL(15,2) DEFAULT 0,
    month_5_revenue DECIMAL(15,2) DEFAULT 0,
    month_6_revenue DECIMAL(15,2) DEFAULT 0,
    month_7_revenue DECIMAL(15,2) DEFAULT 0,
    month_8_revenue DECIMAL(15,2) DEFAULT 0,
    month_9_revenue DECIMAL(15,2) DEFAULT 0,
    month_10_revenue DECIMAL(15,2) DEFAULT 0,
    month_11_revenue DECIMAL(15,2) DEFAULT 0,
    month_12_revenue DECIMAL(15,2) DEFAULT 0,
    
    month_1_clients INT DEFAULT 0,
    month_2_clients INT DEFAULT 0,
    month_3_clients INT DEFAULT 0,
    month_4_clients INT DEFAULT 0,
    month_5_clients INT DEFAULT 0,
    month_6_clients INT DEFAULT 0,
    month_7_clients INT DEFAULT 0,
    month_8_clients INT DEFAULT 0,
    month_9_clients INT DEFAULT 0,
    month_10_clients INT DEFAULT 0,
    month_11_clients INT DEFAULT 0,
    month_12_clients INT DEFAULT 0,
    
    -- Benchmark Comparisons (Percentiles)
    revenue_percentile INT DEFAULT 0,
    client_percentile INT DEFAULT 0,
    trade_percentile INT DEFAULT 0,
    deposit_percentile INT DEFAULT 0,
    volume_percentile INT DEFAULT 0,
    
    -- Performance Scores (0-100)
    overall_performance_score DECIMAL(5,2) DEFAULT 0,
    revenue_score DECIMAL(5,2) DEFAULT 0,
    client_score DECIMAL(5,2) DEFAULT 0,
    growth_score DECIMAL(5,2) DEFAULT 0,
    efficiency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Trend Indicators
    revenue_trend VARCHAR(10) DEFAULT 'stable', -- 'up', 'down', 'stable'
    client_trend VARCHAR(10) DEFAULT 'stable',
    trade_trend VARCHAR(10) DEFAULT 'stable',
    deposit_trend VARCHAR(10) DEFAULT 'stable',
    
    -- Risk Indicators
    churn_risk_level VARCHAR(10) DEFAULT 'low', -- 'low', 'medium', 'high'
    performance_risk_level VARCHAR(10) DEFAULT 'low',
    
    -- Timestamps
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_partner_tier (partner_tier),
    INDEX idx_partner_rank (partner_rank),
    INDEX idx_performance_score (overall_performance_score),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB;

-- ============================================================================
-- POPULATE PARTNER PERFORMANCE SCORECARD CUBE
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS populate_cube_partner_performance_scorecard$$

CREATE PROCEDURE populate_cube_partner_performance_scorecard()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_partner_performance_scorecard;
    
    -- Calculate current month and previous month
    SET @current_month = DATE_FORMAT(CURDATE(), '%Y-%m');
    SET @previous_month = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m');
    
    -- Insert comprehensive performance data
    INSERT INTO cube_partner_performance_scorecard (
        partner_id, partner_name, partner_tier, partner_rank,
        total_revenue, total_clients, total_trades, total_deposits, total_volume,
        mtd_revenue, mtd_clients, mtd_trades, mtd_deposits, mtd_volume,
        revenue_growth_rate, client_growth_rate, trade_growth_rate, deposit_growth_rate, volume_growth_rate,
        avg_client_value, avg_trade_size, client_retention_rate, active_client_ratio, conversion_rate,
        month_1_revenue, month_2_revenue, month_3_revenue, month_4_revenue, month_5_revenue, month_6_revenue,
        month_7_revenue, month_8_revenue, month_9_revenue, month_10_revenue, month_11_revenue, month_12_revenue,
        month_1_clients, month_2_clients, month_3_clients, month_4_clients, month_5_clients, month_6_clients,
        month_7_clients, month_8_clients, month_9_clients, month_10_clients, month_11_clients, month_12_clients,
        revenue_percentile, client_percentile, trade_percentile, deposit_percentile, volume_percentile,
        overall_performance_score, revenue_score, client_score, growth_score, efficiency_score,
        revenue_trend, client_trend, trade_trend, deposit_trend,
        churn_risk_level, performance_risk_level
    )
    SELECT 
        p.partner_id,
        p.name as partner_name,
        p.tier as partner_tier,
        p.Country_Rank as partner_rank,
        
        -- Core Performance Metrics
        COALESCE(SUM(t.expected_revenue_usd), 0) as total_revenue,
        COUNT(DISTINCT c.binary_user_id) as total_clients,
        COUNT(t.id) as total_trades,
        COALESCE(SUM(c.lifetimeDeposits), 0) as total_deposits,
        COALESCE(SUM(t.volume_usd), 0) as total_volume,
        
        -- MTD Metrics
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @current_month THEN t.expected_revenue_usd ELSE 0 END), 0) as mtd_revenue,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = @current_month THEN c.binary_user_id END) as mtd_clients,
        COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @current_month THEN t.id END) as mtd_trades,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(d.transaction_time, '%Y-%m') = @current_month THEN d.amount_usd ELSE 0 END), 0) as mtd_deposits,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @current_month THEN t.volume_usd ELSE 0 END), 0) as mtd_volume,
        
        -- Growth Rates (comparing current month to previous month)
        CASE 
            WHEN COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.expected_revenue_usd ELSE 0 END), 0) > 0
            THEN ROUND(((COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @current_month THEN t.expected_revenue_usd ELSE 0 END), 0) - 
                   COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.expected_revenue_usd ELSE 0 END), 0)) * 100.0) /
                  COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.expected_revenue_usd ELSE 0 END), 0), 2)
            ELSE 0 
        END as revenue_growth_rate,
        
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = @previous_month THEN c.binary_user_id END) > 0
            THEN ROUND(((COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = @current_month THEN c.binary_user_id END) - 
                   COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = @previous_month THEN c.binary_user_id END)) * 100.0) /
                  COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = @previous_month THEN c.binary_user_id END), 2)
            ELSE 0 
        END as client_growth_rate,
        
        CASE 
            WHEN COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.id END) > 0
            THEN ROUND(((COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @current_month THEN t.id END) - 
                   COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.id END)) * 100.0) /
                  COUNT(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.id END), 2)
            ELSE 0 
        END as trade_growth_rate,
        
        CASE 
            WHEN COALESCE(SUM(CASE WHEN DATE_FORMAT(d.transaction_time, '%Y-%m') = @previous_month THEN d.amount_usd ELSE 0 END), 0) > 0
            THEN ROUND(((COALESCE(SUM(CASE WHEN DATE_FORMAT(d.transaction_time, '%Y-%m') = @current_month THEN d.amount_usd ELSE 0 END), 0) - 
                   COALESCE(SUM(CASE WHEN DATE_FORMAT(d.transaction_time, '%Y-%m') = @previous_month THEN d.amount_usd ELSE 0 END), 0)) * 100.0) /
                  COALESCE(SUM(CASE WHEN DATE_FORMAT(d.transaction_time, '%Y-%m') = @previous_month THEN d.amount_usd ELSE 0 END), 0), 2)
            ELSE 0 
        END as deposit_growth_rate,
        
        CASE 
            WHEN COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.volume_usd ELSE 0 END), 0) > 0
            THEN ROUND(((COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @current_month THEN t.volume_usd ELSE 0 END), 0) - 
                   COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.volume_usd ELSE 0 END), 0)) * 100.0) /
                  COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = @previous_month THEN t.volume_usd ELSE 0 END), 0), 2)
            ELSE 0 
        END as volume_growth_rate,
        
        -- Performance Indicators
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 THEN ROUND(COALESCE(SUM(c.lifetimeDeposits), 0) / COUNT(DISTINCT c.binary_user_id), 2)
            ELSE 0 
        END as avg_client_value,
        
        CASE 
            WHEN COUNT(t.id) > 0 THEN ROUND(COALESCE(SUM(t.expected_revenue_usd), 0) / COUNT(t.id), 2)
            ELSE 0 
        END as avg_trade_size,
        
        -- Client retention rate (clients who traded in last 30 days / total clients)
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 
            THEN ROUND((COUNT(DISTINCT CASE WHEN t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.binary_user_id END) * 100.0) / COUNT(DISTINCT c.binary_user_id), 2)
            ELSE 0 
        END as client_retention_rate,
        
        -- Active client ratio (clients with trades in last 30 days / total clients)
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 
            THEN ROUND((COUNT(DISTINCT CASE WHEN t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.binary_user_id END) * 100.0) / COUNT(DISTINCT c.binary_user_id), 2)
            ELSE 0 
        END as active_client_ratio,
        
        -- Conversion rate (clients with deposits / total clients)
        CASE 
            WHEN COUNT(DISTINCT c.binary_user_id) > 0 
            THEN ROUND((COUNT(DISTINCT CASE WHEN c.lifetimeDeposits > 0 THEN c.binary_user_id END) * 100.0) / COUNT(DISTINCT c.binary_user_id), 2)
            ELSE 0 
        END as conversion_rate,
        
        -- Monthly Breakdown (Last 12 Months)
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_1_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_2_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_3_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_4_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_5_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_6_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_7_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_8_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_9_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 9 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_10_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 10 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_11_revenue,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m') THEN t.expected_revenue_usd ELSE 0 END), 0) as month_12_revenue,
        
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_1_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_2_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_3_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_4_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_5_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_6_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_7_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_8_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_9_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 9 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_10_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 10 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_11_clients,
        COUNT(DISTINCT CASE WHEN DATE_FORMAT(c.joinDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m') THEN c.binary_user_id END) as month_12_clients,
        
        -- Percentiles (will be calculated in separate step)
        0 as revenue_percentile,
        0 as client_percentile,
        0 as trade_percentile,
        0 as deposit_percentile,
        0 as volume_percentile,
        
        -- Performance Scores (will be calculated in separate step)
        0 as overall_performance_score,
        0 as revenue_score,
        0 as client_score,
        0 as growth_score,
        0 as efficiency_score,
        
        -- Trend Indicators (will be calculated in separate step)
        'stable' as revenue_trend,
        'stable' as client_trend,
        'stable' as trade_trend,
        'stable' as deposit_trend,
        
        -- Risk Indicators (will be calculated in separate step)
        'low' as churn_risk_level,
        'low' as performance_risk_level
        
    FROM partners p
    LEFT JOIN clients c ON p.partner_id = c.partnerId
    LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
    LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
    GROUP BY p.partner_id, p.name, p.tier, p.Country_Rank;
    
    -- Calculate percentiles
    UPDATE cube_partner_performance_scorecard ps1
    JOIN (
        SELECT 
            partner_id,
            PERCENT_RANK() OVER (ORDER BY total_revenue) * 100 as revenue_percentile,
            PERCENT_RANK() OVER (ORDER BY total_clients) * 100 as client_percentile,
            PERCENT_RANK() OVER (ORDER BY total_trades) * 100 as trade_percentile,
            PERCENT_RANK() OVER (ORDER BY total_deposits) * 100 as deposit_percentile,
            PERCENT_RANK() OVER (ORDER BY total_volume) * 100 as volume_percentile
        FROM cube_partner_performance_scorecard
    ) ps2 ON ps1.partner_id = ps2.partner_id
    SET 
        ps1.revenue_percentile = ROUND(ps2.revenue_percentile),
        ps1.client_percentile = ROUND(ps2.client_percentile),
        ps1.trade_percentile = ROUND(ps2.trade_percentile),
        ps1.deposit_percentile = ROUND(ps2.deposit_percentile),
        ps1.volume_percentile = ROUND(ps2.volume_percentile);
    
    -- Calculate performance scores
    UPDATE cube_partner_performance_scorecard
    SET 
        revenue_score = ROUND((revenue_percentile + 
            CASE WHEN revenue_growth_rate > 0 THEN 20 ELSE 0 END +
            CASE WHEN revenue_growth_rate > 10 THEN 10 ELSE 0 END +
            CASE WHEN revenue_growth_rate > 25 THEN 10 ELSE 0 END) / 2, 2),
        
        client_score = ROUND((client_percentile + 
            CASE WHEN client_growth_rate > 0 THEN 20 ELSE 0 END +
            CASE WHEN client_growth_rate > 10 THEN 10 ELSE 0 END +
            CASE WHEN client_growth_rate > 25 THEN 10 ELSE 0 END +
            CASE WHEN client_retention_rate > 50 THEN 10 ELSE 0 END +
            CASE WHEN client_retention_rate > 75 THEN 10 ELSE 0 END) / 2, 2),
        
        growth_score = ROUND((
            CASE WHEN revenue_growth_rate > 0 THEN 25 ELSE 0 END +
            CASE WHEN client_growth_rate > 0 THEN 25 ELSE 0 END +
            CASE WHEN trade_growth_rate > 0 THEN 25 ELSE 0 END +
            CASE WHEN deposit_growth_rate > 0 THEN 25 ELSE 0 END
        ), 2),
        
        efficiency_score = ROUND((
            CASE WHEN avg_client_value > 1000 THEN 25 ELSE 0 END +
            CASE WHEN avg_trade_size > 10 THEN 25 ELSE 0 END +
            CASE WHEN conversion_rate > 50 THEN 25 ELSE 0 END +
            CASE WHEN active_client_ratio > 30 THEN 25 ELSE 0 END
        ), 2),
        
        overall_performance_score = ROUND((
            revenue_score * 0.3 +
            client_score * 0.3 +
            growth_score * 0.2 +
            efficiency_score * 0.2
        ), 2);
    
    -- Calculate trend indicators
    UPDATE cube_partner_performance_scorecard
    SET 
        revenue_trend = CASE 
            WHEN revenue_growth_rate > 5 THEN 'up'
            WHEN revenue_growth_rate < -5 THEN 'down'
            ELSE 'stable'
        END,
        
        client_trend = CASE 
            WHEN client_growth_rate > 5 THEN 'up'
            WHEN client_growth_rate < -5 THEN 'down'
            ELSE 'stable'
        END,
        
        trade_trend = CASE 
            WHEN trade_growth_rate > 5 THEN 'up'
            WHEN trade_growth_rate < -5 THEN 'down'
            ELSE 'stable'
        END,
        
        deposit_trend = CASE 
            WHEN deposit_growth_rate > 5 THEN 'up'
            WHEN deposit_growth_rate < -5 THEN 'down'
            ELSE 'stable'
        END;
    
    -- Calculate risk indicators
    UPDATE cube_partner_performance_scorecard
    SET 
        churn_risk_level = CASE 
            WHEN client_retention_rate < 20 THEN 'high'
            WHEN client_retention_rate < 40 THEN 'medium'
            ELSE 'low'
        END,
        
        performance_risk_level = CASE 
            WHEN overall_performance_score < 30 THEN 'high'
            WHEN overall_performance_score < 60 THEN 'medium'
            ELSE 'low'
        END;
    
    COMMIT;
    
    SELECT CONCAT('Partner Performance Scorecard cube populated with ', ROW_COUNT(), ' records') as status;
END$$

DELIMITER ;

-- ============================================================================
-- REFRESH PROCEDURE
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS refresh_partner_performance_scorecard_cube$$

CREATE PROCEDURE refresh_partner_performance_scorecard_cube()
BEGIN
    CALL populate_cube_partner_performance_scorecard();
    SELECT 'Partner Performance Scorecard cube refreshed successfully' as status;
END$$

DELIMITER ;

-- ============================================================================
-- INITIAL POPULATION
-- ============================================================================

-- Populate the cube with existing data
CALL populate_cube_partner_performance_scorecard();

-- ============================================================================
-- SUMMARY AND VERIFICATION
-- ============================================================================

SELECT 
    'Partner Performance Scorecard Cube Created Successfully' as status,
    COUNT(*) as total_partners,
    ROUND(AVG(total_revenue), 2) as avg_revenue,
    ROUND(AVG(total_clients), 0) as avg_clients,
    ROUND(AVG(overall_performance_score), 2) as avg_performance_score,
    ROUND(AVG(revenue_growth_rate), 2) as avg_revenue_growth,
    ROUND(AVG(client_growth_rate), 2) as avg_client_growth
FROM cube_partner_performance_scorecard;

-- Show sample data
SELECT 
    partner_id,
    partner_name,
    partner_tier,
    partner_rank,
    total_revenue,
    total_clients,
    overall_performance_score,
    revenue_trend,
    client_trend,
    churn_risk_level,
    performance_risk_level
FROM cube_partner_performance_scorecard
ORDER BY overall_performance_score DESC
LIMIT 5;
