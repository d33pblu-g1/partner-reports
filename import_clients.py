#!/usr/bin/env python3
"""
Import clients from CSV file into MySQL database
"""

import csv
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import sys

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'partner_report',
    'user': 'root',
    'password': ''  # Update if you have a password
}

def create_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("✓ Connected to MySQL database")
            return connection
    except Error as e:
        print(f"✗ Error connecting to MySQL: {e}")
        sys.exit(1)

def parse_date(date_str):
    """Parse date from CSV format"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except:
        return None

def parse_boolean(bool_str):
    """Parse boolean from CSV"""
    if not bool_str or bool_str.strip() == '':
        return False
    return bool_str.strip().upper() == 'TRUE'

def parse_decimal(dec_str):
    """Parse decimal from CSV"""
    if not dec_str or dec_str.strip() == '':
        return 0.0
    try:
        return float(dec_str)
    except:
        return 0.0

def parse_int(int_str):
    """Parse integer from CSV"""
    if not int_str or int_str.strip() == '':
        return None
    try:
        return int(float(int_str))
    except:
        return None

def import_clients(csv_file_path):
    """Import clients from CSV file"""
    connection = create_connection()
    cursor = connection.cursor()
    
    try:
        # Read CSV file
        print(f"\nReading CSV file: {csv_file_path}")
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            # Prepare insert statement (with ON DUPLICATE KEY UPDATE)
            insert_query = """
                INSERT INTO clients (
                    customer_id, name, country, join_date, account_type, 
                    account_number, lifetime_deposits, commission_plan, 
                    tracking_link_used, tier, sub_partner, partner_id, 
                    email, preferred_language, gender, age
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    country = VALUES(country),
                    join_date = VALUES(join_date),
                    account_type = VALUES(account_type),
                    account_number = VALUES(account_number),
                    lifetime_deposits = VALUES(lifetime_deposits),
                    commission_plan = VALUES(commission_plan),
                    tracking_link_used = VALUES(tracking_link_used),
                    tier = VALUES(tier),
                    sub_partner = VALUES(sub_partner),
                    partner_id = VALUES(partner_id),
                    email = VALUES(email),
                    preferred_language = VALUES(preferred_language),
                    gender = VALUES(gender),
                    age = VALUES(age)
            """
            
            # Import data
            count = 0
            skipped = 0
            updated = 0
            batch = []
            batch_size = 100
            
            for row in csv_reader:
                # Skip rows without customer ID
                if not row.get('binary_user_id'):
                    skipped += 1
                    continue
                
                # Extract and transform data
                customer_id = str(row['binary_user_id']).strip()
                name = row.get('name', '').strip()
                country = row.get('country', '').strip()
                join_date = parse_date(row.get('joinDate', ''))
                account_type = row.get('account_type', '').strip()
                account_number = row.get('accountNumber', '').strip()
                lifetime_deposits = parse_decimal(row.get('lifetimeDeposits', '0'))
                commission_plan = row.get('commissionPlan', '').strip()
                tracking_link_used = row.get('trackingLinkUsed', '').strip()
                tier = row.get('tier', '').strip()
                sub_partner = parse_boolean(row.get('sub-partner', 'FALSE'))
                partner_id = row.get('partnerId', '').strip() or None
                email = row.get('email', '').strip()
                preferred_language = row.get('preferredLanguage', '').strip()
                gender = row.get('gender', '').strip()
                age = parse_int(row.get('age', ''))
                
                # Prepare data tuple
                data = (
                    customer_id,
                    name,
                    country,
                    join_date,
                    account_type,
                    account_number,
                    lifetime_deposits,
                    commission_plan,
                    tracking_link_used,
                    tier,
                    sub_partner,
                    partner_id,
                    email,
                    preferred_language,
                    gender,
                    age
                )
                
                batch.append(data)
                count += 1
                
                # Insert in batches for better performance
                if len(batch) >= batch_size:
                    cursor.executemany(insert_query, batch)
                    connection.commit()
                    print(f"  Imported {count} clients...", end='\r')
                    batch = []
            
            # Insert remaining records
            if batch:
                cursor.executemany(insert_query, batch)
                connection.commit()
            
            print(f"\n✓ Successfully imported {count} clients")
            if skipped > 0:
                print(f"  Skipped {skipped} rows (no customer ID)")
            
            # Get statistics
            cursor.execute("SELECT COUNT(*) FROM clients")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT country) FROM clients")
            countries = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT partner_id) FROM clients WHERE partner_id IS NOT NULL")
            partners = cursor.fetchone()[0]
            
            cursor.execute("SELECT SUM(lifetime_deposits) FROM clients")
            total_deposits = cursor.fetchone()[0] or 0
            
            print(f"\n📊 Database Statistics:")
            print(f"  Total clients: {total}")
            print(f"  Unique countries: {countries}")
            print(f"  Unique partners: {partners}")
            print(f"  Total lifetime deposits: ${total_deposits:,.2f}")
            
            # Show top countries
            print(f"\n🌍 Top 5 Countries by Clients:")
            cursor.execute("""
                SELECT country, COUNT(*) as count 
                FROM clients 
                GROUP BY country 
                ORDER BY count DESC 
                LIMIT 5
            """)
            for country, count in cursor.fetchall():
                print(f"  {country}: {count}")
            
            # Show gender distribution
            print(f"\n👥 Gender Distribution:")
            cursor.execute("""
                SELECT gender, COUNT(*) as count 
                FROM clients 
                WHERE gender IS NOT NULL AND gender != ''
                GROUP BY gender 
                ORDER BY count DESC
            """)
            for gender, count in cursor.fetchall():
                print(f"  {gender}: {count}")
            
    except FileNotFoundError:
        print(f"✗ Error: File not found: {csv_file_path}")
        sys.exit(1)
    except Error as e:
        print(f"✗ Database error: {e}")
        connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            print("\n✓ Database connection closed")

if __name__ == "__main__":
    csv_file = '/Users/michalisphytides/Downloads/clients1.csv'
    
    print("=" * 60)
    print("Client Import Tool")
    print("=" * 60)
    
    import_clients(csv_file)
    
    print("\n" + "=" * 60)
    print("Import completed successfully!")
    print("=" * 60)

