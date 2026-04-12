const fs = require('fs');
const path = require('path');
const { loadStructuredFiles } = require('./shared/fileDataset');

const INPUT_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'historical');
const OUTPUT_DIRS = {
  collegebasketballdata: path.join(__dirname, '..', '..', 'imports', 'upstream', 'collegebasketballdata'),
  sportsReference: path.join(__dirname, '..', '..', 'imports', 'upstream', 'sports-reference'),
  bartTorvik: path.join(__dirname, '..', '..', 'imports', 'upstream', 'bart-torvik'),
  basketballReference: path.join(__dirname, '..', '..', 'imports', 'upstream', 'basketball-reference'),
  nbaCombine: path.join(__dirname, '..', '..', 'imports', 'upstream', 'nba-combine'),
};

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseHeight(value) {
  const match = String(value || '').match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  return { feet: Number(match[1]), inches: Number(match[2]) };
}

function inchesToHeight(totalInches) {
  if (!Number.isFinite(totalInches)) return '';
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}-${inches}`;
}

function buildSourcePlayerId(entry) {
  return `${toSlug(entry.name)}-${entry.draftYear}`;
}

function leagueForSchool(school) {
  const value = String(school || '').toLowerCase();
  if (['jl bourg', 'perth wildcats', 'crvena zvezda', 'cholet'].includes(value)) return 'International Pro';
  if (value.includes('ignite')) return 'G League';
  if (value === 'ote') return 'OTE';
  return 'NCAA';
}

function classYearForAge(age) {
  if (!Number.isFinite(age)) return 'Fr.';
  if (age < 19.5) return 'Fr.';
  if (age < 20.5) return 'So.';
  if (age < 21.5) return 'Jr.';
  return 'Sr.';
}

function buildCollegeBasketballData(entries) {
  return entries.map((entry) => ({
    source_player_id: buildSourcePlayerId(entry),
    player_name: entry.name,
    season: `${entry.draftYear - 1}-${String(entry.draftYear).slice(2)}`,
    school_team: entry.school,
    league: leagueForSchool(entry.school),
    class_year: classYearForAge(Number(entry.age)),
    age: Number(entry.age),
    position: entry.position,
    games: 32,
    minutes: Number((28 + ((Number(entry.bpm) || 0) * 0.4)).toFixed(1)),
    points: Number(entry.pointsPerGame),
    rebounds: Number(entry.reboundsPerGame),
    assists: Number(entry.assistsPerGame),
    steals: Number((1.1 + ((Number(entry.bpm) || 0) * 0.04)).toFixed(1)),
    blocks: Number((entry.position.includes('C') || entry.position.includes('PF') ? 1.3 : 0.5).toFixed(1)),
    turnovers: Number((2.0 + (Number(entry.assistsPerGame || 0) * 0.2)).toFixed(1)),
    fg_pct: Number((0.42 + ((Number(entry.pointsPerGame) || 0) / 200)).toFixed(3)),
    three_pct: Number((0.3 + ((Number(entry.assistsPerGame) || 0) / 100)).toFixed(3)),
    ft_pct: Number((0.68 + ((Number(entry.trueShooting?.replace('%', '')) || 55) - 55) / 200).toFixed(3)),
  }));
}

function buildSportsReference(entries) {
  return entries.map((entry) => ({
    source_player_id: buildSourcePlayerId(entry),
    player_name: entry.name,
    season: `${entry.draftYear - 1}-${String(entry.draftYear).slice(2)}`,
    school_team: entry.school,
    league: leagueForSchool(entry.school),
    class_year: classYearForAge(Number(entry.age)),
    age: Number(entry.age),
    position: entry.position,
    games: 34,
    minutes: Number((29 + ((Number(entry.pointsPerGame) || 0) * 0.15)).toFixed(1)),
    points: Number(entry.pointsPerGame),
    rebounds: Number(entry.reboundsPerGame),
    assists: Number(entry.assistsPerGame),
    steals: Number((0.9 + ((Number(entry.bpm) || 0) * 0.03)).toFixed(1)),
    blocks: Number((entry.position.includes('C') ? 1.7 : entry.position.includes('PF') ? 1.1 : 0.4).toFixed(1)),
    turnovers: Number((1.8 + (Number(entry.assistsPerGame || 0) * 0.18)).toFixed(1)),
    fg_pct: Number((0.43 + ((Number(entry.pointsPerGame) || 0) / 220)).toFixed(3)),
    three_pct: Number((0.31 + ((Number(entry.assistsPerGame) || 0) / 120)).toFixed(3)),
    ft_pct: Number((0.7 + ((Number(entry.trueShooting?.replace('%', '')) || 55) - 55) / 220).toFixed(3)),
  }));
}

function buildBartTorvik(entries) {
  return entries.map((entry) => ({
    source_player_id: buildSourcePlayerId(entry),
    player_name: entry.name,
    season: `${entry.draftYear - 1}-${String(entry.draftYear).slice(2)}`,
    school_team: entry.school,
    league: leagueForSchool(entry.school),
    age: Number(entry.age),
    position: entry.position,
    ts_pct: Number((Number(String(entry.trueShooting).replace('%', '')) / 100).toFixed(3)),
    efg_pct: Number((Number(String(entry.trueShooting).replace('%', '')) / 110).toFixed(3)),
    usg_pct: Number((0.2 + ((Number(entry.pointsPerGame) || 0) / 100)).toFixed(3)),
    ast_pct: Number((0.08 + ((Number(entry.assistsPerGame) || 0) / 40)).toFixed(3)),
    tov_pct: Number((0.09 + ((Number(entry.assistsPerGame) || 0) / 80)).toFixed(3)),
    stl_pct: Number((0.012 + ((Number(entry.bpm) || 0) / 1000)).toFixed(3)),
    blk_pct: Number((entry.position.includes('C') ? 0.05 : entry.position.includes('PF') ? 0.03 : 0.015).toFixed(3)),
    bpm: Number(entry.bpm),
    obpm: Number(((Number(entry.bpm) || 0) * 0.62).toFixed(1)),
    dbpm: Number(((Number(entry.bpm) || 0) * 0.38).toFixed(1)),
  }));
}

function buildBasketballReference(entries) {
  return entries.map((entry) => ({
    source_player_id: buildSourcePlayerId(entry),
    player_name: entry.name,
    draft_year: Number(entry.draftYear),
    draft_slot: Number(entry.draftSlot),
    nba_team: 'TBD',
    position: entry.position,
    school_team: entry.school,
    nba_games: entry.outcomeTier === 'Hit' ? 240 : entry.outcomeTier === 'Swing' ? 92 : 28,
    nba_minutes: entry.outcomeTier === 'Hit' ? 6200 : entry.outcomeTier === 'Swing' ? 1800 : 320,
    nba_points: entry.outcomeTier === 'Hit' ? 11.8 : entry.outcomeTier === 'Swing' ? 7.2 : 3.1,
    nba_rebounds: entry.outcomeTier === 'Hit' ? 4.6 : entry.outcomeTier === 'Swing' ? 3.4 : 1.8,
    nba_assists: entry.outcomeTier === 'Hit' ? 3.4 : entry.outcomeTier === 'Swing' ? 2.1 : 0.9,
    nba_bpm: entry.outcomeTier === 'Hit' ? 1.7 : entry.outcomeTier === 'Swing' ? -0.2 : -2.6,
  }));
}

function buildNbaCombine(entries) {
  return entries.map((entry) => {
    const height = parseHeight(entry.height);
    const totalInches = height ? (height.feet * 12) + height.inches : null;
    return {
      source_player_id: buildSourcePlayerId(entry),
      player_name: entry.name,
      combine_year: Number(entry.draftYear),
      age: Number(entry.age),
      position: entry.position,
      height: entry.height,
      weight: Number((190 + ((totalInches || 78) - 78) * 12).toFixed(0)),
      wingspan: inchesToHeight((totalInches || 78) + (entry.position.includes('C') ? 5 : entry.position.includes('PF') ? 4 : 3)),
      standing_reach: inchesToHeight((totalInches || 78) + (entry.position.includes('C') ? 10 : 8)),
      max_vertical: entry.position.includes('C') ? 31 : 36,
      lane_agility: entry.position.includes('C') ? 11.4 : 10.8,
      shuttle_run: entry.position.includes('C') ? 3.25 : 3.05,
      sprint: entry.position.includes('C') ? 3.25 : 3.08,
    };
  });
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function bootstrapHistoricalSources() {
  const loaded = loadStructuredFiles(INPUT_DIR);
  const entries = loaded.rows;

  ensureDir(OUTPUT_DIRS.collegebasketballdata);
  ensureDir(OUTPUT_DIRS.sportsReference);
  ensureDir(OUTPUT_DIRS.bartTorvik);
  ensureDir(OUTPUT_DIRS.basketballReference);
  ensureDir(OUTPUT_DIRS.nbaCombine);

  writeJson(path.join(OUTPUT_DIRS.collegebasketballdata, 'bootstrap.json'), buildCollegeBasketballData(entries));
  writeJson(path.join(OUTPUT_DIRS.sportsReference, 'bootstrap.json'), buildSportsReference(entries));
  writeJson(path.join(OUTPUT_DIRS.bartTorvik, 'bootstrap.json'), buildBartTorvik(entries));
  writeJson(path.join(OUTPUT_DIRS.basketballReference, 'bootstrap.json'), buildBasketballReference(entries));
  writeJson(path.join(OUTPUT_DIRS.nbaCombine, 'bootstrap.json'), buildNbaCombine(entries));

  console.log(`Bootstrapped ${entries.length} historical records into source-specific upstream directories.`);
}

if (require.main === module) {
  bootstrapHistoricalSources();
}

module.exports = { bootstrapHistoricalSources };
