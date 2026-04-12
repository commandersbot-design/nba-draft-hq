const { nbaCombineConnector } = require('../../src/platform/connectors/nba');

async function runNbaCombineConnector() {
  const result = await nbaCombineConnector.fullRefresh();
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  runNbaCombineConnector();
}

module.exports = { runNbaCombineConnector };
