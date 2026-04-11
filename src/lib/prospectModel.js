import { CORE_TRAITS } from './constants';
import { findHistoricalPrecedents } from './historicalComps';
import profileStats from '../data/profileStats.json';

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

function hasText(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function sourceLabel(isReal) {
  return isReal ? 'Structured' : 'Derived';
}

function deriveTraitScores(prospect) {
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

function normalizeTraitScores(prospect) {
  const derivedTraits = deriveTraitScores(prospect);
  const suppliedTraits = Array.isArray(prospect.traits)
    ? prospect.traits
    : Array.isArray(prospect.traitScores)
      ? prospect.traitScores
      : null;

  if (!suppliedTraits) {
    return { values: derivedTraits, isReal: false };
  }

  const byName = Object.fromEntries(suppliedTraits.map((trait) => [trait.name, trait]));
  const normalized = CORE_TRAITS.map((name) => {
    const supplied = byName[name];
    const fallback = derivedTraits.find((trait) => trait.name === name);
    const score = firstDefined(supplied?.score, fallback?.score, 0);

    return {
      name,
      score,
      band: firstDefined(supplied?.band, supplied?.percentile, fallback?.band, percentileBand(score)),
      confidence: firstDefined(supplied?.confidence, fallback?.confidence, 'Medium'),
      note: firstDefined(supplied?.note, fallback?.note, 'No evaluator note yet.'),
    };
  });

  return { values: normalized, isReal: true };
}

function compositeScore(traits) {
  return Math.round(traits.reduce((sum, trait) => sum + trait.score, 0) / traits.length);
}

function deriveRoleProjection(position, rank) {
  if (rank <= 5) return 'Primary lineup cornerstone';
  if (position.includes('PG') && rank <= 20) return 'Starting lead or co-creator';
  if (position.includes('SF') || position.includes('SG')) return rank <= 30 ? 'Starting wing connector' : 'Rotation wing bet';
  if (position.includes('C') || position.includes('PF')) return rank <= 30 ? 'Starting frontcourt piece' : 'Rotation frontcourt role';
  return 'Rotation pathway';
}

function deriveRiskLevel(rank, classYear) {
  if (/^\d{4}$/.test(classYear)) return 'High';
  if (rank <= 15) return 'Moderate';
  if (classYear === 'Sr.') return 'Low-Moderate';
  return 'Moderate-High';
}

function deriveSummary(prospect, traits) {
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

function normalizeSummary(prospect, traits) {
  const suppliedSummary = prospect.summary;
  const derivedSummary = deriveSummary(prospect, traits);

  if (!suppliedSummary) {
    return { value: derivedSummary, isReal: false };
  }

  return {
    isReal: hasText(suppliedSummary.synopsis) || normalizeStringArray(suppliedSummary.strengths).length > 0,
    value: {
      synopsis: firstDefined(suppliedSummary.synopsis, derivedSummary.synopsis),
      strengths: normalizeStringArray(firstDefined(suppliedSummary.strengths, derivedSummary.strengths)),
      weaknesses: normalizeStringArray(firstDefined(suppliedSummary.weaknesses, derivedSummary.weaknesses)),
      swingFactors: normalizeStringArray(firstDefined(suppliedSummary.swingFactors, derivedSummary.swingFactors)),
    },
  };
}

function deriveStats(prospect, offenseScore, defenseScore) {
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

function normalizeStats(prospect, offenseScore, defenseScore) {
  const pipelineStats = profileStats[prospect.id];
  const derivedStats = deriveStats(prospect, offenseScore, defenseScore);
  const suppliedStats = pipelineStats?.stats || prospect.stats;

  if (!suppliedStats) {
    return { value: derivedStats, isReal: false };
  }

  return {
    isReal: !!(suppliedStats.season || suppliedStats.advanced || suppliedStats.gameLogAvailable || suppliedStats.shotProfileAvailable),
    value: {
      season: { ...derivedStats.season, ...(suppliedStats.season || {}) },
      advanced: { ...derivedStats.advanced, ...(suppliedStats.advanced || {}) },
      gameLogAvailable: firstDefined(suppliedStats.gameLogAvailable, derivedStats.gameLogAvailable),
      shotProfileAvailable: firstDefined(suppliedStats.shotProfileAvailable, derivedStats.shotProfileAvailable),
    },
  };
}

function deriveProjection(prospect, traits, offenseScore, defenseScore) {
  const topTrait = [...traits].sort((left, right) => right.score - left.score)[0];
  return {
    bestOutcome: `${deriveRoleProjection(prospect.position, Math.max(1, prospect.rank - 10))} with ${topTrait.name.toLowerCase()} driving lineup value.`,
    medianOutcome: deriveRoleProjection(prospect.position, prospect.rank),
    swingSkill: topTrait.name === 'Defensive Versatility' ? 'Shooting Gravity' : 'Defensive Versatility',
    riskSummary: `${deriveRiskLevel(prospect.rank, prospect.classYear)} risk because the path depends on ${topTrait.name.toLowerCase()} holding against better competition.`,
    draftRange: boardBucket(prospect.rank),
    stockBand: movementValue(prospect.movement) >= 8 ? 'Rising' : movementValue(prospect.movement) <= -8 ? 'Sliding' : 'Stable',
    offenseScore,
    defenseScore,
  };
}

function normalizeProjection(prospect, traits, offenseScore, defenseScore) {
  const derivedProjection = deriveProjection(prospect, traits, offenseScore, defenseScore);
  const suppliedProjection = prospect.projection;

  if (!suppliedProjection) {
    return { value: derivedProjection, isReal: false };
  }

  return {
    isReal: hasText(suppliedProjection.bestOutcome) || hasText(suppliedProjection.medianOutcome) || hasText(suppliedProjection.riskSummary),
    value: { ...derivedProjection, ...suppliedProjection },
  };
}

function normalizeMeasurements(prospect) {
  const supplied = prospect.measurements || {};
  const height = firstDefined(supplied.height, prospect.height, '--');
  const weight = firstDefined(supplied.weight, prospect.weight, '');
  const wingspan = firstDefined(supplied.wingspan, prospect.wingspan, '');
  const standingReach = firstDefined(supplied.standingReach, prospect.standingReach, '');
  const measurementLine = `${height}${weight ? ` / ${weight} lb` : ''}${wingspan ? ` / ${wingspan} ws` : ''}`;

  return {
    value: {
      height,
      weight,
      wingspan,
      standingReach,
      measurementLine,
    },
    isReal: !!prospect.measurements,
  };
}

function normalizeSources(prospect) {
  const pipelineStats = profileStats[prospect.id];
  const sources = [
    ...(Array.isArray(prospect.sources) ? prospect.sources : []),
    ...(Array.isArray(pipelineStats?.sources) ? pipelineStats.sources : []),
  ];
  return sources
    .filter((source) => hasText(source?.label) || hasText(source?.url))
    .map((source) => ({
      label: source.label || source.url,
      url: source.url || '',
      type: source.type || 'reference',
    }));
}

/**
 * Isolate derived profile fields from raw source data. When real scouting data
 * is provided in the raw prospect record, it overrides the placeholders here.
 *
 * Supported optional source fields on each prospect:
 * - measurements: { height, weight, wingspan, standingReach }
 * - age
 * - riskLevel
 * - roleProjection
 * - traits: [{ name, score, band, confidence, note }]
 * - summary: { synopsis, strengths, weaknesses, swingFactors }
 * - stats: { season, advanced, gameLogAvailable, shotProfileAvailable }
 * - projection: { bestOutcome, medianOutcome, swingSkill, riskSummary, draftRange, stockBand }
 * - sources: [{ label, url, type }]
 *
 * @param {Array<Record<string, any>>} prospects
 */
export function enrichProspects(prospects) {
  return prospects.map((prospect) => {
    const pipelineStats = profileStats[prospect.id] || {};
    const measurements = normalizeMeasurements(prospect);
    const age = firstDefined(prospect.age, prospect.bio?.age, estimatedAge(prospect.classYear, prospect.rank));
    const traitData = normalizeTraitScores(prospect);
    const overallComposite = firstDefined(prospect.overallComposite, prospect.scores?.overallComposite, compositeScore(traitData.values));
    const offenseScore = firstDefined(
      prospect.offenseScore,
      prospect.scores?.offense,
      Math.round((traitData.values[0].score + traitData.values[2].score + traitData.values[3].score + traitData.values[4].score) / 4),
    );
    const defenseScore = firstDefined(
      prospect.defenseScore,
      prospect.scores?.defense,
      Math.round(traitData.values[7].score),
    );
    const summary = normalizeSummary(prospect, traitData.values);
    const stats = normalizeStats(prospect, offenseScore, defenseScore);
    const projection = normalizeProjection(prospect, traitData.values, offenseScore, defenseScore);
    const roleProjection = firstDefined(prospect.roleProjection, prospect.scouting?.roleProjection, deriveRoleProjection(prospect.position, prospect.rank));
    const riskLevel = firstDefined(prospect.riskLevel, prospect.scouting?.riskLevel, deriveRiskLevel(prospect.rank, prospect.classYear));
    const sources = normalizeSources(prospect);
    const historicalPrecedents = findHistoricalPrecedents({
      ...prospect,
      age,
      roleProjection,
      overallComposite,
      archetype: prospect.archetype,
      position: prospect.position,
      stats: stats.value,
    });

    const realFieldCount = [
      measurements.isReal,
      traitData.isReal,
      summary.isReal,
      stats.isReal,
      projection.isReal,
      hasText(prospect.age) || hasText(prospect.bio?.age),
      hasText(prospect.roleProjection) || hasText(prospect.scouting?.roleProjection),
      hasText(prospect.riskLevel) || hasText(prospect.scouting?.riskLevel),
      sources.length > 0,
    ].filter(Boolean).length;

    return {
      ...prospect,
      height: measurements.value.height,
      weight: measurements.value.weight,
      wingspan: measurements.value.wingspan,
      standingReach: measurements.value.standingReach,
      age,
      measurementLine: measurements.value.measurementLine,
      overallComposite,
      offenseScore,
      defenseScore,
      riskLevel,
      roleProjection,
      traitScores: traitData.values,
      summary: summary.value,
      stats: stats.value,
      projection: projection.value,
      statCards: Array.isArray(pipelineStats.statCards) ? pipelineStats.statCards : [],
      statPercentiles: pipelineStats.percentiles || {},
      statStrengths: Array.isArray(pipelineStats.statStrengths) ? pipelineStats.statStrengths : [],
      statWeaknesses: Array.isArray(pipelineStats.statWeaknesses) ? pipelineStats.statWeaknesses : [],
      archetypeIndicators: Array.isArray(pipelineStats.archetypeIndicators) ? pipelineStats.archetypeIndicators : [],
      comparisonInputs: pipelineStats.comparisonInputs || {},
      historicalPrecedents,
      profileSections: ['Overview', 'Model', 'Stats', 'Comps', 'Notes'],
      sources,
      dataQuality: {
        profile: realFieldCount >= 5 || pipelineStats.season ? 'Structured' : realFieldCount > 0 ? 'Mixed' : 'Derived',
        traits: sourceLabel(traitData.isReal),
        summary: sourceLabel(summary.isReal),
        stats: sourceLabel(stats.isReal || !!pipelineStats.season),
        projection: sourceLabel(projection.isReal),
      },
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
