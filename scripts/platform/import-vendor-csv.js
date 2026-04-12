const { importVendorCsv } = require('../../src/platform/connectors/csv_imports');

function parseArgs(argv) {
  return Object.fromEntries(
    argv
      .filter((entry) => entry.startsWith('--'))
      .map((entry) => entry.replace(/^--/, '').split('='))
      .map(([key, value]) => [key, value || '']),
  );
}

async function runVendorCsvImport() {
  const args = parseArgs(process.argv.slice(2));
  const result = await importVendorCsv({
    source: args.source,
    file: args.file,
  });

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  runVendorCsvImport();
}

module.exports = { runVendorCsvImport };
