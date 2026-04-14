const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');
const { openDatabase } = require('../../../scripts/lib/db');
const { logError, logInfo } = require('../utils/logger');
const {
  getMeasurementCoverageSummary,
  getPlayerMeasurementCoverage,
} = require('./playerCoverageService');
const { getPlayerSourceProvenance } = require('./provenanceService');
const { getLatestIngestionStatus } = require('./ingestionStatusService');
const { getResolutionQueue } = require('./resolutionQueueService');
const { getFailedRecords } = require('./failedRecordsService');
const { upsertEntityResolutionOverride } = require('./overrideService');

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

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    request.on('error', reject);
  });
}

function parsePlayerId(value) {
  const playerId = Number(value);
  return Number.isFinite(playerId) && playerId > 0 ? playerId : null;
}

function runLocalJob(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });
  });
}

async function routeRequest(request, response) {
  const requestUrl = new URL(request.url, 'http://127.0.0.1');
  const pathname = requestUrl.pathname;

  if (pathname === '/' || pathname === '/platform' || pathname === '/platform/debug') {
    if (request.method !== 'GET') {
      return badRequest(response, 'Only GET is supported.');
    }
    return html(response, 200, fs.readFileSync(DEBUG_PAGE_PATH, 'utf8'));
  }

  const db = openDatabase();

  try {
    if (pathname === '/api/platform/overrides') {
      if (request.method !== 'POST') {
        return badRequest(response, 'Only POST is supported for overrides.');
      }

      const body = await readJsonBody(request);
      const playerId = parsePlayerId(body.playerId);
      if (!playerId) {
        return badRequest(response, 'Valid playerId is required.');
      }

      const payload = upsertEntityResolutionOverride(db, {
        sourceName: body.sourceName,
        externalId: body.externalId,
        playerId,
        confidenceOverride: Number(body.confidenceOverride ?? 1),
        notes: body.notes || null,
      });

      return json(response, 200, payload);
    }

    if (pathname === '/api/platform/jobs/ingest-nba') {
      if (request.method !== 'POST') {
        return badRequest(response, 'Only POST is supported for job triggers.');
      }

      const result = await runLocalJob(path.join(process.cwd(), 'scripts', 'platform', 'run-nba-combine-connector.js'));
      return json(response, result.code === 0 ? 200 : 500, result);
    }

    if (request.method !== 'GET') {
      return badRequest(response, 'Only GET is supported.');
    }

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

    if (pathname === '/api/platform/resolution-queue') {
      const source = requestUrl.searchParams.get('source') || 'NBA.com Draft Combine';
      const limit = requestUrl.searchParams.get('limit') || 25;
      return json(response, 200, getResolutionQueue(db, { sourceName: source, limit }));
    }

    if (pathname === '/api/platform/failed-records') {
      const source = requestUrl.searchParams.get('source') || 'NBA.com Draft Combine';
      const limit = requestUrl.searchParams.get('limit') || 25;
      return json(response, 200, getFailedRecords(db, { sourceName: source, limit }));
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
