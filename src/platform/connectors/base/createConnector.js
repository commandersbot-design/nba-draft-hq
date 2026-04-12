const { logInfo, logWarn } = require('../../utils/logger');

function createConnector(definition) {
  return {
    ...definition,
    async fullRefresh(context = {}) {
      logInfo('connector.full_refresh.start', { source: definition.displayName });
      const result = await definition.handlers.fullRefresh(context);
      if (result.status === 'blocked') {
        logWarn('connector.full_refresh.blocked', { source: definition.displayName, message: result.message });
      }
      return result;
    },
    async incrementalRefresh(context = {}) {
      logInfo('connector.incremental_refresh.start', { source: definition.displayName });
      const result = await definition.handlers.incrementalRefresh(context);
      if (result.status === 'blocked') {
        logWarn('connector.incremental_refresh.blocked', { source: definition.displayName, message: result.message });
      }
      return result;
    },
  };
}

module.exports = {
  createConnector,
};
