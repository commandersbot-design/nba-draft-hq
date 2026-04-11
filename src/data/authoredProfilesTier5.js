import prospects from './prospects.json';

const TIER5_MIN_RANK = 61;

const ARCHETYPE_PROFILES = {
  'Interior anchor': {
    roleProjection: 'Reserve interior anchor',
    scores: { overallComposite: 72, offense: 63, defense: 79 },
    traits: [50, 70, 44, 36, 78, 73, 72, 84],
    synopsis: 'Interior big whose role case starts with rim utility, physical presence, and low-maintenance defensive value.',
    strengths: ['Defensive shape is easier to project than the offense.', 'Can help the glass and protect interior possessions without usage.'],
    weaknesses: ['Spacing value is not carrying the profile.', 'Offensive ceiling is tightly limited.'],
    swingFactors: ['Whether the defense is strong enough to carry a narrow offensive role.', 'How much simple offensive utility keeps him playable.'],
    bestOutcome: 'Rotation center whose defense stabilizes bench units.',
    medianOutcome: 'Depth interior big with matchup utility.',
    swingSkill: 'Offensive utility',
  },
  'Lead guard organizer': {
    roleProjection: 'Backup lead guard',
    scores: { overallComposite: 73, offense: 74, defense: 60 },
    traits: [73, 79, 76, 67, 64, 79, 69, 57],
    synopsis: 'Control-oriented guard whose best path is through pace management, passing, and keeping possessions clean.',
    strengths: ['Processing and passing are the main reasons to buy the role.', 'Can keep offense organized without forcing chaos.'],
    weaknesses: ['Physical margin for error is limited.', 'The jumper still determines how well the role scales.'],
    swingFactors: ['Whether the shooting is respected enough to unlock better reads.', 'How well the defense survives bigger matchups.'],
    bestOutcome: 'Steady rotation guard who keeps offense on schedule.',
    medianOutcome: 'Reserve organizer with spot creation value.',
    swingSkill: 'Shooting Gravity',
  },
  'Shotmaking guard': {
    roleProjection: 'Bench scoring guard',
    scores: { overallComposite: 73, offense: 77, defense: 57 },
    traits: [72, 69, 52, 81, 74, 69, 71, 55],
    synopsis: 'Shotmaking-led guard whose role pathway runs through perimeter scoring and bench offense.',
    strengths: ['Jumper gives the profile immediate offensive clarity.', 'Can create scoring value without being a full-time initiator.'],
    weaknesses: ['Defense is usually the pressure point.', 'Passing value is secondary at best.'],
    swingFactors: ['Whether the shooting is strong enough to offset the defensive limits.', 'How much secondary creation the profile can add.'],
    bestOutcome: 'Instant-offense reserve guard who bends spacing.',
    medianOutcome: 'Specialist scoring guard.',
    swingSkill: 'Defensive Versatility',
  },
  'Two-way wing': {
    roleProjection: 'Rotation two-way wing',
    scores: { overallComposite: 73, offense: 69, defense: 75 },
    traits: [64, 72, 58, 61, 75, 73, 76, 80],
    synopsis: 'Wing development bet whose value rests on defensive viability, lineup fit, and enough complementary offense.',
    strengths: ['Wing frame and defense create a clean role pathway.', 'Can fit a lower-usage lineup context.'],
    weaknesses: ['The shot still decides the offensive floor.', 'Does not yet bring a major carrying skill.'],
    swingFactors: ['Whether the jumper becomes strong enough to hold spacing.', 'How much the defense becomes truly bankable possession to possession.'],
    bestOutcome: 'Useful two-way wing who fits multiple lineup shapes.',
    medianOutcome: 'Developmental rotation wing.',
    swingSkill: 'Shooting Gravity',
  },
  'Play-finishing four': {
    roleProjection: 'Reserve combo four',
    scores: { overallComposite: 72, offense: 68, defense: 73 },
    traits: [60, 70, 52, 60, 76, 71, 73, 75],
    synopsis: 'Forward bet built around frontcourt activity, physical utility, and enough skill to survive a supporting role.',
    strengths: ['Can contribute without heavy touch volume.', 'Frontcourt tools keep multiple role paths open.'],
    weaknesses: ['Offensive polish still trails the physical template.', 'The shot remains important to the role ceiling.'],
    swingFactors: ['Whether the jumper becomes playable enough for spacing.', 'How much defensive reliability the tools can support.'],
    bestOutcome: 'Rotation four who adds useful frontcourt versatility.',
    medianOutcome: 'Bench forward with utility minutes.',
    swingSkill: 'Shooting Gravity',
  },
  'Modern frontcourt big': {
    roleProjection: 'Rotation modern big',
    scores: { overallComposite: 73, offense: 68, defense: 77 },
    traits: [56, 72, 50, 43, 79, 74, 75, 82],
    synopsis: 'Frontcourt role player whose pathway is driven by defensive utility, activity, and enough offensive function to stay on the floor.',
    strengths: ['Can impact games through frontcourt role work.', 'Defensive value is easier to trust than the offensive ceiling.'],
    weaknesses: ['Spacing is still limited or speculative.', 'Shot creation is not a part of the profile.'],
    swingFactors: ['Whether the defense is mobile enough for broader scheme demands.', 'How much offensive utility grows around screens, finishing, and reads.'],
    bestOutcome: 'Useful rotation big who gives lineups defensive flexibility.',
    medianOutcome: 'Bench frontcourt defender.',
    swingSkill: 'Shooting Gravity',
  },
  'Hybrid forward': {
    roleProjection: 'Rotation hybrid forward',
    scores: { overallComposite: 73, offense: 71, defense: 72 },
    traits: [64, 75, 63, 66, 77, 76, 78, 73],
    synopsis: 'Hybrid forward whose role case depends on fit, quick decisions, and enough two-way steadiness to complement stronger teammates.',
    strengths: ['Connector value helps the lineup fit.', 'Can play within structure without demanding touches.'],
    weaknesses: ['Does not create a lot of offense on his own.', 'The defensive ceiling is more useful than dominant.'],
    swingFactors: ['Whether the shot carries enough spacing value.', 'How much two-way consistency shows up against NBA athletes.'],
    bestOutcome: 'Winning connector forward who fits multiple lineup types.',
    medianOutcome: 'Role-based rotation forward.',
    swingSkill: 'Shooting Gravity',
  },
  'Scoring wing': {
    roleProjection: 'Bench scoring wing',
    scores: { overallComposite: 73, offense: 75, defense: 61 },
    traits: [72, 70, 55, 77, 72, 70, 72, 60],
    synopsis: 'Wing scorer whose cleanest NBA path is through perimeter offense and enough size to survive a role slot.',
    strengths: ['Shotmaking gives the profile a real lane.', 'Can supply scoring without full offensive ownership.'],
    weaknesses: ['Defense still limits lineup freedom.', 'Playmaking is not a major value driver.'],
    swingFactors: ['Whether the scoring efficiency holds up against better defenders.', 'How much defensive acceptability he can build.'],
    bestOutcome: 'Rotation wing scorer who bends second-side coverage.',
    medianOutcome: 'Bench scoring wing.',
    swingSkill: 'Defensive Versatility',
  },
  'Combo guard creator': {
    roleProjection: 'Reserve combo creator',
    scores: { overallComposite: 73, offense: 75, defense: 59 },
    traits: [76, 72, 71, 71, 61, 72, 65, 57],
    synopsis: 'Combo guard whose value depends on live-dribble offense, enough passing, and finding the right usage level.',
    strengths: ['Can create some offense off the bounce.', 'Passing flashes keep a real creator path alive.'],
    weaknesses: ['The role can get tight if the shot and defense both lag.', 'Decision quality still decides how clean the possessions look.'],
    swingFactors: ['Whether the jumper becomes respected enough to open the full creation package.', 'How much the defense can survive in a rotation role.'],
    bestOutcome: 'Useful rotation combo guard who can run offense in stretches.',
    medianOutcome: 'Bench creator with lineup-dependent value.',
    swingSkill: 'Decision Making',
  },
};

