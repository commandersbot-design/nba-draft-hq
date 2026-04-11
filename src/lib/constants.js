export const CORE_TRAITS = [
  'Advantage Creation',
  'Decision Making',
  'Passing Creation',
  'Shooting Gravity',
  'Off-Ball Value',
  'Processing Speed',
  'Scalability',
  'Defensive Versatility',
];

export const TAG_OPTIONS = [
  'upside',
  'safe',
  'shooter',
  'creator',
  'defender',
  'connector',
  'big-swing',
  'stash',
  'rim-pressure',
  'two-way',
];

export const APP_VIEWS = [
  { id: 'big-board', label: 'Big Board' },
  { id: 'my-board', label: 'My Board' },
  { id: 'compare', label: 'Compare' },
  { id: 'notes', label: 'Notes' },
  { id: 'historical', label: 'Historical' },
];

export const VIEW_MODES = [
  {
    id: 'skim',
    label: 'Snapshot',
    description: 'Fast scan of the board with the most important signals only.',
  },
  {
    id: 'peek',
    label: 'Summary',
    description: 'Adds role, tier, and evaluation context without the full scouting layer.',
  },
  {
    id: 'peruse',
    label: 'Report',
    description: 'Brings in compare, notes, and deeper board workflow.',
  },
  {
    id: 'deep-dive',
    label: 'Full Profile',
    description: 'Complete scouting workspace with all profile and board controls visible.',
  },
];

export const BOARD_CARD_SETTINGS = [
  { id: 'measurements', label: 'Measurements' },
  { id: 'archetype', label: 'Archetype' },
  { id: 'tier', label: 'Tier' },
  { id: 'roleProjection', label: 'Role Projection' },
  { id: 'traitSummary', label: 'Trait Summary' },
  { id: 'shootingSummary', label: 'Shooting Summary' },
  { id: 'defensiveSummary', label: 'Defensive Summary' },
  { id: 'age', label: 'Age' },
  { id: 'school', label: 'School/Team' },
  { id: 'riskFlag', label: 'Risk Flag' },
];
