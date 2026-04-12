import { CORE_TRAITS } from './constants';
import authoredProfilesTier3 from '../data/authoredProfilesTier3.json';
import authoredProfilesTier4 from '../data/authoredProfilesTier4';
import authoredProfilesTier5 from '../data/authoredProfilesTier5';
import measurementOverrides from '../data/measurementOverrides';
import sourceDirectories from '../data/sourceDirectories';
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

function searchUrl(query) {
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

function buildFallbackSources(prospect, pipelineStats) {
  const sources = [];
  const playerLabel = [prospect.name, prospect.school].filter(Boolean).join(' ');
  const directory = sourceDirectories[prospect.school];

  if (directory?.team) {
    sources.push({
      label: 'Official team page',
      url: directory.team,
      type: 'team',
    });
  }

  if (directory?.roster) {
    sources.push({
      label: 'Official roster',
      url: directory.roster,
      type: 'bio',
    });
  }

  if (playerLabel) {
    sources.push({
      label: 'Measurement search',
      url: searchUrl(`${playerLabel} height weight wingspan basketball`),
      type: 'measurement',
    });
    sources.push({
      label: 'Roster search',
      url: searchUrl(`${playerLabel} basketball roster`),
      type: 'bio',
    });
  }

  if (playerLabel && pipelineStats?.stats?.season) {
    sources.push({
      label: 'Stat search',
      url: searchUrl(`${playerLabel} basketball stats`),
      type: 'stats',
    });
  }

  return sources;
}

function sourceLabel(isReal) {
  return isReal ? 'Structured' : 'Derived';
}

function percentileToLabel(value) {
  if (!Number.isFinite(value)) return 'Untracked';
  if (value >= 90) return 'Elite';
  if (value >= 75) return 'Strong';
  if (value >= 60) return 'Positive';
  if (value >= 40) return 'Neutral';
  if (value >= 25) return 'Soft';
  return 'Concern';
}

function normalizeMetricValue(value) {
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value.replace('%', ''));
    return Number.isFinite(numeric) ? numeric : null;
  }
  return Number.isFinite(value) ? value : null;
}

function buildRiskFlags(prospect, statPercentiles, traits) {
  const flags = [];
  const shootingTrait = traits.find((trait) => trait.name === 'Shooting Gravity')?.score ?? 0;
  const processingTrait = traits.find((trait) => trait.name === 'Processing Speed')?.score ?? 0;
  const creationTrait = traits.find((trait) => trait.name === 'Advantage Creation')?.score ?? 0;
  const defenseTrait = traits.find((trait) => trait.name === 'Defensive Versatility')?.score ?? 0;
  const scalabilityTrait = traits.find((trait) => trait.name === 'Scalability')?.score ?? 0;
  const age = Number(prospect.age);

  if (shootingTrait <= 5.5 || (statPercentiles.threePct ?? 50) <= 40 || (statPercentiles.trueShooting ?? 50) <= 40) {
    flags.push({ key: 'shooting_risk', label: 'Shooting risk', severity: shootingTrait <= 4.5 ? 'high' : 'moderate' });
  }
  if (creationTrait <= 5.5 && prospect.position.includes('PG')) {
    flags.push({ key: 'creation_translation_risk', label: 'Creation translation risk', severity: 'moderate' });
  }
  if (defenseTrait <= 5.5 || (statPercentiles.blocksPerGame ?? 50) <= 35) {
    flags.push({ key: 'defensive_role_risk', label: 'Defensive role risk', severity: defenseTrait <= 4.5 ? 'high' : 'moderate' });
  }
  if (processingTrait <= 5.5) {
    flags.push({ key: 'processing_risk', label: 'Processing risk', severity: processingTrait <= 4.5 ? 'high' : 'moderate' });
  }
  if (age >= 22.5 && scalabilityTrait <= 6.5) {
    flags.push({ key: 'age_upside_risk', label: 'Age/upside risk', severity: 'moderate' });
  }
  if ((statPercentiles.reboundRate ?? 50) <= 30 && (prospect.position.includes('C') || prospect.position.includes('PF'))) {
    flags.push({ key: 'physical_translation_risk', label: 'Physical translation risk', severity: 'moderate' });
  }

  if (flags.length === 0) {
    flags.push({ key: 'baseline_risk', label: 'Baseline variance', severity: prospect.riskLevel === 'High' ? 'high' : prospect.riskLevel === 'Low-Moderate' ? 'low' : 'moderate' });
  }

  return flags.slice(0, 4);
}

