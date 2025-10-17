#!/usr/bin/env python3
"""
Generate SQL INSERT statements from clients CSV file
"""

import csv
from datetime import datetime
import sys

def escape_sql_string(value):
    """Escape string for SQL"""
    if value is None or value == '':
        return 'NULL'
    # Escape single quotes and backslashes
    value = str(value).replace('\\', '\\\\').replace("'", "\\'")
    return f"'{value}'"

def parse_date(date_str):
    """Parse date from CSV format"""
    if not date_str or date_str.strip() == '':
        return 'NULL'
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return f"'{dt.strftime('%Y-%m-%d')}'"
    except:
        return 'NULL'

def parse_boolean(bool_str):
    """Parse boolean from CSV"""
    if not bool_str or bool_str.strip() == '':
        return '0'
    return '1' if bool_str.strip().upper() == 'TRUE' else '0'

def parse_decimal(dec_str):
    """Parse decimal from CSV"""
    if not dec_str or dec_str.strip() == '':
        return '0.00'
    try:
        return str(float(dec_str))
    except:
        return '0.00'

def parse_int(int_str):
    """Parse integer from CSV"""
    if not int_str or int_str.strip() == '':
        return 'NULL'
    try:
        return str(int(float(int_str)))
    except:
        return 'NULL'

def generate_sql(csv_file_path, output_file):
    """Generate SQL from CSV file"""
    print(f"Reading CSV file: {csv_file_path}")
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        # Open output file
        with open(output_file, 'w', encoding='utf-8') as sql_file:
            # Write header
            sql_file.write("-- Clients Data Import\n")
            sql_file.write("-- Generated from clients1.csv\n\n")
            sql_file.write("USE partner_report;\n\n")
            sql_file.write("-- Disable checks for faster import\n")
            sql_file.write("SET FOREIGN_KEY_CHECKS = 0;\n")
            sql_file.write("SET UNIQUE_CHECKS = 0;\n")
            sql_file.write("SET AUTOCOMMIT = 0;\n\n")
            
            count = 0
            skipped = 0
            batch_size = 100
            values = []
            
            for row in csv_reader:
                # Skip rows without customer ID
                if not row.get('binary_user_id'):
                    skipped += 1
                    continue
                
                # Extract and transform data
                customer_id = escape_sql_string(str(row['binary_user_id']).strip())
                name = escape_sql_string(row.get('name', '').strip())
                country = escape_sql_string(row.get('country', '').strip())
                join_date = parse_date(row.get('joinDate', ''))
                account_type = escape_sql_string(row.get('account_type', '').strip())
                account_number = escape_sql_string(row.get('accountNumber', '').strip())
                lifetime_deposits = parse_decimal(row.get('lifetimeDeposits', '0'))
                commission_plan = escape_sql_string(row.get('commissionPlan', '').strip())
                tracking_link_used = escape_sql_string(row.get('trackingLinkUsed', '').strip())
                tier = escape_sql_string(row.get('tier', '').strip())
                sub_partner = parse_boolean(row.get('sub-partner', 'FALSE'))
                partner_id = escape_sql_string(row.get('partnerId', '').strip()) if row.get('partnerId', '').strip() else 'NULL'
                email = escape_sql_string(row.get('email', '').strip())
                preferred_language = escape_sql_string(row.get('preferredLanguage', '').strip())
                gender = escape_sql_string(row.get('gender', '').strip())
                age = parse_int(row.get('age', ''))
                
                # Build value tuple
                value_tuple = f"({customer_id}, {name}, {country}, {join_date}, {account_type}, {account_number}, {lifetime_deposits}, {commission_plan}, {tracking_link_used}, {tier}, {sub_partner}, {partner_id}, {email}, {preferred_language}, {gender}, {age})"
                
                values.append(value_tuple)
                count += 1
                
                # Write in batches
                if len(values) >= batch_size:
                    sql_file.write("INSERT INTO clients (customer_id, name, country, join_date, account_type, account_number, lifetime_deposits, commission_plan, tracking_link_used, tier, sub_partner, partner_id, email, preferred_language, gender, age) VALUES\n")
                    sql_file.write(',\n'.join(values))
                    sql_file.write("\nON DUPLICATE KEY UPDATE\n")
                    sql_file.write("    name = VALUES(name),\n")
                    sql_file.write("    country = VALUES(country),\n")
                    sql_file.write("    lifetime_deposits = VALUES(lifetime_deposits),\n")
                    sql_file.write("    email = VALUES(email),\n")
                    sql_file.write("    gender = VALUES(gender),\n")
                    sql_file.write("    age = VALUES(age);\n\n")
                    values = []
                    print(f"  Generated {count} INSERT statements...", end='\r')
            
            # Write remaining values
            if values:
                sql_file.write("INSERT INTO clients (customer_id, name, country, join_date, account_type, account_number, lifetime_deposits, commission_plan, tracking_link_used, tier, sub_partner, partner_id, email, preferred_language, gender, age) VALUES\n")
                sql_file.write(',\n'.join(values))
                sql_file.write("\nON DUPLICATE KEY UPDATE\n")
                sql_file.write("    name = VALUES(name),\n")
                sql_file.write("    country = VALUES(country),\n")
                sql_file.write("    lifetime_deposits = VALUES(lifetime_deposits),\n")
                sql_file.write("    email = VALUES(email),\n")
                sql_file.write("    gender = VALUES(gender),\n")
                sql_file.write("    age = VALUES(age);\n\n")
            
            # Write footer
            sql_file.write("COMMIT;\n")
            sql_file.write("SET FOREIGN_KEY_CHECKS = 1;\n")
            sql_file.write("SET UNIQUE_CHECKS = 1;\n")
            sql_file.write("SET AUTOCOMMIT = 1;\n\n")
            sql_file.write(f"-- Total records: {count}\n")
            sql_file.write(f"-- Skipped records: {skipped}\n")
            
            print(f"\n✓ Generated {count} INSERT statements")
            if skipped > 0:
                print(f"  Skipped {skipped} rows (no customer ID)")
            print(f"✓ SQL file created: {output_file}")

if __name__ == "__main__":
    csv_file = '/Users/michalisphytides/Downloads/clients1.csv'
    output_file = '/Users/michalisphytides/Desktop/partner-report/clients_data.sql'
    
    print("=" * 60)
    print("Clients SQL Generator")
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
        import traceback
        traceback.print_exc()
        sys.exit(1)

