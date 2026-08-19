const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
};

const redisClient = new Redis(redisUrl, redisOptions);

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Fast Path In-Memory Datastore');
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err.message);
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
