#!/usr/bin/env python3
"""
Import clients2.csv into MySQL clients table
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
csv_file = '/Users/michalisphytides/Downloads/clients2.csv'
imported = 0
errors = 0

print(f"Starting import from {csv_file}...")

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        try:
            # Clean and prepare data
            binary_user_id = row.get('binary_user_id', '').strip()
            name = row.get('name', '').strip()
            email = row.get('email', '').strip() or None
            country = row.get('country', '').strip() or None
            
            # Parse date
            joinDate = row.get('joinDate', '').strip()
            if joinDate:
                try:
                    joinDate = datetime.strptime(joinDate, '%Y-%m-%d').date()
                except:
                    joinDate = None
            else:
                joinDate = None
            
            partnerId = row.get('partnerId', '').strip() or None
            tier = row.get('tier', '').strip() or None
            gender = row.get('gender', '').strip() or None
            
            # Age
            age_str = row.get('age', '').strip()
            age = int(age_str) if age_str and age_str.isdigit() else None
            
            account_type = row.get('account_type', '').strip() or None
            accountNumber = row.get('accountNumber\t', '').strip() or row.get('accountNumber', '').strip() or None
            
            # Boolean
            sub_partner_str = row.get('sub-partner\t', '').strip() or row.get('sub-partner', '').strip() or 'FALSE'
            sub_partner = 1 if sub_partner_str.upper() == 'TRUE' else 0
            
            preferredLanguage = row.get('preferredLanguage\t', '').strip() or row.get('preferredLanguage', '').strip() or None
            commissionPlan = row.get('commissionPlan', '').strip() or None
            trackingLinkUsed = row.get('trackingLinkUsed', '').strip() or None
            
            # Numeric fields
            total_trades_str = row.get('total_trades', '').strip()
            total_trades = int(total_trades_str) if total_trades_str and total_trades_str.isdigit() else None
            
            lifetimeDeposits_str = row.get('lifetimeDeposits\t', '').strip() or row.get('lifetimeDeposits', '').strip()
            try:
                lifetimeDeposits = float(lifetimeDeposits_str) if lifetimeDeposits_str else None
            except:
                lifetimeDeposits = None
            
            PNL_str = row.get('PNL', '').strip()
            try:
                PNL = float(PNL_str) if PNL_str else None
            except:
                PNL = None
            
            # Skip if no binary_user_id
            if not binary_user_id:
                continue
            
            # Insert into database
            sql = """
                INSERT INTO clients (
                    binary_user_id, name, email, country, joinDate, partnerId,
                    tier, gender, age, account_type, accountNumber, sub_partner,
                    preferredLanguage, commissionPlan, trackingLinkUsed,
                    total_trades, lifetimeDeposits, PNL
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(sql, (
                binary_user_id, name, email, country, joinDate, partnerId,
                tier, gender, age, account_type, accountNumber, sub_partner,
                preferredLanguage, commissionPlan, trackingLinkUsed,
                total_trades, lifetimeDeposits, PNL
            ))
            
            imported += 1
            if imported % 50 == 0:
                print(f"  Imported {imported} clients...")
            
        except Exception as e:
            errors += 1
            print(f"  Error importing client {row.get('binary_user_id', 'unknown')}: {e}")

# Commit changes
conn.commit()

print(f"\n✓ Import completed!")
print(f"  Total imported: {imported}")
print(f"  Total errors: {errors}")

# Verify
cursor.execute("SELECT COUNT(*) FROM clients")
count = cursor.fetchone()[0]
print(f"  Clients in database: {count}")

cursor.close()
conn.close()

