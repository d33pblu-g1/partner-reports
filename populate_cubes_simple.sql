-- Simple Cube Population Script
USE partner_report;

-- Populate cube_partner_dashboard
INSERT INTO cube_partner_dashboard (
    partner_id, partner_name, partner_tier,
    total_clients, total_deposits, total_commissions, total_trades
)
SELECT 
    p.partner_id,
    p.name,
    p.tier,
    COUNT(DISTINCT c.binary_user_id) as total_clients,
    COALESCE(SUM(d.amount_usd), 0) as total_deposits,
    COALESCE(SUM(t.closed_pnl_usd), 0) as total_commissions,
    COUNT(t.id) as total_trades
FROM partners p
LEFT JOIN clients c ON p.partner_id = c.partnerId
LEFT JOIN trades t ON c.binary_user_id = t.binary_user_id
LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1 AND d.affiliate_id = p.partner_id
GROUP BY p.partner_id, p.name, p.tier
ON DUPLICATE KEY UPDATE
    partner_name = VALUES(partner_name),
    partner_tier = VALUES(partner_tier),
    total_clients = VALUES(total_clients),
    total_deposits = VALUES(total_deposits),
    total_commissions = VALUES(total_commissions),
    total_trades = VALUES(total_trades);

-- Show results
SELECT 'Cubes populated' as status;
SELECT COUNT(*) as dashboard_records FROM cube_partner_dashboard;
SELECT * FROM cube_partner_dashboard LIMIT 3;

