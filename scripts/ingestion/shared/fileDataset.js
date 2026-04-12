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
  return Array.isArray(payload) ? payload : [];
}

function loadCsvFile(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function loadStructuredFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return { files: [], rows: [] };
  }

  const files = walkFiles(targetPath)
    .filter((filePath) => /\.(json|csv)$/i.test(filePath))
    .sort((left, right) => left.localeCompare(right));

  const rows = [];
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const payload = extension === '.csv' ? loadCsvFile(filePath) : loadJsonFile(filePath);
    rows.push(...payload);
  }

  return { files, rows };
}

module.exports = {
  loadStructuredFiles,
};
