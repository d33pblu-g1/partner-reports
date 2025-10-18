#!/usr/bin/env python3
"""
Import deposits1.csv into the deposits table
"""

import csv
import mysql.connector
from datetime import datetime

# Database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="partner_report"
)

cursor = db.cursor()

csv_file = '/Users/michalisphytides/Downloads/deposits1.csv'

print("Starting CSV import...")

# Read and import CSV
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    
    print(f"CSV headers: {headers}")
    
    # Prepare INSERT statement
    columns = ', '.join(headers)
    placeholders = ', '.join(['%s'] * len(headers))
    insert_query = f"INSERT INTO deposits ({columns}) VALUES ({placeholders})"
    
    batch = []
    batch_size = 1000
    total_imported = 0
    errors = 0
    
    for row_num, row in enumerate(reader, start=2):
        try:
            # Convert empty strings to None
            values = []
            for header in headers:
                value = row[header]
                
                # Handle empty values
                if value == '' or value == 'NULL':
                    values.append(None)
                # Handle boolean-like values
                elif value in ('TRUE', 'FALSE'):
                    values.append(value)
                # Handle datetime
                elif header == 'transaction_time' and value:
                    # Parse: 2025-07-01 03:33:11.481401 UTC
                    try:
                        dt_str = value.replace(' UTC', '')
                        # MySQL doesn't need microseconds precision beyond 6 digits
                        values.append(dt_str)
                    except:
                        values.append(None)
                else:
                    values.append(value)
            
            batch.append(tuple(values))
            
            # Execute batch insert
            if len(batch) >= batch_size:
                cursor.executemany(insert_query, batch)
                db.commit()
                total_imported += len(batch)
                print(f"Imported {total_imported} rows...")
                batch = []
                
        except Exception as e:
            errors += 1
            print(f"Error on row {row_num}: {e}")
            print(f"Row data: {row}")
            if errors > 10:
                print("Too many errors, stopping...")
                break
    
    # Insert remaining batch
    if batch:
        try:
            cursor.executemany(insert_query, batch)
            db.commit()
            total_imported += len(batch)
        except Exception as e:
            print(f"Error inserting final batch: {e}")

print(f"\n✓ Import complete!")
print(f"Total rows imported: {total_imported}")
print(f"Errors encountered: {errors}")

# Show summary
cursor.execute("SELECT COUNT(*) FROM deposits")
count = cursor.fetchone()[0]
print(f"Total rows in deposits table: {count}")

# Show sample data
cursor.execute("SELECT * FROM deposits LIMIT 5")
print("\nSample data:")
for row in cursor.fetchall():
    print(row)

cursor.close()
db.close()

