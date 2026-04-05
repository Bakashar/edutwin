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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await redis.connect().catch(() => {});
    const { key, value, ex } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });
    if (ex) await redis.set(key, value, 'EX', ex);
    else    await redis.set(key, value);
    res.json({ success: true });
  } catch (err) {
    console.error('Redis SET error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
