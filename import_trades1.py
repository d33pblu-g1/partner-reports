#!/usr/bin/env python3
"""
Import trades1.csv into MySQL trades table
"""

import csv
import mysql.connector
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='partner_report'
)

cursor = conn.cursor()

# Read CSV file
csv_file = '/Users/michalisphytides/Downloads/trades1.csv'
imported = 0
errors = 0

print(f"Starting import from {csv_file}...")

def clean_number(value):
    """Clean numeric values by removing commas and quotes"""
    if not value:
        return None
    value = str(value).strip().replace(',', '').replace('"', '')
    try:
        return float(value)
    except:
        return None

def parse_boolean(value):
    """Parse boolean values"""
    if not value:
        return False
    return str(value).strip().upper() in ('TRUE', '1', 'YES')

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        try:
            # Parse date
            date_str = row.get('date', '').strip()
            if date_str:
                try:
                    trade_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except:
                    try:
                        trade_date = datetime.strptime(date_str, '%m/%d/%Y').date()
                    except:
                        trade_date = None
            else:
                trade_date = None
            
            binary_user_id = row.get('binary_user_id', '').strip() or None
            loginid = row.get('loginid', '').strip() or None
            platform = row.get('platform', '').strip() or None
            app_name = row.get('app_name', '').strip() or None
            account_type = row.get('account_type', '').strip() or None
            contract_type = row.get('contract_type', '').strip() or None
            asset_type = row.get('asset_type', '').strip() or None
            asset = row.get('asset', '').strip() or None
            
            # Numeric fields
            number_of_trades = clean_number(row.get('number_of_trades', ''))
            closed_pnl_usd = clean_number(row.get('closed_pnl_usd', ''))
            closed_pnl_usd_abook = clean_number(row.get('closed_pnl_usd_abook', ''))
            closed_pnl_usd_bbook = clean_number(row.get('closed_pnl_usd_bbook', ''))
            floating_pnl_usd = clean_number(row.get('floating_pnl_usd', ''))
            floating_pnl = clean_number(row.get('floating_pnl', ''))
            expected_revenue_usd = clean_number(row.get('expected_revenue_usd', ''))
            closed_pnl = clean_number(row.get('closed_pnl', ''))
            swaps_usd = clean_number(row.get('swaps_usd', ''))
            volume_usd = clean_number(row.get('volume_usd', ''))
            app_markup_usd = clean_number(row.get('app_markup_usd', ''))
            
            # Boolean fields
            is_synthetic = parse_boolean(row.get('is_synthetic', ''))
            is_financial = parse_boolean(row.get('is_financial', ''))
            
            affiliated_partner_id = row.get('affiliated_partner_id', '').strip() or None
            
            # Skip if no binary_user_id
            if not binary_user_id:
                continue
            
            # Insert into database
            sql = """
                INSERT INTO trades (
                    date, binary_user_id, loginid, platform, app_name, account_type,
                    contract_type, asset_type, asset, number_of_trades, closed_pnl_usd,
                    closed_pnl_usd_abook, closed_pnl_usd_bbook, floating_pnl_usd, floating_pnl,
                    expected_revenue_usd, closed_pnl, swaps_usd, volume_usd, is_synthetic,
                    is_financial, app_markup_usd, affiliated_partner_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            cursor.execute(sql, (
                trade_date, binary_user_id, loginid, platform, app_name, account_type,
                contract_type, asset_type, asset, number_of_trades, closed_pnl_usd,
                closed_pnl_usd_abook, closed_pnl_usd_bbook, floating_pnl_usd, floating_pnl,
                expected_revenue_usd, closed_pnl, swaps_usd, volume_usd, is_synthetic,
                is_financial, app_markup_usd, affiliated_partner_id
            ))
            
            imported += 1
            if imported % 500 == 0:
                print(f"  Imported {imported} trades...")
                conn.commit()  # Commit in batches
            
        except Exception as e:
            errors += 1
            print(f"  Error importing trade on line {imported + errors}: {e}")

# Final commit
conn.commit()

print(f"\n✓ Import completed!")
print(f"  Total imported: {imported}")
print(f"  Total errors: {errors}")

# Verify
cursor.execute("SELECT COUNT(*) FROM trades")
count = cursor.fetchone()[0]
print(f"  Trades in database: {count}")

# Sample data check
cursor.execute("SELECT date, binary_user_id, platform, number_of_trades, closed_pnl_usd, volume_usd FROM trades LIMIT 3")
print(f"\n  Sample records:")
for row in cursor.fetchall():
    print(f"    {row}")

cursor.close()
conn.close()