const TRAIT_NAMES = [
  'Advantage Creation',
  'Decision Making',
  'Passing Creation',
  'Shooting Gravity',
  'Off-Ball Value',
  'Processing Speed',
  'Scalability',
  'Defensive Versatility',
];

function classAge(classYear, rank) {
  if (/^\d{4}$/.test(classYear)) return Number((19 + rank * 0.01).toFixed(1));
  if (classYear === 'Fr.') return Number((18.8 + rank * 0.01).toFixed(1));
  if (classYear === 'So.') return Number((19.8 + rank * 0.008).toFixed(1));
  if (classYear === 'Jr.') return Number((21 + rank * 0.005).toFixed(1));
  if (classYear === 'Sr.') return Number((22 + rank * 0.004).toFixed(1));
  return 20.5;
}

function stockBand(movement) {
  const value = Number.parseInt(movement, 10) || 0;
  if (value >= 10) return 'Rising';
  if (value <= -10) return 'Sliding';
  return 'Stable';
}

function riskLevel(classYear, movement, rank) {
  const value = Number.parseInt(movement, 10) || 0;
  if (/^\d{4}$/.test(classYear) || classYear === 'Fr.') return value >= 10 ? 'Moderate-High' : 'High';
  if (classYear === 'So.') return value <= -15 ? 'Moderate-High' : 'Moderate';
  if (classYear === 'Sr.') return 'Low-Moderate';
  return rank >= 85 ? 'Moderate' : 'Moderate-High';
}

