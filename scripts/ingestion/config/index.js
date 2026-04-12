const { SOURCE_CONFIG } = require('./sources');

function listSourceConfigs() {
  return Object.values(SOURCE_CONFIG);
}

function getSourceConfig(id) {
  return SOURCE_CONFIG[id] || null;
}

function requireSourceConfig(id) {
  const config = getSourceConfig(id);
  if (!config) {
    throw new Error(`Unknown ingestion source config: ${id}`);
  }
  return config;
}

function buildSourceSyncMetadata(id, metadata = {}) {
  const config = requireSourceConfig(id);
  return {
    sourceId: config.id,
    sourceLabel: config.label,
    category: config.category,
    provenance: config.provenance,
    rawTables: config.rawTables,
    normalizedTables: config.normalizedTables,
    derivedTables: config.derivedTables,
    ...metadata,
  };
}

module.exports = {
  listSourceConfigs,
  getSourceConfig,
  requireSourceConfig,
  buildSourceSyncMetadata,
};
