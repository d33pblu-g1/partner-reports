# Badges Gallery Feature

## Overview
The Badges Gallery displays partner achievements in a visual, interactive format on the Tiers & Badges page. It shows which badges have been earned (strong colors) and which are pending (faded colors).

## Features

### Visual Design
- **Earned Badges**: Displayed with strong, vibrant colors and a checkmark
- **Pending Badges**: Shown in faded/transparent state with progress bars
- **Color Coding**:
  - Commission badges: Shades of blue/cyan (🏆)
  - Deposit badges: Shades of green (💎)
  - Colors get darker as badge value increases

### Badge Information
Each badge card shows:
- Badge icon (trophy for commissions, diamond for deposits)
- Badge name (e.g., COM1K, DEP10K)
- Trigger amount (e.g., $1,000)
- For earned badges:
  - Checkmark indicator
  - "Earned!" status
- For pending badges:
  - Progress bar showing % complete
  - Percentage complete text
  - Remaining amount needed

### Summary Statistics
Below the badges, a summary card displays:
- Total badges earned
- Total possible badges
- Percentage complete

## Implementation

### Files
- `badges-gallery.js` - Main JavaScript for rendering and API calls
- `tiers-badges.html` - HTML page with badges gallery section
- `styles.css` - CSS styles for badge cards and grid layout
- `api/endpoints/badges.php` - API endpoint (already exists)

### API Endpoint
```
GET /api/badges?action=progress&partner_id=P-0001
```

Response structure:
```json
{
  "success": true,
  "data": {
    "partner_id": "P-0001",
    "total_commissions": 15000.00,
    "total_deposits": 50000.00,
    "badges": [
      {
        "badge_id": 1,
        "badge_name": "com1",
        "badge_criteria": "commissions",
        "badge_trigger": "$1",
        "trigger_amount": 1,
        "current_amount": 15000,
        "progress_percent": 100,
        "earned": true,
        "remaining": 0
      },
      {
        "badge_id": 7,
        "badge_name": "dep100k",
        "badge_criteria": "deposits",
        "badge_trigger": "$100000",
        "trigger_amount": 100000,
        "current_amount": 50000,
        "progress_percent": 50,
        "earned": false,
        "remaining": 50000
      }
    ]
  }
}
```

### How It Works

1. **Page Load**: When the Tiers & Badges page loads, `badges-gallery.js` initializes
2. **Partner Selection**: When a partner is selected from the dropdown:
   - Gallery fetches badge progress from API
   - Renders all 12 badges (6 commission + 6 deposit)
   - Calculates progress based on total commissions/deposits
3. **Visual Updates**: 
   - Earned badges appear in full color with checkmark
   - Pending badges appear faded with progress bars
   - Hover effects add interactivity

## Badge Tiers

### Commission Badges (🏆)
| Badge | Trigger | Color |
|-------|---------|-------|
| COM1 | $1 | Light Cyan |
| COM10 | $10 | Cyan |
| COM100 | $100 | Blue |
| COM1K | $1,000 | Dark Blue |
| COM10K | $10,000 | Navy |
| COM100K | $100,000 | Deep Navy |

### Deposit Badges (💎)
| Badge | Trigger | Color |
|-------|---------|-------|
| DEP1 | $1 | Light Green |
| DEP10 | $10 | Green |
| DEP100 | $100 | Dark Green |
| DEP1K | $1,000 | Forest Green |
| DEP10K | $10,000 | Deep Green |
| DEP100K | $100,000 | Darkest Green |

## Responsive Design

### Desktop (> 768px)
- Grid layout: Auto-fill columns, minimum 160px per badge
- 16px gap between badges
- Hover effects: Card lifts up with shadow

### Tablet (768px - 480px)
- Grid layout: Auto-fill columns, minimum 140px per badge
- 12px gap between badges

### Mobile (< 480px)
- Fixed 2-column grid
- 10px gap between badges
- Reduced padding on badge cards

## Usage

### For Users
1. Navigate to "Tiers & Badges" page
2. Select a partner from the dropdown
3. View earned badges (bright colors) and pending badges (faded)
4. Check progress bars to see how close partners are to earning new badges

### For Developers
To add new badge types:
1. Add to `badges` table in database
2. Update `getBadgeColor()` in `badges-gallery.js` with appropriate color
3. Update `getBadgeIcon()` if using a new criteria type
4. Trigger `award_badges()` stored procedure to award new badges

## Browser Support
- Modern browsers with ES6+ support
- CSS Grid support required
- Fetch API required

## Dependencies
- `api-manager.js` - For API communication (if needed)
- MySQL database with badges and partner_badges tables
- PHP API with badges endpoint

