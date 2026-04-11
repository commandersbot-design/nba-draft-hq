import historicalProspects from '../data/historicalProspects.json';

function positionFamily(position) {
  if (String(position).includes('PG')) return 'guard';
  if (String(position).includes('SF') || String(position).includes('SG')) return 'wing';
  return 'big';
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
  return historicalProspects
    .map((entry) => ({
      ...entry,
      matchScore: Number(precedentScore(prospect, entry).toFixed(1)),
    }))
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, limit);
}
