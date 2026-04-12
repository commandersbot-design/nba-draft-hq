import historicalProspects from '../data/historicalProspects.json';
import historicalDerived from '../data/historicalDerived.json';

export function positionFamily(position) {
  if (String(position).includes('PG')) return 'guard';
  if (String(position).includes('SF') || String(position).includes('SG')) return 'wing';
  return 'big';
}

export function draftSlotBand(draftSlot) {
  const slot = safeNumber(draftSlot);
  if (slot <= 3) return 'Top 3';
  if (slot <= 8) return 'Top 8';
  if (slot <= 14) return 'Lottery';
  if (slot <= 30) return 'First Round';
  return 'Later Round';
}

export function outcomeScore(outcomeTier) {
  switch (outcomeTier) {
    case 'Outlier':
      return 4;
    case 'Hit':
      return 3;
    case 'Swing':
      return 2;
    default:
      return 1;
  }
}

function archetypeFamily(archetype = '') {
  const label = archetype.toLowerCase();
  if (label.includes('wing')) return 'Wing';
  if (label.includes('big') || label.includes('paint') || label.includes('coverage')) return 'Big';
  if (label.includes('guard') || label.includes('pilot') || label.includes('creator') || label.includes('mechanic')) return 'Guard';
  return 'Hybrid';
}

function numericTs(value) {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value || '').replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function precedentScore(prospect, historical) {
  const archetypeMatch = prospect.archetype === historical.archetype ? 18 : 0;
  const roleMatch = prospect.roleProjection.toLowerCase().includes(historical.roleOutcome.toLowerCase().split(' ')[0]) ? 10 : 0;
  const positionPenalty = positionFamily(prospect.position) === positionFamily(historical.position) ? 0 : 16;
  const scoreDelta = Math.abs(safeNumber(prospect.overallComposite) - (safeNumber(historical.bpm) * 8));
  const ageDelta = Math.abs(safeNumber(prospect.age) - safeNumber(historical.age)) * 4;
  const pointsDelta = Math.abs(safeNumber(prospect.stats?.season?.points) - safeNumber(historical.pointsPerGame)) * 1.6;
  const tsDelta = Math.abs(numericTs(prospect.stats?.advanced?.trueShooting) - numericTs(historical.trueShooting)) * 0.7;

  return archetypeMatch + roleMatch - positionPenalty - scoreDelta - ageDelta - pointsDelta - tsDelta;
}

export function findHistoricalPrecedents(prospect, limit = 3) {
  return buildHistoricalDataset()
    .map((entry) => ({
      ...entry,
      matchScore: Number(precedentScore(prospect, entry).toFixed(1)),
    }))
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, limit);
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildOutcomeMix(entries) {
  const counts = entries.reduce((accumulator, entry) => {
    accumulator[entry.outcomeTier] = (accumulator[entry.outcomeTier] || 0) + 1;
    return accumulator;
  }, {});

  return ['Outlier', 'Hit', 'Swing', 'Miss']
    .filter((tier) => counts[tier])
    .map((tier) => ({
      tier,
      count: counts[tier],
      share: `${Math.round((counts[tier] / entries.length) * 100)}%`,
    }));
}

function buildContextNarrative({ archetypeMatches, slotBandMatches, familyMatches }) {
  const bestArchetypeOutcome = average(archetypeMatches.map((entry) => outcomeScore(entry.outcomeTier)));
  const bestSlotOutcome = average(slotBandMatches.map((entry) => outcomeScore(entry.outcomeTier)));
  const bestFamilyOutcome = average(familyMatches.map((entry) => outcomeScore(entry.outcomeTier)));

  if (bestArchetypeOutcome >= 3) {
    return 'Closest archetype matches have mostly landed on strong NBA outcomes.';
  }

  if (bestSlotOutcome >= 3) {
    return 'Draft-slot peers have produced solid historical outcomes, even if stylistic matches are mixed.';
  }

  if (bestFamilyOutcome >= 2.5) {
    return 'Position-family history is workable, but the precedent pool still looks more volatile than clean.';
  }

  return 'Historical context is mixed, which puts more weight on your live evaluation and role conviction.';
}

