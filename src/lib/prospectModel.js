import { CORE_TRAITS } from './constants';
import measurementOverrides from '../data/measurementOverrides';
import sourceDirectories from '../data/sourceDirectories';

const TRAIT_TO_METRIC_KEYS = {
  'Advantage Creation': ['usage', 'boxCreation', 'rimPressureProxy'],
  'Advantage Conversion': ['trueShooting', 'rimPct', 'midPct', 'ftPct'],
  Playmaking: ['assistRate', 'assistToTurnover', 'assistUsageRatio'],
  'Processing & Feel': ['careCreationRatio', 'assistToTurnover', 'turnoverRate'],
  'Off-Ball Leverage': ['trueShooting', 'threePointRate', 'roleEfficiency'],
  'Shooting Pressure': ['threePointAttempts', 'threePct', 'ftPct'],
  Scalability: ['usageEfficiencyBalance', 'offBallLeverage', 'roleScalability'],
  'Defensive Range': ['stealRate', 'blockRate', 'physicalCoverage', 'defensiveImpact'],
};

const ARCHETYPE_RULES = [
  {
    match: (prospect) => prospect.position.includes('PG') || /lead guard|combo guard creator|shotmaking guard/i.test(prospect.archetypeBase),
    primary: (prospect) => ((prospect.traitScores?.find((trait) => trait.name === 'Advantage Creation')?.score ?? 0) >= 7.3 ? 'Primary Creator' : 'Secondary Creator'),
    sub: (prospect) => {
      if ((prospect.traitScores?.find((trait) => trait.name === 'Playmaking')?.score ?? 0) >= 7.4) return 'Table Setter';
      if ((prospect.traitScores?.find((trait) => trait.name === 'Advantage Creation')?.score ?? 0) >= 7.8) return 'Advantage Guard';
      return 'Scoring Specialist';
    },
  },
  {
    match: (prospect) => /two-way wing|scoring wing|hybrid forward/i.test(prospect.archetypeBase),
    primary: (prospect) => ((prospect.traitScores?.find((trait) => trait.name === 'Off-Ball Leverage')?.score ?? 0) >= 7.2 ? 'Connector' : 'Secondary Creator'),
    sub: (prospect) => {
      if ((prospect.traitScores?.find((trait) => trait.name === 'Shooting Pressure')?.score ?? 0) >= 7.6) return 'Movement Shooter';
      if ((prospect.traitScores?.find((trait) => trait.name === 'Advantage Creation')?.score ?? 0) >= 7.2) return 'Rim Pressure Wing';
      return 'Connector Forward';
    },
  },
  {
    match: (prospect) => /modern frontcourt big|interior anchor|play-finishing four/i.test(prospect.archetypeBase) || prospect.position.includes('C') || prospect.position.includes('PF'),
    primary: (prospect) => ((prospect.traitScores?.find((trait) => trait.name === 'Shooting Pressure')?.score ?? 0) >= 6.8 ? 'Stretch Big' : 'Play Finisher'),
    sub: (prospect) => {
      if ((prospect.traitScores?.find((trait) => trait.name === 'Defensive Range')?.score ?? 0) >= 7.4) return 'Switch Big';
      if ((prospect.traitScores?.find((trait) => trait.name === 'Playmaking')?.score ?? 0) >= 6.8) return 'Connector Forward';
      return 'Interior Finisher';
    },
  },
];

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
    creation: isLead ? 84 : isWing ? 72 : 56,
    conversion: isLead ? 75 : isWing ? 73 : 68,
    playmaking: isLead ? 81 : isWing ? 63 : 58,
    processing: isLead ? 79 : isWing ? 71 : 66,
    offBall: isWing ? 77 : isBig ? 64 : 67,
    shooting: isWing ? 76 : isLead ? 74 : 55,
    scalability: isWing ? 80 : isLead ? 68 : 61,
    defense: isBig ? 78 : isWing ? 74 : 61,
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

function formatPercent(value, digits = 1) {
  const normalized = normalizeMetricValue(value);
  if (!Number.isFinite(normalized)) return '--';
  return `${normalized.toFixed(digits)}%`;
}

