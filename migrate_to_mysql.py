#!/usr/bin/env python3
"""
Migration script to convert JSON database to MySQL
"""

import json
import mysql.connector
from mysql.connector import Error
import sys
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'partner_report',
    'user': 'root',
    'password': '',  # Update with your MySQL password
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

def connect_to_mysql():
    """Create connection to MySQL database"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("Successfully connected to MySQL database")
            return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        sys.exit(1)

def load_json_data():
    """Load data from JSON file"""
    try:
        with open('database.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Successfully loaded JSON data")
        return data
    except FileNotFoundError:
        print("Error: database.json file not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)

def migrate_partners(connection, data):
    """Migrate partners data"""
    cursor = connection.cursor()
    
    partners = data.get('partners', [])
    print(f"Migrating {len(partners)} partners...")
    
    for partner in partners:
        try:
            query = """
            INSERT INTO partners (partner_id, name, tier)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            tier = VALUES(tier)
            """
            cursor.execute(query, (
                partner.get('partnerId'),
                partner.get('name'),
                partner.get('tier')
            ))
        except Error as e:
            print(f"Error inserting partner {partner.get('partnerId')}: {e}")
    
    connection.commit()
    print(f"Successfully migrated {len(partners)} partners")

def migrate_partner_tiers(connection, data):
    """Migrate partner tiers data"""
    cursor = connection.cursor()
    
    partner_tiers = data.get('partnerTiers', [])
    print(f"Migrating {len(partner_tiers)} partner tiers...")
    
    for tier in partner_tiers:
        try:
            query = """
            INSERT INTO partner_tiers (tier, range_description, reward)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
            range_description = VALUES(range_description),
            reward = VALUES(reward)
            """
            cursor.execute(query, (
                tier.get('tier'),
                tier.get('range'),
                tier.get('reward')
            ))
        except Error as e:
            print(f"Error inserting tier {tier.get('tier')}: {e}")
    
    connection.commit()
    print(f"Successfully migrated {len(partner_tiers)} partner tiers")

def migrate_clients(connection, data):
    """Migrate clients data"""
    cursor = connection.cursor()
    
    clients = data.get('clients', [])
    print(f"Migrating {len(clients)} clients...")
    
    for client in clients:
        try:
            # Parse join date
            join_date = None
            if client.get('joinDate'):
                try:
                    join_date = datetime.strptime(client.get('joinDate'), '%Y-%m-%d').date()
                except ValueError:
                    print(f"Invalid join date for client {client.get('customerId')}: {client.get('joinDate')}")
            
            query = """
            INSERT INTO clients (
                customer_id, name, join_date, account_type, account_number,
                country, lifetime_deposits, commission_plan, tracking_link_used,
                tier, sub_partner, partner_id, email, preferred_language,
                gender, age
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            join_date = VALUES(join_date),
            account_type = VALUES(account_type),
            account_number = VALUES(account_number),
            country = VALUES(country),
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
            cursor.execute(query, (
                client.get('customerId'),
                client.get('name'),
                join_date,
                client.get('accountType'),
                client.get('accountNumber'),
                client.get('country'),
                client.get('lifetimeDeposits', 0.0),
                client.get('commissionPlan'),
                client.get('trackingLinkUsed'),
                client.get('tier'),
                client.get('sub-partner', False),
                client.get('partnerId'),
                client.get('email'),
                client.get('preferredLanguage'),
                client.get('gender'),
                client.get('age')
            ))
        except Error as e:
            print(f"Error inserting client {client.get('customerId')}: {e}")
    
    connection.commit()
    print(f"Successfully migrated {len(clients)} clients")

def migrate_trades(connection, data):
    """Migrate trades data"""
    cursor = connection.cursor()
    
    trades = data.get('trades', [])
    print(f"Migrating {len(trades)} trades...")
    
    for trade in trades:
        try:
            # Parse date time
            date_time = None
            if trade.get('dateTime'):
                try:
                    date_time = datetime.strptime(trade.get('dateTime'), '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    try:
                        date_time = datetime.strptime(trade.get('dateTime'), '%Y-%m-%d')
                    except ValueError:
                        print(f"Invalid date for trade: {trade.get('dateTime')}")
            
            query = """
            INSERT INTO trades (customer_id, date_time, commission, volume)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (
                trade.get('customerId'),
                date_time,
                trade.get('commission', 0.0),
                trade.get('volume', 0.0)
            ))
        except Error as e:
            print(f"Error inserting trade: {e}")
    
    connection.commit()
    print(f"Successfully migrated {len(trades)} trades")

def migrate_deposits(connection, data):
    """Migrate deposits data"""
    cursor = connection.cursor()
    
    deposits = data.get('deposits', [])
    print(f"Migrating {len(deposits)} deposits...")
    
    for deposit in deposits:
        try:
            # Parse date time
            date_time = None
            if deposit.get('dateTime'):
                try:
                    date_time = datetime.strptime(deposit.get('dateTime'), '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    try:
                        date_time = datetime.strptime(deposit.get('dateTime'), '%Y-%m-%d')
                    except ValueError:
                        print(f"Invalid date for deposit: {deposit.get('dateTime')}")
            
            query = """
            INSERT INTO deposits (customer_id, date_time, value)
            VALUES (%s, %s, %s)
            """
            cursor.execute(query, (
                deposit.get('customerId'),
                date_time,
                deposit.get('value', 0.0)
            ))
        except Error as e:
            print(f"Error inserting deposit: {e}")
    
    connection.commit()
    print(f"Successfully migrated {len(deposits)} deposits")

def main():
    """Main migration function"""
    print("Starting JSON to MySQL migration...")
    
    # Connect to MySQL
    connection = connect_to_mysql()
    
    # Load JSON data
    data = load_json_data()
    
    try:
        # Migrate data in order (respecting foreign key constraints)
        migrate_partners(connection, data)
        migrate_partner_tiers(connection, data)
        migrate_clients(connection, data)
        migrate_trades(connection, data)
        migrate_deposits(connection, data)
        
        # Award badges to partners
        print("\nAwarding badges to partners...")
        try:
            cursor = connection.cursor()
            cursor.execute("CALL award_badges()")
            connection.commit()
            print("Badges awarded successfully!")
        except Error as e:
            print(f"Note: Could not award badges (may need to run badges_table.sql first): {e}")
        
        print("\nMigration completed successfully!")
        
        # Show summary
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM partners")
        partners_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM clients")
        clients_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM trades")
        trades_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM deposits")
        deposits_count = cursor.fetchone()[0]
        
        # Try to get badge count
        try:
            cursor.execute("SELECT COUNT(*) FROM partner_badges")
            badges_count = cursor.fetchone()[0]
        except:
            badges_count = 'N/A'
        
        print(f"\nDatabase Summary:")
        print(f"- Partners: {partners_count}")
        print(f"- Clients: {clients_count}")
        print(f"- Trades: {trades_count}")
        print(f"- Deposits: {deposits_count}")
        print(f"- Badges Awarded: {badges_count}")
        
    except Error as e:
        print(f"Migration failed: {e}")
        connection.rollback()
    finally:
        if connection.is_connected():
            connection.close()
            print("MySQL connection closed")

if __name__ == "__main__":
    main()
