# NBA Draft HQ - Prospect Profile Page

A comprehensive, editorial-style prospect profile page built with React and Tailwind CSS.

## Features

### Design Philosophy
- **Editorial feel**: Inspired by The Ringer's sports coverage
- **Premium aesthetic**: Clean, minimal, bold typography
- **Two-column layout**: Sticky player card on left, content on right
- **Depth modes**: Skim → Peek → Peruse → Deep Dive

### Page Sections

1. **Top Navigation**
   - Depth mode tabs (Skim, Peek, Peruse, Deep Dive)
   - Position filter dropdown
   - Sticky behavior

2. **Player Card (Left Column)**
   - Rank badge
   - School logo
   - Player image/headshot
   - Name, position, school
   - Physical measurements
   - Rotated card design with shadow
   - Sticky on scroll

3. **Hero Header**
   - Oversized player name (ALL CAPS)
   - Position, school, class metadata
   - Height, weight, age, wingspan
   - One-line scouting summary

4. **Badge Row**
   - Frontend trait labels
   - Color-coded by type

5. **Role Projection Panel**
   - Offensive/defensive role
   - Archetype
   - Draft range
   - Tier badge

6. **Model Breakdown**
   - 8 core trait grades with visual bars
   - Weighted trait score
   - Risk penalty
   - Final board score
   - Formula display

7. **Risk Panel**
   - 8 risk categories
   - Low/Moderate/High indicators
   - 0-3 dot visualization

8. **Scouting Writeup**
   - Summary
   - Strengths (+)
   - Weaknesses (−)
   - Development plan
   - NBA role outlook

9. **Vision Board**
   - Ceiling comp
   - Likely comp
   - Floor comp
   - Style comp
   - Colorful pill design

10. **Stats Grid**
    - 12 stat cards
    - Season label
    - Context labels

11. **Supporting Traits**
    - Grouped by category
    - Grade chips
    - Offensive/Defensive/Physical/Intangible

12. **Related Prospects Strip**
    - Horizontal navigation
    - Rank, logo, name
    - Click to navigate

## Component Structure

```
components/profile/
├── ProspectProfilePage.jsx    # Main page component
├── ProfileTopNav.jsx          # Depth mode navigation
├── ProspectCard.jsx           # Left column player card
├── ProspectHero.jsx           # Hero header section
├── BadgeRow.jsx               # Trait badges
├── RoleProjectionPanel.jsx    # Role/archetype panel
├── ModelBreakdown.jsx         # Core 8 traits + scores
├── RiskPanel.jsx              # Risk assessment
├── ScoutingWriteup.jsx        # Long-form scouting
├── VisionBoard.jsx            # Player comps
├── StatsGrid.jsx              # Statistics cards
├── SupportingTraitsSection.jsx # Supporting traits
├── RelatedProspectsStrip.jsx  # Bottom navigation
└── index.js                   # Exports
```

## Usage

```jsx
import { ProspectProfilePage } from './components/profile';
import { sampleProspect, sampleRelatedProspects } from './data/sampleProspect';

function App() {
  return (
    <ProspectProfilePage 
      prospect={sampleProspect}
      relatedProspects={sampleRelatedProspects}
    />
  );
}
```

## Depth Modes

| Mode | Description |
|------|-------------|
| **Skim** | Summary only |
| **Peek** | Summary + traits + profile |
| **Peruse** | Full profile + stats + comps |
| **Deep Dive** | Everything + supporting traits |

## Data Structure

See `sampleProspect.js` for full data structure including:
- Header data (name, position, school, measurements)
- Model data (traits, scores, tier)
- Risk data (8 risk flags)
- Role/projection data
- Supporting traits
- Writeup content
- Comps
- Statistics

## Styling

- Tailwind CSS
- Custom color palette (Ringer-inspired)
- Inter font family
- Responsive breakpoints
- Editorial typography scale

## Backend Integration

Components are structured to accept props, making it easy to replace sample data with real API data:

```jsx
// Replace this:
prospect={sampleProspect}

// With this:
prospect={apiData}
```

## Future Enhancements

- [ ] Image upload/placeholder system
- [ ] School logo API integration
- [ ] Animated transitions between depth modes
- [ ] Player comparison tool
- [ ] Export to PDF
- [ ] Mobile responsive refinements
- [ ] Dark mode toggle
