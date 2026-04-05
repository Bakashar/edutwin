import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'a1-redis1.alem.ai',
  port: parseInt(process.env.REDIS_PORT || '31107'),
  password: process.env.REDIS_PASSWORD || 'r977xcKnKuZKQeJqOyhFYQyNcKrLQ30kRvKfMtHn',
  connectTimeout: 5000,
  lazyConnect: true,
  retryStrategy: (times) => times > 3 ? null : Math.min(times * 200, 1000),
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await redis.connect().catch(() => {});
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key required' });
    await redis.del(key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
