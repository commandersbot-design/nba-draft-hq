const path = require('path');
const { buildSourceSyncMetadata, requireSourceConfig } = require('../config');
const { loadStructuredFiles } = require('./fileDataset');

function sourceDirectory(name) {
  return path.join(__dirname, '..', '..', '..', 'imports', 'upstream', name);
}

function toString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim();
}

function toNumber(value, fallback = null) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function loadSourceRows(sourceId, options = {}) {
  const config = requireSourceConfig(sourceId);
  const targetPath = process.env[options.envKey || ''] || options.defaultPath;
  const { files, rows } = loadStructuredFiles(targetPath);

  return {
    config,
    files,
    rows,
    metadata: buildSourceSyncMetadata(sourceId, {
      datasetPath: targetPath,
      fileCount: files.length,
      files,
      note: options.note || '',
    }),
  };
}

module.exports = {
  sourceDirectory,
  toString,
  toNumber,
  loadSourceRows,
};
