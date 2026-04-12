const fs = require('fs');
const path = require('path');

function walkFiles(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return [targetPath];

  const output = [];
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(entryPath));
    } else {
      output.push(entryPath);
    }
  }
  return output;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function loadJsonFile(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return extractRowsFromJsonPayload(payload);
}

function loadCsvFile(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function loadNdjsonFile(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeRow(value) {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  return keys.some((key) =>
    /(^id$|name|player|season|year|team|school|position|draft|combine|pts|reb|ast|bpm|usage|measure)/i.test(key),
  );
}

function extractRowsFromJsonPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.filter((entry) => entry != null);
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  const preferredKeys = [
    'rows',
    'data',
    'results',
    'items',
    'records',
    'players',
    'prospects',
    'seasons',
    'games',
    'gameLogs',
    'advancedMetrics',
    'draftHistory',
    'outcomes',
    'measurements',
    'combine',
  ];

  const collected = [];
  for (const key of preferredKeys) {
    if (payload[key] !== undefined) {
      collected.push(...extractRowsFromJsonPayload(payload[key]));
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  if (looksLikeRow(payload)) {
    return [payload];
  }

  return Object.values(payload).flatMap((value) => extractRowsFromJsonPayload(value));
}

function loadStructuredFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return { files: [], rows: [] };
  }

  const files = walkFiles(targetPath)
    .filter((filePath) => /\.(json|csv|jsonl|ndjson)$/i.test(filePath))
    .sort((left, right) => left.localeCompare(right));

  const rows = [];
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const payload = extension === '.csv'
      ? loadCsvFile(filePath)
      : extension === '.jsonl' || extension === '.ndjson'
        ? loadNdjsonFile(filePath)
        : loadJsonFile(filePath);
    rows.push(...payload);
  }

  return { files, rows };
}

module.exports = {
  loadStructuredFiles,
};
