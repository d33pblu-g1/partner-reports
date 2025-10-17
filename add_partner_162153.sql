-- Add Partner: Mirza (ID: 162153)
USE partner_report;

-- Insert partner record
INSERT INTO partners (partner_id, name, tier) 
VALUES ('162153', 'Mirza', 'Bronze')
ON DUPLICATE KEY UPDATE 
    name = 'Mirza';

-- Verify the insert
SELECT * FROM partners WHERE partner_id = '162153';

-- Show success message
SELECT 
    '✓ Partner created successfully' as status,
    partner_id,
    name,
    tier,
    created_at
FROM partners 
WHERE partner_id = '162153';

