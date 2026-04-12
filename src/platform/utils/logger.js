function log(level, event, context = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };
  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

module.exports = {
  logInfo(event, context) {
    log('info', event, context);
  },
  logWarn(event, context) {
    log('warn', event, context);
  },
  logError(event, context) {
    log('error', event, context);
  },
};
