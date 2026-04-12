const fs = require('fs');
const path = require('path');
const { SOURCE_CATALOG, CSV_IMPORT_SOURCES } = require('../../src/platform/config/sourceCatalog');

function validatePlatformData() {
  const checks = [];

  for (const connector of Object.values(SOURCE_CATALOG)) {
    checks.push({
      source: connector.displayName,
      hasComplianceMode: Boolean(connector.complianceMode),
      hasRawTables: Array.isArray(connector.rawTables) && connector.rawTables.length > 0,
      hasNormalizedTables: Array.isArray(connector.normalizedTables) && connector.normalizedTables.length > 0,
      supportsModes: connector.supportedModes,
    });
  }

  const csvSources = Object.entries(CSV_IMPORT_SOURCES).map(([key, value]) => ({
    key,
    displayName: value.displayName,
    importType: value.importType,
  }));

  const docsPath = path.join(__dirname, '..', '..', 'docs', 'PROSPERA_PLATFORM_PHASE1.md');

  console.log(JSON.stringify({
    connectors: checks,
    csvSources,
    docsPresent: fs.existsSync(docsPath),
  }, null, 2));
}

if (require.main === module) {
  validatePlatformData();
}

module.exports = { validatePlatformData };
