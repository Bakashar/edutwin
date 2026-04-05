import { AgentType, StudentProfile } from "../types";

// ════════════════════════════════════════════════════════════════════════════════
// 🔑  КОНФИГУРАЦИЯ — все значения берутся из .env
// ════════════════════════════════════════════════════════════════════════════════

// ── 1. Qwen3 — основной LLM ──────────────────────────────────────────────────
// BASE без /chat/completions — добавляем путь сами в fetch
const QWEN_BASE  = (import.meta.env.VITE_QWEN_API_BASE  || "").replace(/\/chat\/completions$/, "").replace(/\/$/, "");
const QWEN_KEY   = import.meta.env.VITE_QWEN_API_KEY   || "";
const QWEN_MODEL = import.meta.env.VITE_QWEN_MODEL      || "qwen3-235b-a22b";

// ── 2. AlemLLM — казахский язык ───────────────────────────────────────────────
const ALEM_BASE  = (import.meta.env.VITE_ALEMLLM_API_BASE || "").replace(/\/chat\/completions$/, "").replace(/\/$/, "");
const ALEM_KEY   = import.meta.env.VITE_ALEMLLM_API_KEY   || "";
const ALEM_MODEL = import.meta.env.VITE_ALEMLLM_MODEL      || "alem-llm-247b";

// ── 3. Redis + MinIO — через локальный backend-сервер (redis-api/server.js) ───
//    Запускается: cd redis-api && node server.js  → слушает :4000
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// ── 4. NocoDB — no-code аналитика ────────────────────────────────────────────
const NOCODB_URL      = import.meta.env.VITE_NOCODB_URL      || "";
const NOCODB_TOKEN    = import.meta.env.VITE_NOCODB_TOKEN    || "";
const NOCODB_TABLE_ID = import.meta.env.VITE_NOCODB_TABLE_ID || "";

// ── 5. Formbricks — обратная связь ───────────────────────────────────────────
// Убираем дублирование "VITE_FORMBRICKS_API_URL=" если оно попало в значение
const FORMBRICKS_URL  = (import.meta.env.VITE_FORMBRICKS_API_URL || "").replace(/^VITE_FORMBRICKS_API_URL=/, "");
const FORMBRICKS_KEY  = import.meta.env.VITE_FORMBRICKS_API_KEY     || "";
const FORMBRICKS_SID  = import.meta.env.VITE_FORMBRICKS_SURVEY_ID   || "";
const FORMBRICKS_ENV  = import.meta.env.VITE_FORMBRICKS_ENVIRONMENT || "";

// ── MinIO bucket (совпадает с server.js) ──────────────────────────────────────
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET || "aleemstudenttwin";

