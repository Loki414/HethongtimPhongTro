const redis = require('redis');

let client = null;
let enabled = false;

function buildUrl() {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT || 6379);
  return `redis://${host}:${port}`;
}

async function init() {
  if (client) return client;

  client = redis.createClient({
    url: buildUrl(),
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Redis reconnect failed');
        return Math.min(retries * 100, 2000);
      },
    },
  });

  client.on('error', () => {
    enabled = false;
  });

  try {
    await client.connect();
    enabled = true;
  } catch {
    enabled = false;
  }

  return client;
}

async function getRedis() {
  await init();
  return { client, enabled };
}

module.exports = { getRedis };