function formatRate(value, digits = 1) {
  const normalized = normalizeMetricValue(value);
  return Number.isFinite(normalized) ? normalized.toFixed(digits) : '--';
}

function safeNumber(value, fallback = null) {
  const normalized = normalizeMetricValue(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function seasonBaseline(current, previous, digits = 1) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return '--';
  const delta = current - previous;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(digits)}`;
}

function percentileChip(percentiles, key) {
  const value = percentiles[key];
  return Number.isFinite(value) ? `${value}th pct` : 'untracked';
}

function deriveArchetypeLabels(prospect, traits) {
  const enriched = { ...prospect, traitScores: traits };
  const rule = ARCHETYPE_RULES.find((entry) => entry.match(enriched));
  const primaryArchetype = rule ? rule.primary(enriched) : 'Connector';
  const subArchetype = rule ? rule.sub(enriched) : 'Connector Forward';

  return { primaryArchetype, subArchetype };
}

function buildRiskFlags(prospect, statPercentiles, traits) {
  const flags = [];
  const shootingTrait = traits.find((trait) => trait.name === 'Shooting Pressure')?.score ?? 0;
  const processingTrait = traits.find((trait) => trait.name === 'Processing & Feel')?.score ?? 0;
  const creationTrait = traits.find((trait) => trait.name === 'Advantage Creation')?.score ?? 0;
  const conversionTrait = traits.find((trait) => trait.name === 'Advantage Conversion')?.score ?? 0;
  const defenseTrait = traits.find((trait) => trait.name === 'Defensive Range')?.score ?? 0;
  const scalabilityTrait = traits.find((trait) => trait.name === 'Scalability')?.score ?? 0;
  const age = Number(prospect.age);

  if (shootingTrait <= 5.5 || (statPercentiles.threePct ?? 50) <= 40 || (statPercentiles.trueShooting ?? 50) <= 40) {
    flags.push({ key: 'shooting_risk', label: 'Shooting pressure risk', severity: shootingTrait <= 4.5 ? 'high' : 'moderate' });
  }
  if (creationTrait <= 5.5 && prospect.position.includes('PG')) {
    flags.push({ key: 'creation_translation_risk', label: 'Creation translation risk', severity: 'moderate' });
  }
  if (conversionTrait <= 5.5 && (statPercentiles.trueShooting ?? 50) <= 40) {
    flags.push({ key: 'conversion_risk', label: 'Conversion risk', severity: conversionTrait <= 4.5 ? 'high' : 'moderate' });
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
  if ((traitByName['Advantage Conversion']?.score ?? 0) >= 7.5 && (statPercentiles.trueShooting ?? 0) >= 70) {
    pushStrength('Advantage Converter', 'finishes possessions efficiently once the defense is tilted');
  }
  if ((traitByName['Shooting Pressure']?.score ?? 0) >= 7.5 && ((statPercentiles.threePct ?? 0) >= 65 || (statPercentiles.trueShooting ?? 0) >= 65)) {
    pushStrength('Warps Spacing', 'forces attention with real shotmaking pressure');
  }
  if ((traitByName['Processing & Feel']?.score ?? 0) >= 7.5) {
    pushStrength('Fast Processor', 'sees the next action early and keeps possessions moving');
  }
  if ((traitByName['Off-Ball Leverage']?.score ?? 0) >= 7.5) {
    pushStrength('Connector Value', 'adds utility without needing every possession');
  }
  if ((traitByName['Defensive Range']?.score ?? 0) >= 7.5 && (statPercentiles.blocksPerGame ?? statPercentiles.stealsPerGame ?? 0) >= 65) {
    pushStrength('Switchable Coverage', 'holds value across multiple matchups and actions');
  }
  if ((traitByName.Playmaking?.score ?? 0) >= 7.5 && (statPercentiles.assistsPerGame ?? 0) >= 65) {
    pushStrength('Table Setter', 'keeps teammates involved and organizes possessions');
  }

  if ((traitByName['Shooting Pressure']?.score ?? 10) <= 5.5 && ((statPercentiles.threePct ?? 100) <= 40 || (statPercentiles.trueShooting ?? 100) <= 40)) {
    pushWeakness('Low-Gravity Shooter', 'the jumper still leaves defenders room to cheat');
  }
  if ((traitByName['Defensive Range']?.score ?? 10) <= 5.5) {
    pushWeakness('Defensive Role Question', 'the defensive coverage band is still more theoretical than stable');
  }
  if ((traitByName['Processing & Feel']?.score ?? 10) <= 5.5) {
    pushWeakness('Read-Speed Concern', 'possession speed and reads still lag the role ask');
  }
  if ((traitByName['Scalability']?.score ?? 10) <= 5.5) {
    pushWeakness('Role-Dependent Profile', 'the pathway narrows if primary-usage conditions disappear');
  }
  if ((traitByName.Playmaking?.score ?? 10) <= 5.5 && prospect.position.includes('PG')) {
    pushWeakness('Table-Setting Concern', 'lead guard touches do not yet create enough for others');
  }

  const sortedTraits = [...traits].sort((left, right) => right.score - left.score);
  const sortedWeakTraits = [...traits].sort((left, right) => left.score - right.score);
  const swingTrait = (() => {
    const shot = traitByName['Shooting Pressure']?.score ?? 0;
    const creation = traitByName['Advantage Creation']?.score ?? 0;
    const conversion = traitByName['Advantage Conversion']?.score ?? 0;
    const defense = traitByName['Defensive Range']?.score ?? 0;
    const processing = traitByName['Processing & Feel']?.score ?? 0;
    if (creation >= 7.5 && shot <= 6.5) return 'Shooting Pressure';
    if (creation >= 7.3 && conversion <= 6.4) return 'Advantage Conversion';
    if (defense <= 6.0) return 'Defensive Range';
    if (processing <= 6.0) return 'Processing & Feel';
    return sortedWeakTraits[0]?.name || 'Shooting Pressure';
  })();

  const topStrength = strengths[0]?.label || sortedTraits[0]?.name || 'trait strength';
  const topWeakness = weaknesses[0]?.label || sortedWeakTraits[0]?.name || 'the swing skill';
  const summarySentence = `${prospect.subArchetype || prospect.archetype} profile with ${topStrength.toLowerCase()} as the clearest value driver, but the outcome band still turns on whether ${topWeakness.toLowerCase()} stabilizes.`;
  const whyRankedHere = `Ranked here because ${topStrength.toLowerCase()} and ${sortedTraits[1]?.name?.toLowerCase() || 'secondary support'} keep the starter path alive, but ${topWeakness.toLowerCase()} still narrows the cleanest outcome band.`;

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 2),
    swingSkill: swingTrait,
    summarySentence,
    whyRankedHere,
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
      whyRankedHere: interpretation.whyRankedHere,
    },
  };
}

function deriveTraitScores(prospect) {
  const base = positionTraits(prospect.position);
  const rankLift = clamp(18 - Math.floor(prospect.rank / 6), -8, 14);
  const movementLift = clamp((parseInt(prospect.movement, 10) || 0) / 2, -8, 8);

  const values = [
    ['Advantage Creation', clamp(base.creation + rankLift + movementLift, 45, 96)],
    ['Advantage Conversion', clamp(base.conversion + rankLift / 2, 45, 95)],
    ['Playmaking', clamp(base.playmaking + movementLift / 1.4, 40, 94)],
    ['Processing & Feel', clamp(base.processing + rankLift / 1.7, 45, 95)],
    ['Off-Ball Leverage', clamp(base.offBall + rankLift / 2, 45, 94)],
    ['Shooting Pressure', clamp(base.shooting + rankLift / 2, 40, 95)],
    ['Scalability', clamp(base.scalability + rankLift / 1.8, 45, 95)],
    ['Defensive Range', clamp(base.defense + rankLift / 2, 42, 95)],
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
  const derivedByName = Object.fromEntries(derivedTraits.map((trait) => [trait.name, trait]));
  const oldTraitAliases = {
    'Advantage Creation': ['Advantage Creation'],
    'Advantage Conversion': ['Advantage Conversion', 'Decision Making'],
    Playmaking: ['Playmaking', 'Passing Creation'],
    'Processing & Feel': ['Processing & Feel', 'Processing Speed', 'Decision Making'],
    'Off-Ball Leverage': ['Off-Ball Leverage', 'Off-Ball Value'],
    'Shooting Pressure': ['Shooting Pressure', 'Shooting Gravity'],
    Scalability: ['Scalability'],
    'Defensive Range': ['Defensive Range', 'Defensive Versatility'],
  };

  const getSuppliedTraits = (name) => {
    const aliases = oldTraitAliases[name] || [name];
    return aliases
      .map((alias) => byName[alias])
      .filter(Boolean);
  };

  const mergeSuppliedTraits = (name) => {
    const matches = getSuppliedTraits(name);
    if (matches.length === 0) return null;

    const numericScores = matches
      .map((trait) => normalizeMetricValue(trait.score))
      .filter((value) => Number.isFinite(value));
    const score = numericScores.length
      ? Number((numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length).toFixed(1))
      : null;

    return {
      score,
      band: matches.map((trait) => trait.band || trait.percentile).find(Boolean) || null,
      confidence: matches.map((trait) => trait.confidence).find(Boolean) || null,
      note: matches.map((trait) => trait.note).find(Boolean) || null,
    };
  };

  const normalized = CORE_TRAITS.map((name) => {
    const supplied = mergeSuppliedTraits(name);
    const fallback = derivedByName[name];
    const score = firstDefined(supplied?.score, fallback?.score, 0);

    return {
      name,
      score,
      band: firstDefined(supplied?.band, fallback?.band, percentileBand(score)),
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

function normalizeStats(prospect, offenseScore, defenseScore, profileStats = {}) {
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
    swingSkill: topTrait.name === 'Defensive Range' ? 'Shooting Pressure' : 'Defensive Range',
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

function normalizeMeasurements(prospect, currentMeasurements = {}) {
  const importedMeasurement = currentMeasurements[prospect.id];
  const supplied = prospect.measurements || {};
  const imported = importedMeasurement?.measurements || {};
  const height = firstDefined(supplied.height, imported.heightInches ? `${Math.floor(imported.heightInches / 12)}-${imported.heightInches % 12}` : null, prospect.height, '--');
  const weight = firstDefined(supplied.weight, imported.weightLbs, prospect.weight, '');
  const wingspan = firstDefined(supplied.wingspan, imported.wingspanInches ? `${Math.floor(imported.wingspanInches / 12)}-${imported.wingspanInches % 12}` : null, prospect.wingspan, '');
  const standingReach = firstDefined(supplied.standingReach, imported.standingReachInches ? `${Math.floor(imported.standingReachInches / 12)}-${imported.standingReachInches % 12}` : null, prospect.standingReach, '');
  const sourceStatus = firstDefined(
    supplied.sourceStatus,
    importedMeasurement?.coverage?.measurementStatus,
    '',
  );
  const wingspanStatus = firstDefined(
    supplied.wingspanStatus,
    importedMeasurement?.coverage?.wingspanStatus,
    wingspan ? 'provided' : '',
  );
  const sourceName = firstDefined(importedMeasurement?.source?.name, supplied.sourceName, '');
  const sourceLastUpdated = firstDefined(importedMeasurement?.source?.lastUpdated, supplied.sourceLastUpdated, '');
  const measurementLine = `${height}${weight ? ` / ${weight} lb` : ''}${wingspan ? ` / ${wingspan} ws` : ''}`;

  return {
    value: {
      height,
      weight,
      wingspan,
      standingReach,
      sourceStatus,
      wingspanStatus,
      sourceName,
      sourceLastUpdated,
      measurementLine,
    },
    isReal: !!prospect.measurements || !!importedMeasurement || hasText(height) || hasText(weight) || hasText(wingspan),
  };
}

function normalizeSources(prospect, profileStats = {}) {
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

function buildSignalGroups(prospect, stats, statPercentiles = {}) {
  const season = stats?.season || {};
  const advanced = stats?.advanced || {};
  const overallComposite = safeNumber(prospect.overallComposite, 0);
  const reboundsPerGame = safeNumber(season.rebounds, 0);
  const assistRate = safeNumber(advanced.assistRate, 0);
  const turnoverRate = safeNumber(advanced.turnoverRate, 0);
  const usage = safeNumber(advanced.usage, 0);
  const threePct = safeNumber(advanced.threePct, 0);
  const ftPct = safeNumber(advanced.ftPct, 0);
  const trueShooting = safeNumber(advanced.trueShooting, 0);
  const efgPct = safeNumber(advanced.efgPct, 0);
  const bpm = safeNumber(advanced.bpm, 0);
  const ortg = safeNumber(advanced.ortg, 0);
  const drtg = safeNumber(advanced.drtg, 0);
  const reboundsRate = safeNumber(advanced.reboundRate, 0);
  const threePointRate = clamp((safeNumber(advanced.threePct, 0) * 0.55) + 18, 16, 56);
  const boxCreation = clamp((safeNumber(season.assists, 0) * 3.1) + (usage * 0.35), 4, 18);
  const rimPressureProxy = clamp((safeNumber(season.points, 0) * 0.9) + (usage * 0.22) - (threePct * 0.12), 6, 26);
  const foulDrawing = clamp((ftPct * 0.16) + (usage * 0.18), 6, 20);
  const assistToTurnover = turnoverRate > 0 ? assistRate / turnoverRate : assistRate / 6;
  const careCreationRatio = turnoverRate > 0 ? (assistRate * 0.9) / turnoverRate : assistRate / 7;
  const assistUsageRatio = usage > 0 ? assistRate / usage : 0;
  const stocks = Number((safeNumber(season.steals, 0) + safeNumber(season.blocks, 0)).toFixed(1));
  const fouls = Number((2.2 + Math.max(0, 8 - (prospect.defenseScore || 6)) * 0.18).toFixed(1));
  const orbRate = clamp(reboundsRate * 0.36, 2, 16);
  const drbRate = clamp(reboundsRate * 0.64, 4, 24);
  const rimPct = clamp(trueShooting + 6, 44, 74);
  const midPct = clamp((trueShooting * 0.72) + 7, 30, 54);
  const threePointAttempts = clamp((usage * 0.22) + (threePointRate * 0.06), 1.2, 9.5);
  const ws40 = Number(clamp((bpm / 40) + 0.12, 0.02, 0.34).toFixed(3));
  const onOff = Number(clamp((ortg - drtg) / 2.8, -9, 18).toFixed(1));
  const per = Number(clamp(12 + (bpm * 0.9), 8, 33).toFixed(1));
  const obpm = Number((bpm * 0.62).toFixed(1));
  const dbpm = Number((bpm * 0.38).toFixed(1));
  const trajectoryChange = movementValue(prospect.movement);
  const efficiencyChange = Number((trajectoryChange * 0.18).toFixed(1));
  const usageChange = Number((trajectoryChange * 0.12).toFixed(1));
  const vertical = prospect.measurements?.vertical || '--';
  const agility = prospect.measurements?.agility || '--';

  return [
    {
      key: 'core-overview',
      label: 'Core Overview',
      items: [
        { label: 'Games', value: season.games ?? '--' },
        { label: 'MPG', value: season.minutes ?? '--' },
        { key: 'pointsPerGame', label: 'PPG', value: season.points ?? '--', percentile: percentileChip(statPercentiles, 'pointsPerGame') },
        { key: 'reboundsPerGame', label: 'RPG', value: season.rebounds ?? '--', percentile: percentileChip(statPercentiles, 'reboundsPerGame') },
        { key: 'assistsPerGame', label: 'APG', value: season.assists ?? '--', percentile: percentileChip(statPercentiles, 'assistsPerGame') },
        { label: 'SPG', value: season.steals ?? '--', percentile: percentileChip(statPercentiles, 'stealsPerGame') },
        { label: 'BPG', value: season.blocks ?? '--', percentile: percentileChip(statPercentiles, 'blocksPerGame') },
        { label: 'TOPG', value: season.turnovers ?? '--', percentile: percentileChip(statPercentiles, 'turnoversPerGame') },
        { key: 'trueShooting', label: 'TS%', value: advanced.trueShooting || '--', percentile: percentileChip(statPercentiles, 'trueShooting') },
        { key: 'efgPct', label: 'eFG%', value: advanced.efgPct || '--' },
        { key: 'rimPct', label: '2P%', value: formatPercent(rimPct, 1) },
        { key: 'threePct', label: '3P%', value: formatPercent(threePct * 100, 1), percentile: percentileChip(statPercentiles, 'threePct') },
        { key: 'ftPct', label: 'FT%', value: formatPercent(ftPct * 100, 1) },
      ],
    },
    {
      key: 'pressure-creation',
      label: 'Pressure Creation',
      items: [
        { key: 'usage', label: 'Usage', value: advanced.usage || '--', percentile: percentileChip(statPercentiles, 'usage') },
        { key: 'boxCreation', label: 'Box Creation', value: formatRate(boxCreation, 1) },
        { key: 'rimPressureProxy', label: 'Rim Pressure Proxy', value: formatRate(rimPressureProxy, 1) },
        { key: 'foulDrawing', label: 'Foul Drawing', value: formatRate(foulDrawing, 1) },
      ],
    },
    {
      key: 'scoring-efficiency',
      label: 'Scoring Efficiency',
      items: [
        { key: 'trueShooting', label: 'TS%', value: advanced.trueShooting || '--', percentile: percentileChip(statPercentiles, 'trueShooting') },
        { key: 'efgPct', label: 'eFG%', value: advanced.efgPct || '--' },
        { key: 'rimPct', label: 'Rim%', value: formatPercent(rimPct, 1) },
        { key: 'midPct', label: 'Mid%', value: formatPercent(midPct, 1) },
        { key: 'threePct', label: '3P%', value: formatPercent(threePct * 100, 1), percentile: percentileChip(statPercentiles, 'threePct') },
        { key: 'ftPct', label: 'FT%', value: formatPercent(ftPct * 100, 1) },
      ],
    },
    {
      key: 'playmaking-control',
      label: 'Playmaking Control',
      items: [
        { key: 'assistRate', label: 'AST%', value: advanced.assistRate || '--' },
        { key: 'assistToTurnover', label: 'AST/TO', value: formatRate(assistToTurnover, 2) },
        { key: 'careCreationRatio', label: 'CTOV%', value: formatRate(careCreationRatio * 10, 1) },
        { key: 'assistUsageRatio', label: 'AST/USG', value: formatRate(assistUsageRatio, 2) },
      ],
    },
    {
      key: 'spacing-impact',
      label: 'Spacing Impact',
      items: [
        { key: 'threePointAttempts', label: '3PA', value: formatRate(threePointAttempts, 1) },
        { key: 'threePointRate', label: '3PR', value: formatPercent(threePointRate, 1) },
        { key: 'ftPct', label: 'FT%', value: formatPercent(ftPct * 100, 1) },
        { label: 'C&S Proxy', value: prospect.leagueType === 'NCAA' ? 'Tracked later' : '--' },
      ],
    },
    {
      key: 'defensive-disruption',
      label: 'Defensive Disruption',
      items: [
        { key: 'stealRate', label: 'STL%', value: formatPercent((safeNumber(season.steals, 0) * 2.1) + 0.8, 1) },
        { key: 'blockRate', label: 'BLK%', value: formatPercent((safeNumber(season.blocks, 0) * 2.4) + 0.5, 1) },
        { key: 'stocks', label: 'Stocks', value: stocks },
        { label: 'Fouls', value: fouls },
      ],
    },
    {
      key: 'possession-value',
      label: 'Possession Value',
      items: [
        { key: 'turnoverRate', label: 'TOV%', value: advanced.turnoverRate || '--' },
        { key: 'orbRate', label: 'ORB%', value: formatPercent(orbRate, 1) },
        { key: 'drbRate', label: 'DRB%', value: formatPercent(drbRate, 1) },
        { key: 'reboundRate', label: 'Rebound Rate', value: advanced.reboundRate || '--', percentile: percentileChip(statPercentiles, 'reboundRate') },
      ],
    },
    {
      key: 'physical-translation',
      label: 'Physical Translation',
      items: [
        { key: 'height', label: 'Height', value: prospect.height || '--' },
        { key: 'weight', label: 'Weight', value: prospect.weight ? `${prospect.weight} lb` : '--' },
        { key: 'physicalCoverage', label: 'Wingspan', value: prospect.wingspan || '--' },
        { label: 'Standing Reach', value: prospect.standingReach || '--' },
        { label: 'Vertical', value: vertical },
        { label: 'Agility', value: agility },
        { label: 'Verified', value: prospect.measurements?.sourceStatus || '--' },
      ],
    },
    {
      key: 'impact-signals',
      label: 'Impact Signals',
      items: [
        { key: 'bpm', label: 'BPM', value: bpm, percentile: percentileChip(statPercentiles, 'bpm') },
        { key: 'obpm', label: 'OBPM', value: obpm },
        { key: 'dbpm', label: 'DBPM', value: dbpm },
        { key: 'ws40', label: 'WS/40', value: ws40 },
        { key: 'onOff', label: 'On/Off', value: onOff },
        { key: 'per', label: 'PER', value: per },
      ],
    },
    {
      key: 'trajectory',
      label: 'Trajectory',
      items: [
        { label: 'YoY Growth', value: seasonBaseline(overallComposite, overallComposite - trajectoryChange / 3, 1) },
        { label: 'Usage Change', value: seasonBaseline(usage, usage - usageChange, 1) },
        { label: 'Efficiency Change', value: seasonBaseline(trueShooting, trueShooting - efficiencyChange, 1) },
        { label: 'Trend', value: trajectoryChange >= 8 ? 'Improvement' : trajectoryChange <= -8 ? 'Decline' : 'Stagnation' },
      ],
    },
  ];
}

function buildTraitEvidence(traits, signalGroups) {
  const metricLookup = Object.fromEntries(
    signalGroups.flatMap((group) => group.items.map((item) => [item.key || item.label, item])),
  );

  return Object.fromEntries(traits.map((trait) => {
    const metricKeys = TRAIT_TO_METRIC_KEYS[trait.name] || [];
    const mappedMetrics = metricKeys.map((key) => metricLookup[key]).filter(Boolean);
    const strongest = mappedMetrics.slice(0, 2).map((item) => `${item.label} ${item.value}`).join(' · ') || 'Awaiting stronger signal support';
    const weakest = mappedMetrics.slice(-2).map((item) => `${item.label} ${item.value}`).join(' · ') || 'No weak evidence flagged';
    const confidence = trait.confidence || 'Medium';

    return [trait.name, {
      strongest,
      weakest,
      confidence,
      metrics: mappedMetrics,
    }];
  }));
}

function buildLightweightProspect(prospect, options = {}) {
  const currentMeasurements = options.currentMeasurements || {};
  const measurements = normalizeMeasurements(prospect, currentMeasurements);
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
  const stats = normalizeStats(prospect, offenseScore, defenseScore, {});
  const projection = normalizeProjection(prospect, traitData.values, offenseScore, defenseScore);
  const roleProjection = firstDefined(prospect.roleProjection, prospect.scouting?.roleProjection, deriveRoleProjection(prospect.position, prospect.rank));
  const riskLevel = firstDefined(prospect.riskLevel, prospect.scouting?.riskLevel, deriveRiskLevel(prospect.rank, prospect.classYear));
  const archetypeLabels = deriveArchetypeLabels(prospect, traitData.values);
  const riskFlags = buildRiskFlags({ ...prospect, age, riskLevel }, {}, traitData.values);
  const autoInterpretation = buildAutoInterpretation({ ...prospect, age, riskLevel, ...archetypeLabels }, traitData.values, {}, riskFlags);
  const modelBreakdown = buildModelBreakdown(
    { ...prospect, rank: prospect.rank, ...archetypeLabels },
    traitData.values,
    {},
    autoInterpretation,
  );
  const signalGroups = buildSignalGroups({
    ...prospect,
    ...archetypeLabels,
    measurements: measurements.value,
    height: measurements.value.height,
    weight: measurements.value.weight,
    wingspan: measurements.value.wingspan,
    standingReach: measurements.value.standingReach,
    offenseScore,
    defenseScore,
  }, stats.value, {});
  const traitEvidence = buildTraitEvidence(traitData.values, signalGroups);

  return {
    ...prospect,
    archetype: archetypeLabels.primaryArchetype,
    subArchetype: archetypeLabels.subArchetype,
    height: measurements.value.height,
    weight: measurements.value.weight,
    wingspan: measurements.value.wingspan,
    standingReach: measurements.value.standingReach,
    measurements: measurements.value,
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
    statCards: [],
    statPercentiles: {},
    statStrengths: [],
    statWeaknesses: [],
    archetypeIndicators: [],
    comparisonInputs: {},
    autoInterpretation,
    modelBreakdown,
    signalGroups,
    traitEvidence,
    historicalPrecedents: [],
    historicalContext: null,
    historicalSignals: null,
    profileSections: ['Overview', 'Model', 'Stats', 'Comps', 'Notes'],
    sources: [],
    dataQuality: {
      profile: measurements.isReal || traitData.isReal || summary.isReal || projection.isReal ? 'Mixed' : 'Derived',
      traits: sourceLabel(traitData.isReal),
      summary: sourceLabel(summary.isReal),
      stats: 'Deferred',
      projection: sourceLabel(projection.isReal),
    },
  };
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
export function enrichBoardProspects(prospects, options = {}) {
  return prospects.map((prospect) => buildLightweightProspect(prospect, options));
}

export function enrichProspectDetail(prospect, options = {}) {
  if (!prospect) return null;

  const currentMeasurements = options.currentMeasurements || {};
  const profileStats = options.profileStats || {};
  const authoredProfiles = options.authoredProfiles || {};
  const authoredOverride = {
    ...(measurementOverrides[prospect.id] || {}),
    ...(authoredProfiles[prospect.id] || {}),
  };
  const sourceProspect = { ...prospect, ...authoredOverride };
  const pipelineStats = profileStats[prospect.id] || {};
  const measurements = normalizeMeasurements(sourceProspect, currentMeasurements);
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
  const stats = normalizeStats(sourceProspect, offenseScore, defenseScore, profileStats);
  const projection = normalizeProjection(sourceProspect, traitData.values, offenseScore, defenseScore);
  const roleProjection = firstDefined(sourceProspect.roleProjection, sourceProspect.scouting?.roleProjection, deriveRoleProjection(sourceProspect.position, sourceProspect.rank));
  const riskLevel = firstDefined(sourceProspect.riskLevel, sourceProspect.scouting?.riskLevel, deriveRiskLevel(sourceProspect.rank, sourceProspect.classYear));
  const archetypeLabels = deriveArchetypeLabels(sourceProspect, traitData.values);
  const sources = normalizeSources(sourceProspect, profileStats);
  const riskFlags = buildRiskFlags({ ...sourceProspect, age, riskLevel }, pipelineStats.percentiles || {}, traitData.values);
  const autoInterpretation = buildAutoInterpretation({ ...sourceProspect, age, riskLevel, ...archetypeLabels }, traitData.values, pipelineStats.percentiles || {}, riskFlags);
  const modelBreakdown = buildModelBreakdown(
    {
      ...sourceProspect,
      rank: sourceProspect.rank,
      ...archetypeLabels,
    },
    traitData.values,
    pipelineStats.percentiles || {},
    autoInterpretation,
  );
  const signalGroups = buildSignalGroups({
    ...sourceProspect,
    ...archetypeLabels,
    measurements: measurements.value,
    height: measurements.value.height,
    weight: measurements.value.weight,
    wingspan: measurements.value.wingspan,
    standingReach: measurements.value.standingReach,
    offenseScore,
    defenseScore,
  }, stats.value, pipelineStats.percentiles || {});
  const traitEvidence = buildTraitEvidence(traitData.values, signalGroups);

  const realFieldCount = [
    measurements.isReal,
    traitData.isReal,
    summary.isReal,
    stats.isReal,
    projection.isReal,
    hasText(sourceProspect.age) || hasText(sourceProspect.bio?.age),
    hasText(sourceProspect.roleProjection) || hasText(sourceProspect.scouting?.roleProjection),
    hasText(sourceProspect.riskLevel) || hasText(sourceProspect.scouting?.riskLevel),
    sources.length > 0,
  ].filter(Boolean).length;

  return {
    ...sourceProspect,
    archetype: archetypeLabels.primaryArchetype,
    subArchetype: archetypeLabels.subArchetype,
    height: measurements.value.height,
    weight: measurements.value.weight,
    wingspan: measurements.value.wingspan,
    standingReach: measurements.value.standingReach,
    measurements: measurements.value,
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
    signalGroups,
    traitEvidence,
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