function adjustScores(baseScores, prospect) {
  const movement = Number.parseInt(prospect.movement, 10) || 0;
  const rankPenalty = Math.floor((prospect.rank - TIER5_MIN_RANK) / 10);
  return TRAIT_NAMES.map((name, index) => {
    const base = baseScores[index];
    const movementLift = index === 3 || index === 7 ? Math.round(movement / 6) : Math.round(movement / 10);
    return Math.max(34, Math.min(89, base - rankPenalty + movementLift));
  });
}

function measurementHeight(prospect) {
  return prospect.height || '--';
}

function measurementWeight(prospect) {
  return prospect.weight || '';
}

function buildProfile(prospect) {
  const archetype = ARCHETYPE_PROFILES[prospect.archetypeBase] || ARCHETYPE_PROFILES['Hybrid forward'];
  const traits = adjustScores(archetype.traits, prospect);
  const scoreShift = Math.round((Number.parseInt(prospect.movement, 10) || 0) / 8);

  return {
    age: classAge(prospect.classYear, prospect.rank),
    measurements: {
      height: measurementHeight(prospect),
      weight: measurementWeight(prospect),
      wingspan: '',
    },
    riskLevel: riskLevel(prospect.classYear, prospect.movement, prospect.rank),
    roleProjection: archetype.roleProjection,
    scores: {
      overallComposite: Math.max(68, Math.min(78, archetype.scores.overallComposite + scoreShift)),
      offense: Math.max(62, Math.min(80, archetype.scores.offense + Math.round(scoreShift / 2))),
      defense: Math.max(54, Math.min(84, archetype.scores.defense + Math.round(scoreShift / 2))),
    },
    traits: TRAIT_NAMES.map((name, index) => ({
      name,
      score: traits[index],
      note: `${name} currently projects through a ${prospect.archetypeBase.toLowerCase()} role pathway.`,
    })),
    summary: {
      synopsis: archetype.synopsis,
      strengths: archetype.strengths,
      weaknesses: archetype.weaknesses,
      swingFactors: archetype.swingFactors,
    },
    projection: {
      bestOutcome: archetype.bestOutcome,
      medianOutcome: archetype.medianOutcome,
      swingSkill: archetype.swingSkill,
      riskSummary: `This profile remains ${riskLevel(prospect.classYear, prospect.movement, prospect.rank).toLowerCase()} risk because the role is still being pressure-tested by translation questions.`,
      draftRange: prospect.rank <= 75 ? 'Second round' : 'Two-way / second round',
      stockBand: stockBand(prospect.movement),
    },
  };
}

const authoredProfilesTier5 = Object.fromEntries(
  prospects
    .filter((prospect) => prospect.rank >= TIER5_MIN_RANK && prospect.rank <= 100)
    .map((prospect) => [prospect.id, buildProfile(prospect)]),
);

export default authoredProfilesTier5;
