import { CORE_TRAITS } from './constants';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function boardBucket(rank) {
  if (rank <= 5) return 'Top 5';
  if (rank <= 14) return 'Lottery';
  if (rank <= 30) return 'First round';
  if (rank <= 60) return 'Second round';
  return 'Board depth';
}

function movementValue(movement) {
  return Number.parseInt(movement, 10) || 0;
}

function heightToInches(height) {
  const [feet, inches] = String(height).split('-').map(Number);
  return Number.isFinite(feet) && Number.isFinite(inches) ? feet * 12 + inches : 0;
}

function estimatedAge(classYear, rank) {
  const normalizedRank = clamp(rank || 60, 1, 100);
  if (/^\d{4}$/.test(classYear)) return Number((18.1 + normalizedRank * 0.01).toFixed(1));
  if (classYear === 'Fr.') return Number((18.5 + normalizedRank * 0.008).toFixed(1));
  if (classYear === 'So.') return Number((19.4 + normalizedRank * 0.006).toFixed(1));
  if (classYear === 'Jr.') return Number((20.6 + normalizedRank * 0.004).toFixed(1));
  if (classYear === 'Sr.') return Number((21.7 + normalizedRank * 0.003).toFixed(1));
  return 20.0;
}

function percentileBand(score) {
  if (score >= 88) return 'Elite';
  if (score >= 78) return 'Strong';
  if (score >= 68) return 'Solid';
  if (score >= 58) return 'Swing';
  return 'Developmental';
}

function confidenceLabel(rank, classYear) {
  if (/^\d{4}$/.test(classYear) || rank > 55) return 'Medium';
  if (rank <= 20) return 'High';
  return 'Medium-High';
}

function positionTraits(position) {
  const isLead = position.includes('PG');
  const isWing = position.includes('SF') || position.includes('SG');
  const isBig = position.includes('C') || position.includes('PF');

  return {
    advantage: isLead ? 84 : isWing ? 72 : 58,
    decision: isLead ? 79 : isWing ? 70 : 66,
    passing: isLead ? 81 : isWing ? 63 : 57,
    shooting: isWing ? 76 : isLead ? 73 : 54,
    offBall: isWing ? 75 : isBig ? 64 : 69,
    processing: isLead ? 78 : isWing ? 72 : 67,
    scalability: isWing ? 80 : isLead ? 68 : 61,
    defense: isBig ? 77 : isWing ? 74 : 62,
  };
}

function traitScores(prospect) {
  const base = positionTraits(prospect.position);
  const rankLift = clamp(18 - Math.floor(prospect.rank / 6), -8, 14);
  const movementLift = clamp((parseInt(prospect.movement, 10) || 0) / 2, -8, 8);

  const values = [
    ['Advantage Creation', clamp(base.advantage + rankLift + movementLift, 45, 96)],
    ['Decision Making', clamp(base.decision + rankLift / 1.5, 45, 95)],
    ['Passing Creation', clamp(base.passing + movementLift / 1.4, 40, 94)],
    ['Shooting Gravity', clamp(base.shooting + rankLift / 2, 40, 95)],
    ['Off-Ball Value', clamp(base.offBall + rankLift / 2, 45, 94)],
    ['Processing Speed', clamp(base.processing + rankLift / 1.7, 45, 95)],
    ['Scalability', clamp(base.scalability + rankLift / 1.8, 45, 95)],
    ['Defensive Versatility', clamp(base.defense + rankLift / 2, 42, 95)],
  ];

  return values.map(([name, score]) => ({
    name,
    score: Math.round(score),
    band: percentileBand(score),
    confidence: confidenceLabel(prospect.rank, prospect.classYear),
    note: `${name} currently grades as a ${percentileBand(score).toLowerCase()} signal relative to this board.`,
  }));
}

function compositeScore(traits) {
  return Math.round(traits.reduce((sum, trait) => sum + trait.score, 0) / traits.length);
}

function roleProjection(position, rank) {
  if (rank <= 5) return 'Primary lineup cornerstone';
  if (position.includes('PG') && rank <= 20) return 'Starting lead or co-creator';
  if (position.includes('SF') || position.includes('SG')) return rank <= 30 ? 'Starting wing connector' : 'Rotation wing bet';
  if (position.includes('C') || position.includes('PF')) return rank <= 30 ? 'Starting frontcourt piece' : 'Rotation frontcourt role';
  return 'Rotation pathway';
}

function riskLevel(rank, classYear) {
  if (/^\d{4}$/.test(classYear)) return 'High';
  if (rank <= 15) return 'Moderate';
  if (classYear === 'Sr.') return 'Low-Moderate';
  return 'Moderate-High';
}

