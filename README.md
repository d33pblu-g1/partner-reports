# Partner Report Dashboard

A comprehensive partner analytics dashboard with 9 pages of business intelligence and reporting.

## Features

- **9 Interactive Pages**: Home, Clients, Commissions, Master Partner, Events, Tiers & Badges, Client Funnel, Country Analysis, and Sitemap
- **Sidebar Navigation**: Clean left sidebar with icons and active page highlighting
- **Partner Filtering**: Dropdown to filter data by partner across all pages
- **Real-time Metrics**: Dynamic calculations based on database data
- **Data Visualization**: Charts, progress bars, and visual analytics
- **Responsive Design**: Works on desktop and mobile devices

## Pages Overview

1. **Home**: Partner metrics, lifetime/MTD KPIs, 6-month commission chart
2. **Clients**: Masked client list with tier distribution pie chart
3. **Commissions**: Commission analytics and breakdowns
4. **Master Partner**: Partner profile and rollup metrics
5. **Events**: Event timeline and historical data
6. **Tiers & Badges**: Tier progress bars with commission targets
7. **Client Funnel**: Acquisition to conversion analytics
8. **Country Analysis**: Regional performance with top country metrics
9. **Sitemap**: Navigation overview and database viewer link

## Database

JSON-based database with 6 tables:
- **Clients**: 100+ customers with masked names, tiers, countries, languages
- **Trades**: 100+ trading records with platforms, assets, commissions
- **Deposits**: 200+ deposit transactions
- **Countries**: 92 countries with client counts and metrics
- **Partners**: Partner information and tiers
- **Platform Contract Types**: Platform-to-contract-type mappings

## Quick Start

1. **Start local server**:
   ```bash
   ./serve.sh 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000/index.html
   ```

3. **View database**:
   ```
   http://localhost:8000/database.html
   ```

## File Structure

```
partner-report/
├── index.html              # Home dashboard
├── clients.html            # Client management
├── commissions.html        # Commission analytics
├── master-partner.html     # Partner profiles
├── events.html             # Event tracking
├── tiers-badges.html       # Tier progress
├── client-funnel.html      # Conversion funnel
├── country-analysis.html   # Regional analytics
├── sitemap.html            # Navigation overview
├── database.html           # Database viewer
├── styles.css              # Shared styles
├── script.js               # Interactive functionality
├── database.json           # JSON database
├── seed.py                 # Data generator
├── serve.sh                # Local server script
└── README.md               # This file
```

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Charts**: SVG-based custom visualizations
- **Data**: JSON database with realistic sample data
- **Server**: Python HTTP server for local development

## Features in Detail

### Partner Filtering
- Dropdown on all pages populated from database
- Real-time data filtering and metric updates
- Selection persistence across page navigation

### Data Visualization
- **Home**: 6-month commission bar chart
- **Clients**: Tier distribution pie chart
- **Tiers**: Progress bars showing commission targets
- **Country Analysis**: Top country metrics

### Responsive Design
- Mobile-friendly sidebar (collapses to icons)
- Grid layouts that adapt to screen size
- Touch-friendly interface elements

## Development

### Adding New Data
```bash
python3 seed.py  # Regenerate sample data
```

### Customizing Styles
Edit `styles.css` for theme modifications.

### Adding Pages
1. Create HTML file with sidebar structure
2. Add navigation link to all pages
3. Implement page-specific JavaScript in `script.js`

## License

MIT License - feel free to use and modify for your needs.
