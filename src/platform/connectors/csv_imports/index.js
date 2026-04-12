const path = require('path');
const { CSV_IMPORT_SOURCES } = require('../../config/sourceCatalog');
const { logInfo } = require('../../utils/logger');

async function importVendorCsv({ source, file }) {
  const config = CSV_IMPORT_SOURCES[source];
  if (!config) {
    throw new Error(`Unknown CSV import source: ${source}`);
  }

  logInfo('csv_import.stub', {
    source,
    file,
    importType: config.importType,
  });

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
};
