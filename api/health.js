import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'a1-redis1.alem.ai',
  port: parseInt(process.env.REDIS_PORT || '31107'),
  password: process.env.REDIS_PASSWORD || 'r977xcKnKuZKQeJqOyhFYQyNcKrLQ30kRvKfMtHn',
  connectTimeout: 3000,
  lazyConnect: true,
  retryStrategy: () => null,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await redis.connect().catch(() => {});
    await redis.ping();
    res.json({ status: 'ok', redis: 'connected', minio: 'connected', timestamp: Date.now() });
  } catch (err) {
    res.json({ status: 'degraded', redis: 'error', error: err.message, timestamp: Date.now() });
  }
}
