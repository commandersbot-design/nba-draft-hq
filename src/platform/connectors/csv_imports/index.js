const fs = require('fs');
const path = require('path');
const { CSV_IMPORT_SOURCES } = require('../../config/sourceCatalog');
const { logInfo } = require('../../utils/logger');
const { openDatabase } = require('../../../../scripts/lib/db');

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function importEntityOverrides({ file }) {
  if (!file) {
    throw new Error('Entity override import requires --file=<path>.');
  }

  const absolutePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const rows = parseCsvFile(absolutePath);
  const db = openDatabase();

  const upsert = db.prepare(`
    INSERT INTO entity_resolution_overrides (
      source_name,
      external_id,
      player_id,
      confidence_override,
      notes
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(source_name, external_id) DO UPDATE SET
      player_id = excluded.player_id,
      confidence_override = COALESCE(excluded.confidence_override, entity_resolution_overrides.confidence_override),
      notes = COALESCE(excluded.notes, entity_resolution_overrides.notes),
      updated_at = CURRENT_TIMESTAMP
  `);

  let written = 0;
  let rejected = 0;

  for (const row of rows) {
    const sourceName = row.source_name || row.source || '';
    const externalId = row.external_id || row.externalId || '';
    const playerId = numericOrNull(row.player_id || row.playerId);

    if (!sourceName || !externalId || !playerId) {
      rejected += 1;
      continue;
    }

    upsert.run(
      sourceName,
      externalId,
      playerId,
      numericOrNull(row.confidence_override || row.confidenceOverride) ?? 1,
      row.notes || null,
    );
    written += 1;
  }

  db.close();

  return {
    status: rejected > 0 ? 'partial' : 'success',
    sourceName: 'Entity Resolution Overrides',
    recordsSeen: rows.length,
    recordsWritten: written,
    recordsRejected: rejected,
    message: `Imported ${written} entity resolution overrides from ${path.basename(absolutePath)}.`,
    metadata: {
      file: absolutePath,
    },
  };
}

async function importVendorCsv({ source, file }) {
  const config = CSV_IMPORT_SOURCES[source];
  if (!config) {
    throw new Error(`Unknown CSV import source: ${source}`);
  }

  logInfo('csv_import.start', {
    source,
    file,
    importType: config.importType,
  });

  if (config.importType === 'entity_resolution_overrides') {
    return importEntityOverrides({ file });
  }

  return {
    status: 'blocked',
    sourceName: config.displayName,
    recordsSeen: 0,
    recordsWritten: 0,
    recordsRejected: 0,
    message: `CSV import path is scaffolded for ${config.displayName}. Provide a real file parser and mapping for ${path.basename(file || 'missing-file')}.`,
  };
}

module.exports = {
  CSV_IMPORT_SOURCES,
  importVendorCsv,
  parseCsvFile,
  parseCsvLine,
};
