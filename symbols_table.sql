-- Symbols Table Creation
USE partner_report;

-- Create symbols table
CREATE TABLE IF NOT EXISTS symbols (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    symbol VARCHAR(100) NOT NULL,
    unified_symbol VARCHAR(100),
    unified_asset_type VARCHAR(100),
    unified_asset_sub_type VARCHAR(100),
    unified_category VARCHAR(50),
    platform_symbol_unified_symbol VARCHAR(200),
    duplicate_check TINYINT DEFAULT 0,
    validation_check TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_platform (platform),
    INDEX idx_symbol (symbol),
    INDEX idx_unified_symbol (unified_symbol),
    INDEX idx_asset_type (unified_asset_type),
    INDEX idx_category (unified_category),
    UNIQUE KEY unique_platform_symbol (platform, symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

