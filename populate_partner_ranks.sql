-- ============================================================================
-- POPULATE PARTNERS COUNTRY RANK WITH RANDOM NUMBERS (1-15)
-- ============================================================================
-- This script updates the Country_Rank field in the partners table with
-- random numbers between 1 and 15
-- ============================================================================

USE partner_report;

-- Update partners with random country ranks between 1-15
UPDATE partners 
SET Country_Rank = FLOOR(1 + RAND() * 15)
WHERE Country_Rank IS NULL;

-- Verify the distribution
SELECT 
    Country_Rank,
    COUNT(*) as partner_count,
    GROUP_CONCAT(name ORDER BY name SEPARATOR ', ') as partners
FROM partners 
GROUP BY Country_Rank 
ORDER BY Country_Rank;

-- Show all partners with their ranks
SELECT 
    partner_id,
    name,
    Country_Rank,
    tier,
    country_manager
FROM partners 
ORDER BY Country_Rank, name;

-- Summary statistics
SELECT 
    'Partners Rank Population Complete' as status,
    COUNT(*) as total_partners,
    MIN(Country_Rank) as min_rank,
    MAX(Country_Rank) as max_rank,
    AVG(Country_Rank) as avg_rank,
    COUNT(DISTINCT Country_Rank) as unique_ranks
FROM partners;
