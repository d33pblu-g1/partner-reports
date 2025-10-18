#!/usr/bin/env python3
"""
Create deposits table from deposits1.csv
Drops existing deposits table and creates new one based on CSV structure
"""

import csv
import sys

csv_file = '/Users/michalisphytides/Downloads/deposits1.csv'

# Read CSV to get headers and sample data
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = next(reader)
    
    print("-- Drop and recreate deposits table from deposits1.csv")
    print("USE partner_report;\n")
    
    # Drop foreign key constraints from other tables first
    print("-- Drop foreign key constraints from deposits table")
    print("SET FOREIGN_KEY_CHECKS = 0;")
    print("DROP TABLE IF EXISTS deposits;")
    print("SET FOREIGN_KEY_CHECKS = 1;\n")
    
    # Create table with columns based on CSV headers
    print("-- Create deposits table with columns from CSV")
    print("CREATE TABLE deposits (")
    print("    id INT AUTO_INCREMENT PRIMARY KEY,")
    
    # Map CSV columns to SQL types
    column_mappings = {
        'binary_user_id_1': 'VARCHAR(50)',
        'transaction_id': 'VARCHAR(50)',
        'payment_id': 'VARCHAR(50)',
        'currency_code': 'VARCHAR(10)',
        'transaction_time': 'DATETIME',
        'amount': 'DECIMAL(15,2)',
        'payment_gateway_code': 'VARCHAR(100)',
        'payment_type_code': 'VARCHAR(100)',
        'account_id': 'VARCHAR(50)',
        'client_loginid': 'VARCHAR(50)',
        'remark': 'TEXT',
        'transfer_fees': 'DECIMAL(15,2)',
        'is_pa': 'VARCHAR(10)',
        'amount_usd': 'DECIMAL(15,2)',
        'transfer_type': 'VARCHAR(100)',
        'category': 'VARCHAR(100)',
        'payment_processor': 'VARCHAR(100)',
        'payment_method': 'VARCHAR(100)',
        'affiliate_id': 'VARCHAR(50)',
        'target_loginid': 'VARCHAR(50)',
        'target_is_pa': 'VARCHAR(10)'
    }
    
    for i, header in enumerate(headers):
        col_type = column_mappings.get(header, 'TEXT')
        comma = ',' if i < len(headers) - 1 or i == len(headers) - 1 else ''
        print(f"    {header} {col_type}{comma}")
    
    print(",")
    print("    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,")
    print("    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,")
    print("    INDEX idx_binary_user_id (binary_user_id_1),")
    print("    INDEX idx_affiliate_id (affiliate_id),")
    print("    INDEX idx_transaction_time (transaction_time),")
    print("    INDEX idx_category (category)")
    print(");\n")
    
    print("-- Load data from CSV")
    print("-- Note: Run this manually or use the Python import script")
    print(f"-- CSV file: {csv_file}")
    print(f"-- Total columns: {len(headers)}")
    print(f"-- Columns: {', '.join(headers)}\n")
    
    print("-- Summary")
    print(f"SELECT 'Deposits table created with {len(headers)} columns' as status;")

print("\nSQL script generated successfully!", file=sys.stderr)
print(f"Columns found: {', '.join(headers)}", file=sys.stderr)

