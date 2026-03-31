// Sample prospect data for testing the profile page
export const sampleProspect = {
  id: 1,
  rank: 1,
  firstName: 'AJ',
  lastName: 'DYBANTSA',
  position: 'SF/PF',
  school: 'BYU',
  classYear: 2026,
  age: 19,
  height: "6'9",
  weight: '210 lbs',
  wingspan: "7'0",
  
  summary: "A dynamic downhill creator with real star-pathway upside, but with shooting and role-translation questions still shaping the final outcome.",
  
  badges: [
    'advantage_creation',
    'shooting_gravity',
    'processing_speed',
    'scalability',
    'defensive_versatility',
    'decision_making',
    'rim_pressure'
  ],
  
  projection: {
    offensiveRole: 'Primary scorer / facilitator',
    defensiveRole: 'Helper / chaser',
    archetype: 'Versatile Wing Creator',
    draftRange: 'Top 3',
    tier: 'Tier 1 — Franchise Player'
  },
  
  coreTraits: [
    { key: 'advantage_creation', grade: 9 },
    { key: 'decision_making', grade: 7 },
    { key: 'passing_creation', grade: 6 },
    { key: 'shooting_gravity', grade: 8 },
    { key: 'off_ball_value', grade: 7 },
    { key: 'processing_speed', grade: 8 },
    { key: 'scalability', grade: 9 },
    { key: 'defensive_versatility', grade: 8 }
  ],
  
  weightedTraitScore: 84.5,
  riskPenalty: 2.5,
  finalBoardScore: 82.0,
  tier: 'Tier 1 — Franchise Player',
  
  risks: [
    { key: 'shooting_risk', level: 1 },
    { key: 'physical_translation_risk', level: 0 },
    { key: 'creation_translation_risk', level: 1 },
    { key: 'defensive_role_risk', level: 0 },
    { key: 'processing_risk', level: 0 },
    { key: 'age_upside_risk', level: 0 },
    { key: 'motor_consistency_risk', level: 0 },
    { key: 'medical_risk', level: 0 }
  ],
  
  writeup: {
    summary: "AJ Dybantsa enters the 2026 draft as one of the most intriguing prospects in recent memory. At 6'9 with a 7'0 wingspan, he possesses ideal wing size combined with elite athleticism and a developing skill set that suggests significant upside.",
    strengths: [
      'Elite two-way potential with NBA-ready frame',
      'Versatile scoring ability at all three levels',
      'High motor and competitive toughness',
      'Strong finisher in transition and half-court',
      'Shows flashes of playmaking vision'
    ],
    weaknesses: [
      'Shot selection can improve — prone to hero ball',
      'Three-point consistency needs development',
      'Playmaking reads still developing',
      'Turnover prone when pressured',
      'Defensive discipline inconsistent'
    ],
    developmentPlan: "Dybantsa needs to refine his shot selection and continue developing his three-point consistency. Working on his handle under pressure and defensive positioning will be key to reaching his ceiling as a primary option.",
    roleOutlook: "Projects as a primary scoring wing who can create advantages, defend multiple positions, and grow into a franchise cornerstone. Ceiling is a Paul George-type two-way star."
  },
  
  comps: [
    { type: 'high', player: 'Paul George' },
    { type: 'median', player: 'Franz Wagner' },
    { type: 'low', player: 'Rudy Gay' },
    { type: 'style', player: 'Jayson Tatum' }
  ],
  
  stats: {
    ppg: 17.8,
    rpg: 6.5,
    apg: 2.8,
    stl: 1.2,
    blk: 0.8,
    threePct: '38.5%',
    ts: '59.7%',
    usg: '26.8%',
    ast: '18.5%',
    tov: '12.2%',
    bpm: '+8.5',
    obpm: '+6.2'
  },
  
  supportingTraits: [
    { name: 'Rim Finishing', grade: 9, category: 'offensive' },
    { name: 'Rim Pressure', grade: 9, category: 'offensive' },
    { name: 'Self-Creation', grade: 8, category: 'offensive' },
    { name: 'Mid-Range Shotmaking', grade: 7, category: 'offensive' },
    { name: 'Three-Point Shooting', grade: 7, category: 'offensive' },
    { name: 'Transition Offense', grade: 9, category: 'offensive' },
    { name: 'On-Ball Defense', grade: 7, category: 'defensive' },
    { name: 'Team Defense', grade: 7, category: 'defensive' },
    { name: 'Switchability', grade: 8, category: 'defensive' },
    { name: 'First Step', grade: 9, category: 'physical' },
    { name: 'Vertical Explosion', grade: 8, category: 'physical' },
    { name: 'Frame', grade: 8, category: 'physical' },
    { name: 'Feel', grade: 7, category: 'intangible' },
    { name: 'Competitive Toughness', grade: 8, category: 'intangible' },
    { name: 'Work Ethic', grade: 8, category: 'intangible' }
  ]
};

export const sampleRelatedProspects = [
  { id: 1, rank: 1, firstName: 'AJ', lastName: 'Dybantsa', position: 'SF', school: 'BYU' },
  { id: 2, rank: 2, firstName: 'Darryn', lastName: 'Peterson', position: 'SG', school: 'Kansas' },
  { id: 3, rank: 3, firstName: 'Cameron', lastName: 'Boozer', position: 'PF', school: 'Duke' },
  { id: 4, rank: 4, firstName: 'Caleb', lastName: 'Wilson', position: 'SF', school: 'UNC' },
  { id: 5, rank: 5, firstName: 'Kingston', lastName: 'Flemings', position: 'PG', school: 'Houston' },
  { id: 6, rank: 6, firstName: 'Jayden', lastName: 'Quaintance', position: 'C', school: 'Kentucky' },
  { id: 7, rank: 7, firstName: 'Koa', lastName: 'Peat', position: 'SF', school: 'Arizona' },
  { id: 8, rank: 8, firstName: 'Mikel', lastName: 'Brown', position: 'PG', school: 'Louisville' }
];
