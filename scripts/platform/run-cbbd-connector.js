const { cbbdConnector } = require('../../src/platform/connectors/cbbd');

async function runCbbdConnector() {
  const result = await cbbdConnector.fullRefresh();
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  runCbbdConnector();
}

module.exports = { runCbbdConnector };
