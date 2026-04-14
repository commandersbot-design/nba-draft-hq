const { createPlatformApiServer } = require('../../src/platform/api/platformApiServer');

async function main() {
  const port = Number(process.env.PLATFORM_API_PORT || 4318);
  const host = process.env.PLATFORM_API_HOST || '127.0.0.1';
  const server = createPlatformApiServer({ port, host });
  await server.listen();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  main,
};