function summaryBlocks(prospect, traits) {
  const topTraits = [...traits].sort((left, right) => right.score - left.score).slice(0, 2).map((trait) => trait.name);
  const bottomTraits = [...traits].sort((left, right) => left.score - right.score).slice(0, 2).map((trait) => trait.name);

  return {
    synopsis: `${prospect.name} profiles as a ${prospect.archetypeBase.toLowerCase()} with board value driven by ${topTraits.join(' and ').toLowerCase()}.`,
    strengths: [
      `${topTraits[0]} currently shows up as a leading signal on this board.`,
      `${prospect.position} frame and ${prospect.archetype.toLowerCase()} profile fit modern lineup demands.`,
      `Movement trend of ${prospect.movement || '0'} suggests current board momentum is notable.`,
    ],
    weaknesses: [
      `${bottomTraits[0]} is the most likely pressure point against stronger NBA environments.`,
      `${bottomTraits[1]} still needs more certainty before the role fully stabilizes.`,
    ],
    swingFactors: [
      `Whether ${bottomTraits[0].toLowerCase()} can clear starter-level thresholds.`,
      `How ${prospect.teamFit.toLowerCase()}`,
    ],
  };
}

function statsBlock(prospect, offenseScore, defenseScore) {
  const age = estimatedAge(prospect.classYear, prospect.rank);
  const height = heightToInches(prospect.height);
  return {
    season: {
      games: clamp(30 + Math.floor((100 - prospect.rank) / 4), 18, 38),
      points: Number((8 + offenseScore / 7).toFixed(1)),
      rebounds: Number((2 + height / 24).toFixed(1)),
      assists: Number((1 + offenseScore / 16).toFixed(1)),
      steals: Number((0.5 + defenseScore / 90).toFixed(1)),
      blocks: Number((0.3 + height / 120).toFixed(1)),
    },
    advanced: {
      trueShooting: `${clamp(48 + Math.round(offenseScore / 3), 48, 66)}%`,
      usage: `${clamp(18 + Math.round(offenseScore / 5), 18, 31)}%`,
      assistRate: `${clamp(8 + Math.round(offenseScore / 4), 8, 34)}%`,
      reboundRate: `${clamp(6 + Math.round(height / 10), 6, 24)}%`,
      bpm: Number(((offenseScore + defenseScore - 120) / 10).toFixed(1)),
      age,
    },
    gameLogAvailable: false,
    shotProfileAvailable: false,
  };
}

function projectionBlock(prospect, traits, offenseScore, defenseScore) {
  const topTrait = [...traits].sort((left, right) => right.score - left.score)[0];
  return {
    bestOutcome: `${roleProjection(prospect.position, Math.max(1, prospect.rank - 10))} with ${topTrait.name.toLowerCase()} driving lineup value.`,
    medianOutcome: roleProjection(prospect.position, prospect.rank),
    swingSkill: topTrait.name === 'Defensive Versatility' ? 'Shooting Gravity' : 'Defensive Versatility',
    riskSummary: `${riskLevel(prospect.rank, prospect.classYear)} risk because the path depends on ${topTrait.name.toLowerCase()} holding against better competition.`,
    draftRange: boardBucket(prospect.rank),
    stockBand: movementValue(prospect.movement) >= 8 ? 'Rising' : movementValue(prospect.movement) <= -8 ? 'Sliding' : 'Stable',
    offenseScore,
    defenseScore,
  };
}

/**
 * Isolate derived profile fields from raw source data. These fields are safe
 * placeholders until real scouting inputs replace them.
 *
 * @param {Array<Record<string, any>>} prospects
 */
export function enrichProspects(prospects) {
  return prospects.map((prospect) => {
    const traits = traitScores(prospect);
    const overallComposite = compositeScore(traits);
    const offenseScore = Math.round((traits[0].score + traits[2].score + traits[3].score + traits[4].score) / 4);
    const defenseScore = Math.round(traits[7].score);
    const age = estimatedAge(prospect.classYear, prospect.rank);
    const measurementLine = `${prospect.height}${prospect.weight ? ` / ${prospect.weight} lb` : ''}${prospect.wingspan ? ` / ${prospect.wingspan} ws` : ''}`;
    const summary = summaryBlocks(prospect, traits);

    return {
      ...prospect,
      age,
      measurementLine,
      overallComposite,
      offenseScore,
      defenseScore,
      riskLevel: riskLevel(prospect.rank, prospect.classYear),
      roleProjection: roleProjection(prospect.position, prospect.rank),
      traitScores: traits,
      summary,
      stats: statsBlock(prospect, offenseScore, defenseScore),
      projection: projectionBlock(prospect, traits, offenseScore, defenseScore),
    };
  });
}

export function createEmptyStructuredNote(playerId) {
  return {
    id: `${playerId}-${Date.now()}`,
    playerId,
    quickSummary: '',
    strengths: '',
    weaknesses: '',
    projection: '',
    context: '',
    freeform: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
