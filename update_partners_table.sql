-- Update Partners Table: Add Age Column and Insert Mirza
USE partner_report;

-- Step 1: Add age and join_date columns to partners table
ALTER TABLE partners 
ADD COLUMN join_date DATE AFTER name,
ADD COLUMN age INT AFTER join_date;

-- Step 2: Insert partner Mirza
INSERT INTO partners (partner_id, name, join_date, tier) 
VALUES ('162153', 'Mirza', '2021-09-03', 'Gold')
ON DUPLICATE KEY UPDATE 
    name = 'Mirza',
    join_date = '2021-09-03',
    tier = 'Gold';

-- Step 3: Calculate age based on join_date (years since joining)
UPDATE partners 
SET age = TIMESTAMPDIFF(YEAR, join_date, CURDATE())
WHERE join_date IS NOT NULL;

-- Verify the changes
SELECT 
    partner_id,
    name,
    join_date,
    age,
    tier,
    CONCAT(age, ' years since joining') as age_description
FROM partners 
WHERE partner_id = '162153';

-- Show all partners with age
SELECT * FROM partners ORDER BY join_date;

