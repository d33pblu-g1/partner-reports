#!/usr/bin/env python3
"""
Population Pyramid Generator for Partner Report
Creates a population pyramid visualization from clients table
"""

import mysql.connector
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from collections import defaultdict

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'partner_report'
}

def get_client_data(partner_id=None):
    """Fetch client age and gender data from database"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    if partner_id:
        query = """
            SELECT age, gender 
            FROM clients 
            WHERE partnerId = %s AND age IS NOT NULL AND gender IS NOT NULL
        """
        cursor.execute(query, (partner_id,))
    else:
        query = """
            SELECT age, gender 
            FROM clients 
            WHERE age IS NOT NULL AND gender IS NOT NULL
        """
        cursor.execute(query)
    
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return pd.DataFrame(data)

def create_age_bins(df):
    """Create age group bins"""
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
    age_groups = grouped.index.tolist()
    male_counts = grouped['Male'].values
    female_counts = grouped['Female'].values
    
    # Make male counts negative for left side
    male_counts_negative = -male_counts
    
    # Create figure
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Plot bars
    y_pos = np.arange(len(age_groups))
    bar_height = 0.8
    
    # Male bars (left side, negative values)
    ax.barh(y_pos, male_counts_negative, bar_height, 
            label='Male', color='#38bdf8', alpha=0.8, edgecolor='#0284c7')
    
    # Female bars (right side, positive values)
    ax.barh(y_pos, female_counts, bar_height, 
            label='Female', color='#ec4899', alpha=0.8, edgecolor='#db2777')
    
    # Customize axes
    ax.set_yticks(y_pos)
    ax.set_yticklabels(age_groups)
    ax.set_ylabel('Age Group', fontsize=13, fontweight='bold')
    ax.set_xlabel('Number of Clients', fontsize=13, fontweight='bold')
    
    # Set title
    title = 'Client Population Pyramid'
    if partner_id:
        title += f' - Partner {partner_id}'
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
    
    # Fix x-axis labels to show positive numbers on both sides
    max_abs_value = max(male_counts.max(), female_counts.max())
    x_ticks = np.linspace(-max_abs_value, max_abs_value, 11)
    ax.set_xticks(x_ticks)
    ax.set_xticklabels([f'{int(abs(x))}' for x in x_ticks])
    
    # Add vertical line at center
    ax.axvline(x=0, color='#475569', linestyle='--', linewidth=1.5, alpha=0.7)
    
    # Add legend
    ax.legend(loc='upper right', fontsize=12, framealpha=0.9)
    
    # Add grid
    ax.grid(axis='x', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Add data labels on bars
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
    
    # Tight layout
    plt.tight_layout()
    
    # Save figure
    plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"✓ Population pyramid saved to {output_file}")
    
    # Also display if running interactively
    # plt.show()
    
    plt.close()
    
    return {
        'total_clients': total_clients,
        'male_count': total_male,
        'female_count': total_female,
        'age_groups': age_groups,
        'male_by_age': male_counts.tolist(),
        'female_by_age': female_counts.tolist()
    }

def main():
    """Main execution"""
    import sys
    
    # Get partner ID from command line if provided
    partner_id = sys.argv[1] if len(sys.argv) > 1 else None
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'population_pyramid.png'
    
    print(f"Fetching client data{f' for partner {partner_id}' if partner_id else ' for all partners'}...")
    
    try:
        # Fetch data
        df = get_client_data(partner_id)
        
        if df.empty:
            print("⚠️  No client data found with age and gender information")
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
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return

if __name__ == "__main__":
    main()

