#!/usr/bin/env python3
"""
Generate Population Pyramid Chart for Partner Report
Replaces the Population Distribution graph on the clients page
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
import sys
import json

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'partner_report',
    'user': 'root',
    'password': ''  # Assuming no password for local root
}

def get_db_connection():
    """Establishes and returns a database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def fetch_client_data(partner_id=None):
    """Fetches client data from the database."""
    conn = get_db_connection()
    if conn is None:
        return pd.DataFrame()

    query = "SELECT age, gender FROM clients WHERE age IS NOT NULL AND gender IS NOT NULL"
    params = []
    if partner_id:
        query += " AND partnerId = %s"
        params.append(partner_id)

    try:
        df = pd.read_sql(query, conn, params=params)
        return df
    except Error as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()
    finally:
        if conn.is_connected():
            conn.close()

def create_age_bins(df):
    """Creates age bins for the DataFrame."""
    bins = [0, 18, 25, 35, 45, 55, 65, 100]
    labels = ['Under 18', '18-25', '25-35', '35-45', '45-55', '55-65', '65+']
    df['age_group'] = pd.cut(df['age'], bins=bins, labels=labels, right=False)
    return df

def create_population_pyramid(df, partner_id=None, output_file='population_pyramid.png'):
    """Create population pyramid visualization"""
    
    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.figsize'] = (12, 8)
    plt.rcParams['font.size'] = 11
    
    # Normalize gender values to title case
    df['gender'] = df['gender'].str.title()
    
    # Create age bins
    df = create_age_bins(df)
    
    # Group by age_group and gender
    grouped = df.groupby(['age_group', 'gender'], observed=True).size().unstack(fill_value=0)
    
    # Ensure we have both male and female columns
    if 'Male' not in grouped.columns:
        grouped['Male'] = 0
    if 'Female' not in grouped.columns:
        grouped['Female'] = 0
    
    # Sort by age group index
    age_order = ['Under 18', '18-25', '25-35', '35-45', '45-55', '55-65', '65+']
    grouped = grouped.reindex([ag for ag in age_order if ag in grouped.index])
    
    # Prepare data for plotting
    male_counts = grouped['Male']
    female_counts = grouped['Female']
    age_groups = grouped.index
    
    # Create the plot
    fig, ax = plt.subplots()
    
    # Plot males (negative values for left side)
    ax.barh(age_groups, -male_counts, color='#38bdf8', label='Male')
    # Plot females (positive values for right side)
    ax.barh(age_groups, female_counts, color='#f59e0b', label='Female')
    
    # Customize plot
    ax.set_title(f'Client Population Pyramid' + (f' for Partner {partner_id}' if partner_id else ''), fontsize=16, color='#e2e8f0')
    ax.set_xlabel('Number of Clients', fontsize=12, color='#e2e8f0')
    ax.set_ylabel('Age Group', fontsize=12, color='#e2e8f0')
    
    # Format x-axis labels to be positive
    ticks = ax.get_xticks()
    ax.set_xticklabels([f'{abs(int(tick)):,}' for tick in ticks])
    
    # Add legend
    ax.legend(fontsize=10, frameon=True, facecolor='#1e293b', edgecolor='#475569', labelcolor='#e2e7eb')
    
    # Set background and grid
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')
    ax.tick_params(axis='x', colors='#94a3b8')
    ax.tick_params(axis='y', colors='#94a3b8')
    ax.spines['left'].set_color('#475569')
    ax.spines['right'].set_color('#475569')
    ax.spines['top'].set_color('#475569')
    ax.spines['bottom'].set_color('#475569')
    ax.grid(axis='x', linestyle='--', alpha=0.05, color='#475569')
    ax.grid(axis='y', linestyle='--', alpha=0.05, color='#475569')
    
    # Add data labels to bars
    for i, (male, female) in enumerate(zip(male_counts, female_counts)):
        # Male label (left side)
        if male > 0:
            ax.text(-male/2, i, str(int(male)), 
                   ha='center', va='center', color='white', fontweight='bold', fontsize=10)
        # Female label (right side)
        if female > 0:
            ax.text(female/2, i, str(int(female)), 
                   ha='center', va='center', color='white', fontweight='bold', fontsize=10)
    
    # Add summary statistics
    total_male = int(male_counts.sum())
    total_female = int(female_counts.sum())
    total_clients = total_male + total_female
    
    if total_clients > 0:
        male_pct = total_male/total_clients*100
        female_pct = total_female/total_clients*100
        stats_text = f'Total Clients: {total_clients:,}\nMale: {total_male:,} ({male_pct:.1f}%)\nFemale: {total_female:,} ({female_pct:.1f}%)'
    else:
        stats_text = 'No client data available'
    ax.text(0.02, 0.98, stats_text, 
           transform=ax.transAxes, fontsize=11,
           verticalalignment='top',
           bbox=dict(boxstyle='round', facecolor='white', alpha=0.8, edgecolor='#475569'))
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig) # Close the figure to free memory
    
    return {
        'total_clients': total_clients,
        'male_count': total_male,
        'female_count': total_female,
        'age_groups': age_groups.tolist(),
        'male_by_age': male_counts.tolist(),
        'female_by_age': female_counts.tolist()
    }

def main():
    partner_id = os.getenv('PARTNER_ID')
    output_file = os.getenv('OUTPUT_FILE', 'population_pyramid.png')
    
    if len(sys.argv) > 1:
        partner_id = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    print(f"Fetching client data for partner {partner_id if partner_id else 'All Partners'}...")
    try:
        df = fetch_client_data(partner_id)
        if df.empty:
            print("❌ No client data found for the specified partner or in the database.")
            return
        
        print(f"✓ Found {len(df)} clients with age and gender data")
        
        # Create pyramid
        stats = create_population_pyramid(df, partner_id, output_file)
        
        # Print summary
        print("\n" + "="*50)
        print("POPULATION PYRAMID SUMMARY")
        print("="*50)
        print(f"Total Clients: {stats['total_clients']:,}")
        if stats['total_clients'] > 0:
            print(f"Male: {stats['male_count']:,} ({stats['male_count']/stats['total_clients']*100:.1f}%)")
            print(f"Female: {stats['female_count']:,} ({stats['female_count']/stats['total_clients']*100:.1f}%)")
            print("\nAge Distribution:")
            for age_group, male, female in zip(stats['age_groups'], stats['male_by_age'], stats['female_by_age']):
                print(f"  {age_group:12} | Male: {male:4d} | Female: {female:4d} | Total: {male+female:4d}")
        else:
            print("No client data available")
        print("="*50)
        
        print(f"✓ Population pyramid saved to {output_file}")
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return

if __name__ == "__main__":
    main()
