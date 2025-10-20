-- ============================================================================
-- POPULATE CLIENT TIER FIELD WITH DUMMY VALUES
-- ============================================================================
-- This script updates the tier field in the clients table with dummy values:
-- "new", "active", "dormant", and "VIP"
-- ============================================================================

USE partner_report;

-- Update client tiers with dummy values
-- Distribution: 30% new, 40% active, 20% dormant, 10% VIP

UPDATE clients 
SET tier = CASE 
    WHEN MOD(CAST(SUBSTRING(binary_user_id, -3) AS UNSIGNED), 10) < 3 THEN 'new'
    WHEN MOD(CAST(SUBSTRING(binary_user_id, -3) AS UNSIGNED), 10) < 7 THEN 'active'
    WHEN MOD(CAST(SUBSTRING(binary_user_id, -3) AS UNSIGNED), 10) < 9 THEN 'dormant'
    ELSE 'VIP'
END
WHERE tier IS NULL;

-- Alternative approach using RAND() for more random distribution
-- UPDATE clients 
-- SET tier = CASE 
--     WHEN RAND() < 0.3 THEN 'new'
--     WHEN RAND() < 0.7 THEN 'active'
--     WHEN RAND() < 0.9 THEN 'dormant'
--     ELSE 'VIP'
-- END
-- WHERE tier IS NULL;

-- Verify the distribution
SELECT 
    tier,
    COUNT(*) as client_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM clients)), 1) as percentage
FROM clients 
GROUP BY tier 
ORDER BY 
    CASE tier 
        WHEN 'VIP' THEN 1
        WHEN 'active' THEN 2
        WHEN 'new' THEN 3
        WHEN 'dormant' THEN 4
        ELSE 5
    END;

-- Show sample of updated records
SELECT 
    binary_user_id,
    name,
    tier,
    country,
    joinDate
FROM clients 
ORDER BY RAND() 
LIMIT 10;

-- Summary
SELECT 
    'Client Tier Population Complete' as status,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN tier IS NOT NULL THEN 1 END) as clients_with_tier,
    COUNT(CASE WHEN tier IS NULL THEN 1 END) as clients_without_tier
FROM clients;
