const path = require('path');

const PLATFORM_MIGRATION = path.join(__dirname, '..', '..', '..', 'database', 'migrations', '2026-04-12-platform-foundation.sql');
const PLATFORM_SEEDS = path.join(__dirname, '..', '..', '..', 'database', 'seeds', '2026-04-12-platform-vocabularies.sql');

module.exports = {
  PLATFORM_MIGRATION,
  PLATFORM_SEEDS,
};
