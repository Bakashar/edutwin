const express = require("express");
const Redis = require("ioredis");
const cors = require("cors");
const Minio = require("minio");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

/* ═══════════ REDIS ═══════════ */
const redis = new Redis({
  host: "a1-redis1.alem.ai",
  port: 31107,
  password: "r977xcKnKuZKQeJqOyhFYQyNcKrLQ30kRvKfMtHn",
  retryStrategy: (times) => Math.min(times * 100, 2000),
});
redis.on("connect", () => console.log("✅ Redis подключён"));
redis.on("error",   (e) => console.error("❌ Redis:", e.message));

/* ═══════════ MINIO ═══════════ */
const minioClient = new Minio.Client({
  endPoint: "a1-s3-1.alem.ai", port: 443, useSSL: true,
  accessKey: "baga", secretKey: "h11x4LhROi",
});
minioClient.bucketExists("aleemstudenttwin", (err, exists) => {
  if (err) { console.error("❌ MinIO:", err.message); return; }
  console.log(exists ? "✅ MinIO bucket найден" : "⚠️ MinIO bucket не найден");
});

/* ═══════════ REDIS API ═══════════ */
app.post("/set", async (req, res) => {
  try {
    const { key, value, ex } = req.body;
    if (ex) await redis.set(key, value, "EX", ex);
    else    await redis.set(key, value);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/get/:key", async (req, res) => {
  try {
    const value = await redis.get(req.params.key);
    res.json({ value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/del/:key", async (req, res) => {
  try { await redis.del(req.params.key); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/health", async (req, res) => {
  try { await redis.ping(); res.json({ redis: "ok", minio: "ok" }); }
  catch { res.status(500).json({ redis: "error" }); }
});

/* ═══════════ MINIO API ═══════════ */
app.post("/upload", async (req, res) => {
  try {
    const { fileName, content } = req.body;
    const buffer = Buffer.from(content, "base64");
    await minioClient.putObject("aleemstudenttwin", fileName, buffer);
    console.log("✅ MinIO:", fileName, buffer.length, "bytes");
    res.json({ success: true, fileName, size: buffer.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/file/:fileName", async (req, res) => {
  try {
    const url = await minioClient.presignedGetObject("aleemstudenttwin", req.params.fileName, 86400);
    res.json({ url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ═══════════ START ═══════════ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 EduTwin Backend: http://localhost:${PORT}`);
  console.log("   POST /set  GET /get/:key  POST /upload  GET /health\n");
});