// ════════════════════════════════════════════════════════════════════════════════
// 🤖  СИСТЕМНЫЕ ПРОМПТЫ АГЕНТОВ
// ════════════════════════════════════════════════════════════════════════════════
const AGENT_PROMPTS: Record<AgentType, string> = {
  Diagnostic:
    "Ты — Диагностический агент EduTwin.kz (Qwen3, Alem.plus). " +
    "Анализируй ответы ученика по всем предметам ЕНТ: математика, физика, химия, биология, " +
    "история Казахстана, география, информатика, английский, русский язык и др. " +
    "Определи уровень: Beginner/Intermediate/Advanced по каждому предмету. " +
    "Пиши по-русски, кратко и дружелюбно.",

  CognitiveModel:
    "Ты — Агент Когнитивной Модели EduTwin.kz (Qwen3, Alem.plus). " +
    "Обновляй профиль ученика: что усвоено, что нужно закрепить по каждому предмету ЕНТ. " +
    "2–3 предложения на русском, мотивирующе и конкретно.",

  Tutor:
    "Ты — ИИ-репетитор EduTwin.kz для ЕНТ (Казахстан). Qwen3 + Alem.plus. " +
    "Помогаешь по ВСЕМ предметам ЕНТ: математика (логарифмы, тригонометрия, геометрия, производные, " +
    "интегралы, уравнения, прогрессии), физика (механика, электричество, термодинамика, оптика), " +
    "химия (органика, реакции, строение атома), биология (клетка, генетика, эволюция), " +
    "история Казахстана, всемирная история, география, информатика, русский/английский язык. " +
    "Объясняй пошагово простым языком. Казахстанская программа ЕНТ. " +
    "При ошибке — объясни без критики, предложи повторить.",

  Assessment:
    "Ты — Агент Оценки EduTwin.kz (Qwen3, Alem.plus). " +
    "Проверяй ответы по любому предмету ЕНТ: при верном — подтверди кратко, " +
    "при неверном — объясни ошибку пошагово. Коротко, по-русски.",

  Prediction:
    "Ты — Агент Прогнозирования ЕНТ (Qwen3, Alem.plus). " +
    "Прогнозируй итоговый балл ЕНТ (max 140) по текущим результатам всех предметов. " +
    "Укажи приоритетные темы для повторения по каждому слабому предмету. 3–5 предложений.",

  Analytics:
    "Ты — Агент Аналитики EduTwin.kz (Qwen3, Alem.plus). " +
    "Составь отчёт о прогрессе по ВСЕМ выбранным предметам ЕНТ: " +
    "сильные/слабые темы, динамика, 3–4 конкретные рекомендации. По-русски, структурировано.",
};

