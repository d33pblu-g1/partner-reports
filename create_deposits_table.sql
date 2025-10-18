-- Drop and recreate deposits table from deposits1.csv
USE partner_report;

-- Drop foreign key constraints from deposits table
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS deposits;
SET FOREIGN_KEY_CHECKS = 1;

-- Create deposits table with columns from CSV
CREATE TABLE deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    binary_user_id_1 VARCHAR(50),
    transaction_id VARCHAR(50),
    payment_id VARCHAR(50),
    currency_code VARCHAR(10),
    transaction_time DATETIME,
    amount DECIMAL(15,2),
    payment_gateway_code VARCHAR(100),
    payment_type_code VARCHAR(100),
    account_id VARCHAR(50),
    client_loginid VARCHAR(50),
    remark TEXT,
    transfer_fees DECIMAL(15,2),
    is_pa VARCHAR(10),
    amount_usd DECIMAL(15,2),
    transfer_type VARCHAR(100),
    category VARCHAR(100),
    payment_processor VARCHAR(100),
    payment_method VARCHAR(100),
    affiliate_id VARCHAR(50),
    target_loginid VARCHAR(50),
    target_is_pa VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_binary_user_id (binary_user_id_1),
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_transaction_time (transaction_time),
    INDEX idx_category (category)
);

-- Load data from CSV
-- Note: Run this manually or use the Python import script
-- CSV file: /Users/michalisphytides/Downloads/deposits1.csv
-- Total columns: 21
-- Columns: binary_user_id_1, transaction_id, payment_id, currency_code, transaction_time, amount, payment_gateway_code, payment_type_code, account_id, client_loginid, remark, transfer_fees, is_pa, amount_usd, transfer_type, category, payment_processor, payment_method, affiliate_id, target_loginid, target_is_pa

-- Summary
SELECT 'Deposits table created with 21 columns' as status;
