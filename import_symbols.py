#!/usr/bin/env python3
"""
Import symbols from CSV file into MySQL database
"""

import csv
import mysql.connector
from mysql.connector import Error
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

def import_symbols(csv_file_path):
    """Import symbols from CSV file"""
    connection = create_connection()
    cursor = connection.cursor()
    
    try:
        # Read CSV file
        print(f"\nReading CSV file: {csv_file_path}")
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            # Prepare insert statement
            insert_query = """
                INSERT INTO symbols (
                    platform, symbol, unified_symbol, unified_asset_type, 
                    unified_asset_sub_type, unified_category, 
                    platform_symbol_unified_symbol, duplicate_check, validation_check
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    unified_symbol = VALUES(unified_symbol),
                    unified_asset_type = VALUES(unified_asset_type),
                    unified_asset_sub_type = VALUES(unified_asset_sub_type),
                    unified_category = VALUES(unified_category),
                    platform_symbol_unified_symbol = VALUES(platform_symbol_unified_symbol),
                    duplicate_check = VALUES(duplicate_check),
                    validation_check = VALUES(validation_check)
            """
            
            # Import data
            count = 0
            batch = []
            batch_size = 100
            
            for row in csv_reader:
                # Extract data from CSV
                data = (
                    row['platform'],
                    row['symbol'],
                    row['unified_symbol'],
                    row['unified_asset_type'],
                    row['unified_asset_sub_type'],
                    row['unified_category'],
                    row['platform_symbol_unified_symbol'],
                    int(row['Duplicate check']) if row['Duplicate check'] else 0,
                    int(row['Validation check']) if row['Validation check'] else 0
                )
                
                batch.append(data)
                count += 1
                
                # Insert in batches for better performance
                if len(batch) >= batch_size:
                    cursor.executemany(insert_query, batch)
                    connection.commit()
                    print(f"  Imported {count} symbols...", end='\r')
                    batch = []
            
            # Insert remaining records
            if batch:
                cursor.executemany(insert_query, batch)
                connection.commit()
            
            print(f"\n✓ Successfully imported {count} symbols")
            
            # Get statistics
            cursor.execute("SELECT COUNT(*) FROM symbols")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT platform) FROM symbols")
            platforms = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT unified_asset_type) FROM symbols")
            asset_types = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT unified_category) FROM symbols")
            categories = cursor.fetchone()[0]
            
            print(f"\n📊 Database Statistics:")
            print(f"  Total symbols: {total}")
            print(f"  Unique platforms: {platforms}")
            print(f"  Unique asset types: {asset_types}")
            print(f"  Unique categories: {categories}")
            
            # Show platform breakdown
            print(f"\n📈 Symbols by Platform:")
            cursor.execute("""
                SELECT platform, COUNT(*) as count 
                FROM symbols 
                GROUP BY platform 
                ORDER BY count DESC
            """)
            for platform, count in cursor.fetchall():
                print(f"  {platform}: {count}")
            
            # Show category breakdown
            print(f"\n🏷️  Symbols by Category:")
            cursor.execute("""
                SELECT unified_category, COUNT(*) as count 
                FROM symbols 
                WHERE unified_category IS NOT NULL AND unified_category != ''
                GROUP BY unified_category 
                ORDER BY count DESC
            """)
            for category, count in cursor.fetchall():
                print(f"  {category}: {count}")
            
    except FileNotFoundError:
        print(f"✗ Error: File not found: {csv_file_path}")
        sys.exit(1)
    except Error as e:
        print(f"✗ Database error: {e}")
        connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            print("\n✓ Database connection closed")

if __name__ == "__main__":
    csv_file = '/Users/michalisphytides/Downloads/symbols.csv'
    
    print("=" * 60)
    print("Symbol Import Tool")
    print("=" * 60)
    
    import_symbols(csv_file)
    
    print("\n" + "=" * 60)
    print("Import completed successfully!")
    print("=" * 60)

