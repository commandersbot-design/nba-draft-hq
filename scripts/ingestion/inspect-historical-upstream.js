const fs = require('fs');
const path = require('path');
const { SOURCE_CONFIG } = require('./config/sources');
const { loadStructuredFiles } = require('./shared/fileDataset');

function sourceDirectoryFromConfig(source) {
  if (source.paths?.upstreamDirectory) {
    return source.paths.upstreamDirectory;
  }
  return path.join(__dirname, '..', '..', 'imports', 'upstream', source.id.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`));
}

function toString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function inferYears(row, filePath) {
  const values = [
    row.season,
    row.season_year,
    row.year,
    row.draftYear,
    row.draft_year,
    row.combineYear,
    row.combine_year,
    row.class_year,
    row.classYear,
    filePath,
  ]
    .map((value) => toString(value))
    .filter(Boolean)
    .join(' ');

  const matches = values.match(/20\d{2}/g) || [];
  return [...new Set(matches.map((value) => Number(value)).filter((value) => Number.isFinite(value)))];
}

function countFieldCoverage(rows, aliases) {
  if (!rows.length) return { present: 0, total: 0, percent: 0 };
  const present = rows.filter((row) =>
    aliases.some((alias) => row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== ''),
  ).length;

  return {
    present,
    total: rows.length,
    percent: Math.round((present / rows.length) * 100),
  };
}

function buildSourceSummary(source) {
  const directory = sourceDirectoryFromConfig(source);
  const exists = fs.existsSync(directory);
  const { files, rows } = exists ? loadStructuredFiles(directory) : { files: [], rows: [] };
  const years = [...new Set(rows.flatMap((row) => inferYears(row, directory)))].sort((left, right) => left - right);

  return {
    id: source.id,
    label: source.label,
    directory,
    exists,
    fileCount: files.length,
    rowCount: rows.length,
    years,
    coverage: {
      playerName: countFieldCoverage(rows, ['player_name', 'playerName', 'name', 'player']),
      season: countFieldCoverage(rows, ['season', 'season_year', 'year']),
      team: countFieldCoverage(rows, ['school_team', 'schoolTeam', 'school', 'team', 'team_name']),
      position: countFieldCoverage(rows, ['position', 'pos']),
      sourcePlayerId: countFieldCoverage(rows, ['source_player_id', 'sourcePlayerId', 'player_id', 'playerId', 'id']),
    },
    files: files.map((filePath) => path.relative(path.join(__dirname, '..', '..'), filePath)),
  };
}

function inspectHistoricalUpstream() {
  const sources = Object.values(SOURCE_CONFIG).filter((source) => source.id !== 'historicalDatasetImport');
  const summaries = sources.map(buildSourceSummary);
  const status = {
    generatedAt: new Date().toISOString(),
    totalSources: summaries.length,
    populatedSources: summaries.filter((summary) => summary.rowCount > 0).length,
    totalRows: summaries.reduce((sum, summary) => sum + summary.rowCount, 0),
    sources: summaries,
  };

  const outputPath = path.join(__dirname, '..', '..', 'src', 'data', 'historicalSourceStatus.json');
  fs.writeFileSync(outputPath, JSON.stringify(status, null, 2));
  console.log(`Wrote historical source status to ${outputPath}`);
}

if (require.main === module) {
  inspectHistoricalUpstream();
}

module.exports = { inspectHistoricalUpstream };
