function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim();
}

function toNumber(value, fallback = null) {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[%,$]/g, '').trim();
    const next = Number(cleaned);
    return Number.isFinite(next) ? next : fallback;
  }
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeSeasonValue(value) {
  const raw = toString(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) {
    const year = Number(raw);
    return `${year - 1}-${String(year).slice(2)}`;
  }
  const match = raw.match(/(20\d{2})/);
  if (match) {
    const year = Number(match[1]);
    return `${year - 1}-${String(year).slice(2)}`;
  }
  return raw;
}

function normalizeDraftYear(value, seasonValue) {
  const direct = toNumber(value, null);
  if (direct) return direct;
  const season = normalizeSeasonValue(seasonValue);
  if (!season) return null;
  const match = season.match(/(\d{4})-(\d{2})/);
  if (!match) return null;
  return Number(match[1]) + 1;
}

function normalizePosition(value) {
  return toString(value)
    .replace(/\s+/g, '')
    .replace('G-F', 'SG/SF')
    .replace('F-G', 'SF/SG')
    .replace('F-C', 'PF/C')
    .replace('C-F', 'C/PF');
}

function fallbackSourcePlayerId(row, playerName, season, draftYear, combineYear) {
  const anchor = firstPresent(draftYear, combineYear, season, row.year, row.season_year, row.draft_year, row.combine_year, 'historical');
  return `${slugify(playerName || row.name || row.player_name || 'unknown-player')}-${String(anchor)}`;
}

function pick(row, aliases = []) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') return row[alias];
  }
  return null;
}

function createSourceMapper(schema) {
  return function mapRow(row) {
    const playerName = toString(pick(row, schema.playerName));
    const rawSeason = pick(row, schema.season || []);
    const season = normalizeSeasonValue(rawSeason);
    const draftYear = normalizeDraftYear(pick(row, schema.draftYear || []), rawSeason);
    const combineYear = toNumber(pick(row, schema.combineYear || []), null);
    const sourcePlayerId = toString(
      firstPresent(
        pick(row, schema.sourcePlayerId || []),
        fallbackSourcePlayerId(row, playerName, season, draftYear, combineYear),
      ),
    );

    const mapped = {
      sourcePlayerId,
      playerName,
    };

    for (const [target, config] of Object.entries(schema.fields || {})) {
      const value = pick(row, config.aliases || []);
      if (config.type === 'number') {
        mapped[target] = toNumber(value, config.fallback ?? null);
      } else if (config.type === 'season') {
        mapped[target] = normalizeSeasonValue(value);
      } else if (config.type === 'draftYear') {
        mapped[target] = normalizeDraftYear(value, rawSeason);
      } else if (config.type === 'position') {
        mapped[target] = normalizePosition(value);
      } else {
        mapped[target] = toString(value, config.fallback ?? '');
      }
    }

    if (!mapped.season && season) mapped.season = season;
    if (!mapped.draftYear && draftYear) mapped.draftYear = draftYear;
    if (!mapped.combineYear && combineYear) mapped.combineYear = combineYear;
    if (!mapped.position) mapped.position = normalizePosition(pick(row, ['position', 'pos'])) || '';

    return mapped;
  };
}

module.exports = {
  createSourceMapper,
  firstPresent,
  normalizeSeasonValue,
  normalizeDraftYear,
  normalizePosition,
  toString,
  toNumber,
};
