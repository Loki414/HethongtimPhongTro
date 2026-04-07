const crypto = require('crypto');
const { getRedis } = require('../redis/redisClient');

const VERSION_KEY = 'dack:rooms:version';
const ROOMS_PREFIX = 'dack:rooms:v';
const TTL_SECONDS = Number(process.env.ROOMS_CACHE_TTL_SECONDS || 60);

function normalizeQuery(query) {
  // Ensure stable key for caching
  const normalized = {};
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) normalized[k] = [...v].sort();
    else normalized[k] = v;
  }
  return normalized;
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function getRoomsCacheKey(query) {
  const { client, enabled } = await getRedis();
  const version = enabled ? await client.get(VERSION_KEY).catch(() => null) : null;
  const v = version || '1';
  const normalized = normalizeQuery(query);
  const hash = sha256(JSON.stringify(normalized));
  return { key: `${ROOMS_PREFIX}${v}:${hash}`, enabled };
}

async function getCachedRoomsList(query) {
  const { key, enabled } = await getRoomsCacheKey(query);
  if (!enabled) return null;
  const raw = await (await getRedis()).client.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function setCachedRoomsList(query, value) {
  const { key, enabled } = await getRoomsCacheKey(query);
  if (!enabled) return;
  await (await getRedis()).client.setEx(key, TTL_SECONDS, JSON.stringify(value));
}

async function invalidateRoomsCache() {
  const { client, enabled } = await getRedis();
  if (!enabled) return;
  // Bump version. Old cached keys will naturally expire.
  await client.incr(VERSION_KEY);
}

module.exports = { getCachedRoomsList, setCachedRoomsList, invalidateRoomsCache };