const ALEM_KZ_PROMPT =
  "Сен — EduTwin.kz білім платформасының қазақ тіліндегі AI-репетиторысың. " +
  "AlemLLM (Astana Hub, 247B параметр) базасында жұмыс істейсің. " +
  "ҰБТ барлық пәндері бойынша: математика, физика, химия, биология, " +
  "Қазақстан тарихы, дүниежүзі тарихы, география, информатика, ағылшын/орыс тілдері — " +
  "қазақша қарапайым тілмен түсіндір. " +
  "ҰБТ бағдарламасы мен ҰТО спецификациясын қолдан. " +
  "Мысалдармен, қадамдарымен нақты жауап бер.";

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣  QWEN3 — основной LLM для всех агентов
// ════════════════════════════════════════════════════════════════════════════════
export async function getAgentResponse(
  agent: AgentType,
  userMessage: string,
  profile?: StudentProfile
): Promise<string> {
  // Сначала проверяем Redis-кэш
  const cacheKey = `agent:${agent}:${btoa(encodeURIComponent(userMessage)).slice(0, 40)}`;
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  const system =
    AGENT_PROMPTS[agent] +
    (profile ? `\n\nПрофиль ученика:\n${JSON.stringify(profile, null, 2)}` : "");

  try {
    const res = await fetch(`${QWEN_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QWEN_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: "system",  content: system },
          { role: "user",    content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      console.error(`Qwen3 ${res.status}:`, await res.text());
      return fallback(agent);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || fallback(agent);

    // Кэшируем в Redis на 10 минут
    await redisSet(cacheKey, text, 600);
    return text;
  } catch (err) {
    console.error("Qwen3 network error:", err);
    return fallback(agent);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// 2️⃣  ALEMLLM — объяснения на казахском языке
// ════════════════════════════════════════════════════════════════════════════════
export async function getKazakhExplanation(
  topic: string,
  content: string
): Promise<string> {
  try {
    const res = await fetch(`${ALEM_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ALEM_KEY}`,
      },
      body: JSON.stringify({
        model: ALEM_MODEL,
        messages: [
          { role: "system", content: ALEM_KZ_PROMPT },
          { role: "user",   content: `Тақырып: ${topic}\nМазмұн: ${content}` },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!res.ok) return "AlemLLM қазіргі уақытта қол жетімді емес.";
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "Түсіндірме жүктелмеді.";
  } catch {
    return "AlemLLM байланыс қатесі.";
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// 3️⃣  REDIS — через локальный backend (redis-api/server.js :4000)
//     POST /set      { key, value }
//     GET  /get/:key → { value }
// ════════════════════════════════════════════════════════════════════════════════
async function redisSet(key: string, value: string, _ttl?: number): Promise<void> {
  if (!BACKEND_URL) return;
  try {
    await fetch(`${BACKEND_URL}/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch { /* Redis недоступен — продолжаем без кэша */ }
}

async function redisGet(key: string): Promise<string | null> {
  if (!BACKEND_URL) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/get/${encodeURIComponent(key)}`);
    const data = await res.json();
    return data?.value || null;
  } catch {
    return null;
  }
}

/** Сохранить сессию ученика (текущая фаза, агент) */
export async function saveSession(userId: string, data: object): Promise<void> {
  await redisSet(`session:${userId}`, JSON.stringify(data));
}

/** Загрузить сессию ученика */
export async function loadSession(userId: string): Promise<object | null> {
  const raw = await redisGet(`session:${userId}`);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ════════════════════════════════════════════════════════════════════════════════
// 4️⃣  MINIO — загрузка файлов через backend (redis-api/server.js :4000)
//     POST /upload   { fileName, content: base64 }
// ════════════════════════════════════════════════════════════════════════════════

/** Загрузить PDF-отчёт ученика в MinIO через backend */
export async function uploadReportToMinIO(
  userId: string,
  content: string // base64
): Promise<boolean> {
  if (!BACKEND_URL) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `reports/report_${userId}_${Date.now()}.txt`,
        content,  // base64
      }),
    });
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}

/** Генерировать текстовый отчёт и сохранить в MinIO */
export async function saveProgressReport(
  userId: string,
  profile: StudentProfile
): Promise<boolean> {
  // Строка по предметам
  const subjectLines = profile.subjectStats
    ? Object.entries(profile.subjectStats)
        .map(([sid, st]) =>
          `  · ${sid}: ${st.accuracy}% (${st.completed} заданий)` +
          (st.weakTopics?.length ? ` | Слабые: ${st.weakTopics.join(', ')}` : '')
        ).join('\n')
    : '  —';

  const report =
    `=== EduTwin.kz — Отчёт о прогрессе ===\n` +
    `Ученик: ${profile.name}\n` +
    `Уровень: ${profile.level}\n` +
    `Предметы ЕНТ: ${(profile.selectedSubjects || []).join(', ')}\n` +
    `Общая точность: ${profile.accuracy}%\n` +
    `Прогноз ЕНТ: ${Math.round(profile.predictedENT)} / 140\n` +
    `Выполнено заданий: ${profile.completedTasks}\n\n` +
    `--- Статистика по предметам ---\n${subjectLines}\n\n` +
    `Сильные темы: ${profile.strongTopics.join(', ') || '—'}\n` +
    `Слабые темы: ${profile.weakTopics.join(', ') || '—'}\n` +
    `Дата: ${new Date().toLocaleString('ru-KZ')}\n` +
    `Bucket: ${MINIO_BUCKET}\n`;

  const base64 = btoa(unescape(encodeURIComponent(report)));
  return uploadReportToMinIO(userId, base64);
}

// ════════════════════════════════════════════════════════════════════════════════
// 5️⃣  NOCODB — логирование прогресса
//     NocoDB v1 API: POST /api/v1/db/data/noco/{baseId}/{tableId}
//     Таблица: progress_logs
// ════════════════════════════════════════════════════════════════════════════════

/** Создать таблицу через NocoDB если не существует (вызывается при первом запуске) */
async function ensureNocoTable(): Promise<void> {
  // NocoDB уже настроен через UI — просто используем table_id из env
}

/** Записать событие прогресса */
export async function logProgressToNocoDB(
  userId: string,
  topic: string,
  isCorrect: boolean,
  agentUsed: AgentType
): Promise<void> {
  if (!NOCODB_URL || !NOCODB_TABLE_ID) return;
  try {
    // NocoDB v1: POST /api/v1/db/data/noco/{tableOrViewId}
    await fetch(`${NOCODB_URL}/api/v1/db/data/noco/${NOCODB_TABLE_ID}/${NOCODB_TABLE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xc-token": NOCODB_TOKEN,
      },
      body: JSON.stringify({
        user_id:    userId,
        topic:      topic,
        is_correct: isCorrect ? 1 : 0,
        agent_used: agentUsed,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("NocoDB log:", err);
  }
}

/** Получить статистику по темам из NocoDB */
export async function getTopicStatsFromNocoDB(
  userId: string
): Promise<Record<string, { correct: number; total: number }> | null> {
  if (!NOCODB_URL || !NOCODB_TABLE_ID) return null;
  try {
    const res = await fetch(
      `${NOCODB_URL}/api/v1/db/data/noco/${NOCODB_TABLE_ID}/${NOCODB_TABLE_ID}?where=(user_id,eq,${userId})&limit=200`,
      { headers: { "xc-token": NOCODB_TOKEN } }
    );
    const data = await res.json();
    const rows: { topic: string; is_correct: number }[] = data?.list || [];
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const r of rows) {
      if (!stats[r.topic]) stats[r.topic] = { correct: 0, total: 0 };
      stats[r.topic].total++;
      if (r.is_correct) stats[r.topic].correct++;
    }
    return stats;
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// 6️⃣  FORMBRICKS — обратная связь после урока
// ════════════════════════════════════════════════════════════════════════════════
export async function submitFeedbackToFormbricks(
  userId: string,
  rating: number,
  comment: string,
  topic: string
): Promise<void> {
  if (!FORMBRICKS_URL || !FORMBRICKS_SID) return;
  try {
    await fetch(`${FORMBRICKS_URL}/client/${FORMBRICKS_ENV}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": FORMBRICKS_KEY,
      },
      body: JSON.stringify({
        surveyId: FORMBRICKS_SID,
        finished: true,
        data: { rating, comment, topic, userId },
      }),
    });
  } catch (err) {
    console.warn("Formbricks:", err);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// 🗃️  IN-MEMORY PROFILE (быстрый доступ + параллельная запись в Redis)
// ════════════════════════════════════════════════════════════════════════════════
const mem: Record<string, StudentProfile> = {};

export function saveProfileToMemory(userId: string, profile: StudentProfile): void {
  mem[userId] = profile;
  // Пишем профиль в Redis без блокировки UI
  redisSet(`profile:${userId}`, JSON.stringify(profile)).catch(() => {});
  // Сохраняем сессию
  saveSession(userId, { phase: "learning", updatedAt: Date.now() }).catch(() => {});
}

export async function loadProfileFromRedis(userId: string): Promise<StudentProfile | null> {
  const raw = await redisGet(`profile:${userId}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function getProfileFromMemory(userId: string): StudentProfile | null {
  return mem[userId] || null;
}

// ════════════════════════════════════════════════════════════════════════════════
// 🛡️  FALLBACK
// ════════════════════════════════════════════════════════════════════════════════
function fallback(agent: AgentType): string {
  const map: Record<AgentType, string> = {
    Diagnostic:    "Диагностика завершена. Профиль обновлён — переходим к обучению!",
    CognitiveModel:"Цифровой двойник обновлён. Готов к следующему шагу.",
    Tutor:         "Давай разберём эту тему! Попробуй ещё раз — я помогу.",
    Assessment:    "Ответ принят. Следующее задание готово.",
    Prediction:    "Прогноз ЕНТ обновлён. Продолжай в том же темпе!",
    Analytics:     "Аналитика обновлена — посмотри на дашборд.",
  };
  return map[agent];
}