function buildAutoInterpretation(prospect, traits, statPercentiles, riskFlags) {
  const traitByName = Object.fromEntries(traits.map((trait) => [trait.name, trait]));
  const strengths = [];
  const weaknesses = [];

  const pushStrength = (label, explanation) => {
    if (strengths.some((entry) => entry.label === label)) return;
    strengths.push({ label, explanation });
  };

  const pushWeakness = (label, explanation) => {
    if (weaknesses.some((entry) => entry.label === label)) return;
    weaknesses.push({ label, explanation });
  };

  if ((traitByName['Advantage Creation']?.score ?? 0) >= 7.5 && (statPercentiles.pointsPerGame ?? 0) >= 65) {
    pushStrength('Paint Touch Creator', 'consistently bends the defense off the bounce');
  }
  if ((traitByName['Shooting Gravity']?.score ?? 0) >= 7.5 && ((statPercentiles.threePct ?? 0) >= 65 || (statPercentiles.trueShooting ?? 0) >= 65)) {
    pushStrength('Warps Spacing', 'forces attention with real shotmaking pressure');
  }
  if ((traitByName['Processing Speed']?.score ?? 0) >= 7.5) {
    pushStrength('Fast Processor', 'sees the next action early and keeps possessions moving');
  }
  if ((traitByName['Off-Ball Value']?.score ?? 0) >= 7.5) {
    pushStrength('Connector Value', 'adds utility without needing every possession');
  }
  if ((traitByName['Defensive Versatility']?.score ?? 0) >= 7.5 && (statPercentiles.blocksPerGame ?? statPercentiles.stealsPerGame ?? 0) >= 65) {
    pushStrength('Switchable Coverage', 'holds value across multiple matchups and actions');
  }
  if ((traitByName['Passing Creation']?.score ?? 0) >= 7.5 && (statPercentiles.assistsPerGame ?? 0) >= 65) {
    pushStrength('Advantage Passing', 'turns touches into clean looks for others');
  }

  if ((traitByName['Shooting Gravity']?.score ?? 10) <= 5.5 && ((statPercentiles.threePct ?? 100) <= 40 || (statPercentiles.trueShooting ?? 100) <= 40)) {
    pushWeakness('Shooting Concern', 'the jumper still leaves defenders room to cheat');
  }
  if ((traitByName['Defensive Versatility']?.score ?? 10) <= 5.5) {
    pushWeakness('Defensive Role Question', 'the defensive fit is still more theoretical than stable');
  }
  if ((traitByName['Processing Speed']?.score ?? 10) <= 5.5) {
    pushWeakness('Slow Processor', 'possession speed and reads still lag the role ask');
  }
  if ((traitByName['Scalability']?.score ?? 10) <= 5.5) {
    pushWeakness('Role Compression Risk', 'the pathway narrows if star-level usage is unavailable');
  }
  if ((traitByName['Passing Creation']?.score ?? 10) <= 5.5 && prospect.position.includes('PG')) {
    pushWeakness('Table-Setting Concern', 'lead guard touches do not yet create enough for others');
  }

  const sortedTraits = [...traits].sort((left, right) => right.score - left.score);
  const sortedWeakTraits = [...traits].sort((left, right) => left.score - right.score);
  const swingTrait = (() => {
    const shot = traitByName['Shooting Gravity']?.score ?? 0;
    const creation = traitByName['Advantage Creation']?.score ?? 0;
    const defense = traitByName['Defensive Versatility']?.score ?? 0;
    const processing = traitByName['Processing Speed']?.score ?? 0;
    if (creation >= 7.5 && shot <= 6.5) return 'Shooting Gravity';
    if (defense <= 6.0) return 'Defensive Versatility';
    if (processing <= 6.0) return 'Processing Speed';
    return sortedWeakTraits[0]?.name || 'Shooting Gravity';
  })();

  const topStrength = strengths[0]?.label || sortedTraits[0]?.name || 'trait strength';
  const topWeakness = weaknesses[0]?.label || sortedWeakTraits[0]?.name || 'the swing skill';
  const summarySentence = `A ${prospect.archetypeBase.toLowerCase()} profile with ${topStrength.toLowerCase()} as the clearest value driver, whose long-term ceiling will be shaped by whether ${topWeakness.toLowerCase()} stabilizes.`;

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 2),
    swingSkill: swingTrait,
    summarySentence,
    riskFlags,
  };
}

