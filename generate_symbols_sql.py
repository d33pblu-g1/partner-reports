#!/usr/bin/env python3
"""
Generate SQL INSERT statements from symbols CSV file
This creates a .sql file that can be imported into MySQL
"""

import csv
import sys

def escape_sql_string(value):
    """Escape string for SQL"""
    if value is None or value == '':
        return 'NULL'
    # Escape single quotes and backslashes
    value = str(value).replace('\\', '\\\\').replace("'", "\\'")
    return f"'{value}'"

def generate_sql(csv_file_path, output_file):
    """Generate SQL from CSV file"""
    print(f"Reading CSV file: {csv_file_path}")
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        # Open output file
        with open(output_file, 'w', encoding='utf-8') as sql_file:
            # Write header
            sql_file.write("-- Symbols Data Import\n")
            sql_file.write("-- Generated from symbols.csv\n\n")
            sql_file.write("USE partner_report;\n\n")
            sql_file.write("-- Disable foreign key checks for faster import\n")
            sql_file.write("SET FOREIGN_KEY_CHECKS = 0;\n")
            sql_file.write("SET UNIQUE_CHECKS = 0;\n")
            sql_file.write("SET AUTOCOMMIT = 0;\n\n")
            
            count = 0
            batch_size = 100
            values = []
            
            for row in csv_reader:
                # Build value tuple
                value_tuple = (
                    escape_sql_string(row['platform']),
                    escape_sql_string(row['symbol']),
                    escape_sql_string(row['unified_symbol']),
                    escape_sql_string(row['unified_asset_type']),
                    escape_sql_string(row['unified_asset_sub_type']),
                    escape_sql_string(row['unified_category']),
                    escape_sql_string(row['platform_symbol_unified_symbol']),
                    row['Duplicate check'] if row['Duplicate check'] else '0',
                    row['Validation check'] if row['Validation check'] else '0'
                )
                
                values.append(f"({', '.join(value_tuple)})")
                count += 1
                
                # Write in batches
                if len(values) >= batch_size:
                    sql_file.write("INSERT INTO symbols (platform, symbol, unified_symbol, unified_asset_type, unified_asset_sub_type, unified_category, platform_symbol_unified_symbol, duplicate_check, validation_check) VALUES\n")
                    sql_file.write(',\n'.join(values))
                    sql_file.write(";\n\n")
                    values = []
                    print(f"  Generated {count} INSERT statements...", end='\r')
            
            # Write remaining values
            if values:
                sql_file.write("INSERT INTO symbols (platform, symbol, unified_symbol, unified_asset_type, unified_asset_sub_type, unified_category, platform_symbol_unified_symbol, duplicate_check, validation_check) VALUES\n")
                sql_file.write(',\n'.join(values))
                sql_file.write(";\n\n")
            
            # Write footer
            sql_file.write("COMMIT;\n")
            sql_file.write("SET FOREIGN_KEY_CHECKS = 1;\n")
            sql_file.write("SET UNIQUE_CHECKS = 1;\n")
            sql_file.write("SET AUTOCOMMIT = 1;\n\n")
            sql_file.write(f"-- Total records: {count}\n")
            
            print(f"\n✓ Generated {count} INSERT statements")
            print(f"✓ SQL file created: {output_file}")

if __name__ == "__main__":
    csv_file = '/Users/michalisphytides/Downloads/symbols.csv'
    output_file = '/Users/michalisphytides/Desktop/partner-report/symbols_data.sql'
    
    print("=" * 60)
    print("Symbol SQL Generator")
    print("=" * 60)
    print()
    
    try:
        generate_sql(csv_file, output_file)
        
        print("\n" + "=" * 60)
        print("SQL file generated successfully!")
        print("=" * 60)
        print("\nTo import into MySQL, run:")
        print(f"  mysql -u root -p partner_report < {output_file}")
        print()
        
    except FileNotFoundError:
        print(f"✗ Error: File not found: {csv_file}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