export function buildHistoricalContext(prospect, precedentLimit = 4) {
  const dataset = buildHistoricalDataset();
  const precedents = findHistoricalPrecedents(prospect, precedentLimit);
  const family = positionFamily(prospect.position);
  const slotBand = draftSlotBand(prospect.rank);
  const archetypeMatches = dataset.filter((entry) => entry.archetype === prospect.archetype);
  const slotBandMatches = dataset.filter((entry) => entry.draftSlotBand === slotBand);
  const familyMatches = dataset.filter((entry) => entry.positionFamily === family);
  const comparablePool = precedents.length > 0 ? precedents : familyMatches.slice(0, precedentLimit);
  const outcomeMix = buildOutcomeMix(comparablePool);
  const averageBpm = average(comparablePool.map((entry) => safeNumber(entry.bpm)));
  const averageTs = average(comparablePool.map((entry) => numericTs(entry.trueShooting)));
  const bestOutcome = [...comparablePool].sort((left, right) => outcomeScore(right.outcomeTier) - outcomeScore(left.outcomeTier))[0];
  const riskSignal = outcomeMix.find((entry) => entry.tier === 'Swing' || entry.tier === 'Miss');

  return {
    positionFamily: family,
    draftSlotBand: slotBand,
    archetypeFamily: archetypeFamily(prospect.archetype),
    comparablePoolSize: comparablePool.length,
    archetypeMatchCount: archetypeMatches.length,
    slotBandMatchCount: slotBandMatches.length,
    familyMatchCount: familyMatches.length,
    outcomeMix,
    averageBpm: comparablePool.length ? averageBpm.toFixed(1) : '--',
    averageTrueShooting: comparablePool.length ? `${averageTs.toFixed(1)}%` : '--',
    bestHistoricalOutcome: bestOutcome
      ? `${bestOutcome.name} (${bestOutcome.draftYear}, ${bestOutcome.outcomeTier})`
      : 'No strong historical anchor yet',
    riskSignal: riskSignal
      ? `${riskSignal.share} of the closest pool landed in volatile outcomes.`
      : 'Closest pool has leaned toward more stable outcomes.',
    narrative: buildContextNarrative({ archetypeMatches, slotBandMatches, familyMatches }),
    slotBandOutcomes: buildOutcomeMix(slotBandMatches),
    archetypeOutcomes: buildOutcomeMix(archetypeMatches),
  };
}

export function buildHistoricalSignals(historicalPrecedents, historicalContext) {
  const topPrecedent = historicalPrecedents[0] || null;
  const topComparableTier = topPrecedent?.historicalOutcomeLabel || topPrecedent?.outcomeTier || null;
  const topComparableFamily = topPrecedent?.archetypeFamily || topPrecedent?.comparisonInputs?.archetype_family || null;
  const outcomeMix = Array.isArray(historicalContext?.outcomeMix) ? historicalContext.outcomeMix : [];
  const topOutcomeShare = outcomeMix[0] ? `${outcomeMix[0].tier} ${outcomeMix[0].share}` : '--';
  const stableShare = outcomeMix
    .filter((entry) => entry.tier === 'Outlier' || entry.tier === 'Hit' || entry.tier === 'Tier 1 outcome' || entry.tier === 'Tier 2 outcome' || entry.tier === 'Tier 3 outcome')
    .reduce((total, entry) => total + Number.parseInt(entry.share, 10), 0);
  const volatileShare = outcomeMix
    .filter((entry) => entry.tier === 'Swing' || entry.tier === 'Miss' || entry.tier === 'Tier 4 outcome' || entry.tier === 'Tier 5 outcome')
    .reduce((total, entry) => total + Number.parseInt(entry.share, 10), 0);
  const signal = stableShare >= 60 ? 'stable' : volatileShare >= 45 ? 'volatile' : 'mixed';

  return {
    topComparableTier,
    topComparableFamily,
    topComparableName: topPrecedent?.name || null,
    topOutcomeShare,
    stableShare,
    volatileShare,
    signal,
    summary: topPrecedent
      ? `${topPrecedent.name} anchors the closest precedent lane, with the pool leaning ${signal} overall.`
      : historicalContext?.narrative || 'Historical context is still shallow.',
  };
}