function buildModelBreakdown(prospect, traits, statPercentiles, interpretation) {
  const weightedTraitScore = Number((traits.reduce((sum, trait) => sum + trait.score, 0) / traits.length).toFixed(1));
  const riskPenalty = Number((interpretation.riskFlags.reduce((sum, flag) => {
    if (flag.severity === 'high') return sum + 0.9;
    if (flag.severity === 'moderate') return sum + 0.45;
    return sum + 0.15;
  }, 0)).toFixed(1));
  const finalBoardScore = Number((weightedTraitScore - riskPenalty + ((statPercentiles.bpm ?? 50) / 20)).toFixed(1));
  const modelTier = finalBoardScore >= 8.8 ? 'Tier 1 model' : finalBoardScore >= 8.1 ? 'Tier 2 model' : finalBoardScore >= 7.3 ? 'Tier 3 model' : finalBoardScore >= 6.6 ? 'Tier 4 model' : 'Tier 5 model';

  return {
    finalBoardScore,
    weightedTraitScore,
    riskPenalty,
    modelTier,
    boardRank: prospect.rank,
    coreTraitBars: traits.map((trait) => ({
      key: trait.name,
      label: trait.name,
      score: trait.score,
      width: `${Math.max(8, Math.min(100, trait.score * 10))}%`,
    })),
    riskPanel: interpretation.riskFlags,
    interpretationCard: {
      strengths: interpretation.strengths,
      weaknesses: interpretation.weaknesses,
      swingSkill: interpretation.swingSkill,
      summarySentence: interpretation.summarySentence,
    },
  };
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
  const sourceStatus = firstDefined(supplied.sourceStatus, '');
  const wingspanStatus = firstDefined(supplied.wingspanStatus, wingspan ? 'provided' : '');
  const measurementLine = `${height}${weight ? ` / ${weight} lb` : ''}${wingspan ? ` / ${wingspan} ws` : ''}`;

  return {
    value: {
      height,
      weight,
      wingspan,
      standingReach,
      sourceStatus,
      wingspanStatus,
      measurementLine,
    },
    isReal: !!prospect.measurements || hasText(height) || hasText(weight) || hasText(wingspan),
  };
}

function normalizeSources(prospect) {
  const pipelineStats = profileStats[prospect.id];
  const sources = [
    ...(Array.isArray(prospect.sources) ? prospect.sources : []),
    ...(Array.isArray(pipelineStats?.sources) ? pipelineStats.sources : []),
    ...buildFallbackSources(prospect, pipelineStats),
  ];
  return sources
    .filter((source) => hasText(source?.label) || hasText(source?.url))
    .map((source) => ({
      label: source.label || source.url,
      url: source.url || '',
      type: source.type || 'reference',
    }))
    .filter((source, index, collection) => {
      const key = `${source.label}|${source.url}|${source.type}`;
      return collection.findIndex((item) => `${item.label}|${item.url}|${item.type}` === key) === index;
    });
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
    const authoredOverride = {
      ...(measurementOverrides[prospect.id] || {}),
      ...(authoredProfilesTier3[prospect.id] || {}),
      ...(authoredProfilesTier4[prospect.id] || {}),
      ...(authoredProfilesTier5[prospect.id] || {}),
    };
    const sourceProspect = { ...prospect, ...authoredOverride };
    const pipelineStats = profileStats[prospect.id] || {};
    const measurements = normalizeMeasurements(sourceProspect);
    const age = firstDefined(sourceProspect.age, sourceProspect.bio?.age, estimatedAge(sourceProspect.classYear, sourceProspect.rank));
    const traitData = normalizeTraitScores(sourceProspect);
    const overallComposite = firstDefined(sourceProspect.overallComposite, sourceProspect.scores?.overallComposite, compositeScore(traitData.values));
    const offenseScore = firstDefined(
      sourceProspect.offenseScore,
      sourceProspect.scores?.offense,
      Math.round((traitData.values[0].score + traitData.values[2].score + traitData.values[3].score + traitData.values[4].score) / 4),
    );
    const defenseScore = firstDefined(
      sourceProspect.defenseScore,
      sourceProspect.scores?.defense,
      Math.round(traitData.values[7].score),
    );
    const summary = normalizeSummary(sourceProspect, traitData.values);
    const stats = normalizeStats(sourceProspect, offenseScore, defenseScore);
    const projection = normalizeProjection(sourceProspect, traitData.values, offenseScore, defenseScore);
    const roleProjection = firstDefined(sourceProspect.roleProjection, sourceProspect.scouting?.roleProjection, deriveRoleProjection(sourceProspect.position, sourceProspect.rank));
    const riskLevel = firstDefined(sourceProspect.riskLevel, sourceProspect.scouting?.riskLevel, deriveRiskLevel(sourceProspect.rank, sourceProspect.classYear));
    const sources = normalizeSources(sourceProspect);
    const autoInterpretation = buildAutoInterpretation(sourceProspect, traitData.values, pipelineStats.percentiles || {}, buildRiskFlags(sourceProspect, pipelineStats.percentiles || {}, traitData.values));
    const modelBreakdown = buildModelBreakdown(
      {
        ...sourceProspect,
        rank: sourceProspect.rank,
      },
      traitData.values,
      pipelineStats.percentiles || {},
      autoInterpretation,
    );

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
      ...sourceProspect,
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
      autoInterpretation,
      modelBreakdown,
      historicalPrecedents: [],
      historicalContext: null,
      historicalSignals: null,
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
