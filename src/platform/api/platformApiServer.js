const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const { openDatabase } = require('../../../scripts/lib/db');
const { logError, logInfo } = require('../utils/logger');
const {
  getMeasurementCoverageSummary,
  getPlayerMeasurementCoverage,
} = require('./playerCoverageService');
const { getPlayerSourceProvenance } = require('./provenanceService');
const { getLatestIngestionStatus } = require('./ingestionStatusService');

const DEBUG_PAGE_PATH = path.join(__dirname, 'platformDebugPage.html');

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload, null, 2));
}

function html(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(payload);
}

function notFound(response, message = 'Not found') {
  json(response, 404, { error: message });
}

function badRequest(response, message) {
  json(response, 400, { error: message });
}

function parsePlayerId(value) {
  const playerId = Number(value);
  return Number.isFinite(playerId) && playerId > 0 ? playerId : null;
}

function routeRequest(request, response) {
  const requestUrl = new URL(request.url, 'http://127.0.0.1');
  const pathname = requestUrl.pathname;

  if (request.method !== 'GET') {
    return badRequest(response, 'Only GET is supported.');
  }

  if (pathname === '/' || pathname === '/platform' || pathname === '/platform/debug') {
    return html(response, 200, fs.readFileSync(DEBUG_PAGE_PATH, 'utf8'));
  }

  const db = openDatabase();

  try {
    if (pathname === '/api/platform/coverage') {
      const playerId = parsePlayerId(requestUrl.searchParams.get('playerId'));
      if (playerId) {
        const payload = getPlayerMeasurementCoverage(db, playerId);
        if (!payload) return notFound(response, 'Player not found.');
        return json(response, 200, payload);
      }

      return json(response, 200, getMeasurementCoverageSummary(db));
    }

    if (pathname.startsWith('/api/platform/provenance/')) {
      const playerId = parsePlayerId(pathname.split('/').pop());
      if (!playerId) return badRequest(response, 'Valid playerId is required.');

      const payload = getPlayerSourceProvenance(db, playerId);
      if (!payload) return notFound(response, 'Player not found.');
      return json(response, 200, payload);
    }

    if (pathname === '/api/platform/ingestion') {
      const source = requestUrl.searchParams.get('source') || null;
      const limit = requestUrl.searchParams.get('limit') || 10;
      return json(response, 200, getLatestIngestionStatus(db, { sourceName: source, limit }));
    }

    return notFound(response);
  } catch (error) {
    logError('platform.api.request.error', {
      path: pathname,
      message: error.message,
    });
    return json(response, 500, { error: error.message });
  } finally {
    db.close();
  }
}

function createPlatformApiServer({ port = 4318, host = '127.0.0.1' } = {}) {
  const server = http.createServer(routeRequest);

  return {
    listen() {
      return new Promise((resolve) => {
        server.listen(port, host, () => {
          logInfo('platform.api.server.start', { host, port });
          resolve(server);
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

module.exports = {
  createPlatformApiServer,
};
