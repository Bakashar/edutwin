# EduTwin Backend Server

Redis кэш + MinIO хранилище для EduTwin.kz.

## Запуск

```bash
cd redis-api
npm install
node server.js
# → http://localhost:4000
```

## Эндпоинты

| Метод | URL | Тело | Описание |
|---|---|---|---|
| POST | /set | `{key, value, ex?}` | Сохранить в Redis (ex = TTL сек) |
| GET | /get/:key | — | Получить из Redis |
| DELETE | /del/:key | — | Удалить из Redis |
| POST | /upload | `{fileName, content: base64}` | Загрузить файл в MinIO |
| GET | /file/:fileName | — | Presigned URL из MinIO |
| GET | /health | — | Проверка Redis + MinIO |
