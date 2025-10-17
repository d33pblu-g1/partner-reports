#!/usr/bin/env python3
import json
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / 'database.json'

random.seed(42)

first_names = [
    'Alice','Bob','Carlos','Diana','Ethan','Fiona','George','Hana','Ivan','Julia',
    'Kai','Lina','Marco','Nora','Omar','Priya','Quinn','Ravi','Sara','Tomas',
    'Uma','Viktor','Wen','Ximena','Yara','Zane'
]
last_names = ['Bennett','Mendes','Nair','Singh','Khan','Costa','Ibrahim','Zhang','Kumar','Garcia','Silva','Lopez','Rossi','Novak','Smirnov']
countries = [
    'United Kingdom','Portugal','India','Germany','France','Spain','Italy','Poland','Greece','Cyprus',
    'Romania','Netherlands','Belgium','Ireland','Sweden','Norway','Finland','Denmark','Switzerland','Austria'
]
account_types = ['Standard','VIP']
commission_plans = ['RevShare 30%','CPA','Hybrid']
tiers = ['Bronze','Silver','Gold','Platinum']
platforms = ['WebTrader','Mobile','MT5','cTrader','DerivX','dTrader']
contract_types = ['CFD','Options','Futures','Accumulators','Vanillas','Turbos','Multipliers']

def rand_name():
    return random.choice(first_names) + ' ' + random.choice(last_names)

def rand_account_number():
    return 'ACC-' + ''.join(random.choices(string.digits, k=6))

def rand_tracking():
    roots = ['spring','summer','fall','affiliate','social','display','email']
    return random.choice(roots) + '-' + str(random.randint(100,999))

def rand_date(start_year=2022):
    start = datetime(start_year, 1, 1)
    days = (datetime(2025, 10, 1) - start).days
    return (start + timedelta(days=random.randint(0, days))).date().isoformat()

def rand_datetime():
    start = datetime(2025, 1, 1)
    seconds = int((datetime(2025, 10, 10) - start).total_seconds())
    return (start + timedelta(seconds=random.randint(0, seconds))).isoformat() + 'Z'

def generate_clients(n=100, partner_ids=None):
    clients = []
    for i in range(n):
        customer_id = f"C-{100000 + i}"
        partner_id = random.choice(partner_ids) if partner_ids else None
        clients.append({
            "customerId": customer_id,
            "name": rand_name(),
            "joinDate": rand_date(),
            "accountType": random.choice(account_types),
            "accountNumber": rand_account_number(),
            "country": random.choice(countries),
            "lifetimeDeposits": round(random.uniform(100, 100000), 2),
            "commissionPlan": random.choice(commission_plans),
            "trackingLinkUsed": rand_tracking(),
            "tier": random.choice(tiers),
            "sub-partner": random.choice([True, False]),
            "partnerId": partner_id,
            "email": rand_name().lower().replace(' ', '.') + '@example.com',
            "preferredLanguage": random.choice(['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Swedish', 'Norwegian', 'Danish'])
        })
    return clients

def generate_trades(clients, n=100):
    trades = []
    for _ in range(n):
        c = random.choice(clients)
        platform = random.choice(platforms)
        if platform in ['MT5','cTrader','DerivX']:
            ctype = 'CFD'
        elif platform == 'dTrader':
            ctype = random.choice(['Accumulators','Vanillas','Turbos','Multipliers'])
        else:
            ctype = random.choice(['CFD','Options','Futures'])
        trades.append({
            "customerId": c["customerId"],
            "dateTime": rand_datetime(),
            "platform": platform,
            "contractType": ctype,
            "asset": random.choice(['EUR/USD','AAPL','BTC-USD','XAUUSD','ETH-USD','TSLA']),
            "commission": round(random.uniform(1, 150), 2)
        })
    return trades

def generate_deposits(clients, n=200):
    deposits = []
    for _ in range(n):
        c = random.choice(clients)
        deposits.append({
            "customerId": c["customerId"],
            "dateTime": rand_datetime(),
            "value": round(random.uniform(10, 5000), 2)
        })
    return deposits

def main():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        db = json.load(f)

    partner_ids = [p.get('partnerId') for p in db.get('partners', []) if p.get('partnerId')]
    if not partner_ids:
        # Ensure at least one partner exists
        partner_ids = ['P-0001']
    db['clients'] = generate_clients(100, partner_ids)
    db['trades'] = generate_trades(db['clients'], 100)
    db['deposits'] = generate_deposits(db['clients'], 200)

    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    print('Seeded 100 clients and 100 trades into database.json')

if __name__ == '__main__':
    main()


