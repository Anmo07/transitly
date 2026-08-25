const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions = {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  connectTimeout: 500,
  retryStrategy(times) {
    if (times > 2) return null; // stop reconnect spam if redis is not running locally
    return 1000;
  }
};

const redisClient = new Redis(redisUrl, redisOptions);

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Fast Path In-Memory Datastore');
});

redisClient.on('error', (err) => {
  // Silent fallback to in-memory maps
});

/**
 * Creates a duplicate isolated Redis client (e.g. for dedicated blocking Stream consumers or Pub/Sub).
 */
const createDuplicateRedisClient = () => {
  return new Redis(redisUrl, redisOptions);
};

module.exports = {
  redisClient,
  createDuplicateRedisClient
};