export function buildHistoricalDataset() {
  return historicalProspects.map((entry) => ({
    ...entry,
    derived: historicalDerived[entry.id] || null,
    positionFamily: entry.positionFamily || positionFamily(entry.position),
    draftSlotBand: entry.draftSlotBand || draftSlotBand(entry.draftSlot),
    archetypeFamily: historicalDerived[entry.id]?.archetypeInputs?.family || entry.archetypeFamily || archetypeFamily(entry.archetype),
    outcomeScore: historicalDerived[entry.id]?.outcomeLabel?.score || entry.outcomeScore || outcomeScore(entry.outcomeTier),
    eraBucket: entry.eraBucket || 'Unknown',
    percentiles: {
      ...(entry.percentiles || {}),
      ...(historicalDerived[entry.id]?.percentiles || {}),
    },
    comparisonInputs: {
      ...(entry.comparisonInputs || {}),
      ...(historicalDerived[entry.id]?.comparisonInputs?.vector || {}),
      ...(historicalDerived[entry.id]?.comparisonInputs?.cohortKeys || {}),
    },
    historicalOutcomeLabel: historicalDerived[entry.id]?.outcomeLabel?.tier || null,
    modelFeatures: historicalDerived[entry.id]?.modelFeatures || null,
  }));
}

function cohortLabel(mode, prospect, family, slotBand, archetypeFamily) {
  switch (mode) {
    case 'archetype':
      return `Same archetype: ${prospect.archetype}`;
    case 'slot-band':
      return `Same draft band: ${slotBand}`;
    case 'position-family':
      return `Same position family: ${family}`;
    default:
      return archetypeFamily;
  }
}

function cohortEntries(mode, prospect) {
  const dataset = buildHistoricalDataset();
  const family = positionFamily(prospect.position);
  const slotBand = draftSlotBand(prospect.rank);

  switch (mode) {
    case 'archetype':
      return dataset.filter((entry) => entry.archetype === prospect.archetype);
    case 'slot-band':
      return dataset.filter((entry) => entry.draftSlotBand === slotBand);
    case 'position-family':
      return dataset.filter((entry) => entry.positionFamily === family);
    default:
      return [];
  }
}

function summarizeOutcomeRange(entries) {
  if (entries.length === 0) return 'No precedent range yet';
  const tiers = [...new Set(entries.map((entry) => entry.outcomeTier))]
    .sort((left, right) => outcomeScore(right) - outcomeScore(left));
  if (tiers.length === 1) return `${tiers[0]} outcomes only`;
  return `${tiers[0]} to ${tiers[tiers.length - 1]} outcomes`;
}

export function buildHistoricalSimilarity(prospect, mode, limit = 4) {
  const family = positionFamily(prospect.position);
  const slotBand = draftSlotBand(prospect.rank);
  const prospectArchetypeFamily = archetypeFamily(prospect.archetype);
  const entries = cohortEntries(mode, prospect);
  const matches = entries
    .map((entry) => ({
      ...entry,
      matchScore: Number(precedentScore(prospect, entry).toFixed(1)),
    }))
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, limit);
  const outcomeMix = buildOutcomeMix(entries);
  const topOutcome = outcomeMix[0]?.tier || '--';

  return {
    mode,
    label: cohortLabel(mode, prospect, family, slotBand, prospectArchetypeFamily),
    poolSize: entries.length,
    outcomeMix,
    outcomeRange: summarizeOutcomeRange(entries),
    topOutcome,
    matches,
  };
}
