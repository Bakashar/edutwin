import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT  || 'a1-s3-1.alem.ai',
  port:      443,
  useSSL:    true,
  accessKey: process.env.MINIO_ACCESS_KEY || 'baga',
  secretKey: process.env.MINIO_SECRET_KEY || 'h11x4LhROi',
});

const BUCKET = process.env.MINIO_BUCKET || 'aleemstudenttwin';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, content } = req.body;
    if (!fileName || !content) return res.status(400).json({ error: 'fileName and content required' });
    const buffer = Buffer.from(content, 'base64');
    await minioClient.putObject(BUCKET, fileName, buffer);
    res.json({ success: true, fileName, size: buffer.length });
  } catch (err) {
    console.error('MinIO upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
