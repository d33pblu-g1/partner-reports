-- Add country_manager and country_manager_tel columns to partners table

USE partner_report;

-- Add columns
ALTER TABLE partners 
ADD COLUMN country_manager VARCHAR(255) AFTER tier,
ADD COLUMN country_manager_tel VARCHAR(50) AFTER country_manager;

-- Populate with default values
UPDATE partners 
SET country_manager = 'Samiullah Naseem',
    country_manager_tel = '+971521462917'
WHERE country_manager IS NULL;

-- Show updated structure
DESCRIBE partners;

-- Show sample data
SELECT partner_id, name, tier, country_manager, country_manager_tel FROM partners LIMIT 5;

