-- Add Country_Rank and Alternate_Accounts columns to partners table

USE partner_report;

-- Add Country_Rank column
ALTER TABLE partners 
ADD COLUMN Country_Rank INT NULL AFTER tier;

-- Add Alternate_Accounts column (storing as TEXT to allow multiple accounts)
ALTER TABLE partners 
ADD COLUMN Alternate_Accounts TEXT NULL AFTER Country_Rank;

-- Add index for Country_Rank for better query performance
CREATE INDEX idx_country_rank ON partners(Country_Rank);

-- Show updated table structure
DESCRIBE partners;

-- Optional: Update some sample data (uncomment and modify as needed)
-- UPDATE partners SET Country_Rank = 1 WHERE partner_id = '162153';
-- UPDATE partners SET Alternate_Accounts = 'CR123456,CR789012' WHERE partner_id = '162153';

