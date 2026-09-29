---
sidebar_position: 2
title: Web-приложение
---

# Web-приложение Fabriq

Пользовательский интерфейс находится в `web/` и построен на Next.js, React и TypeScript. Он хранит пользователей, сессии, сценарии, запуски и результаты в SQLite. Расчёты выполняет отдельный Python API.

## Локальный запуск

В первом терминале:

```bash
python -m uvicorn python_service.main:app --host 127.0.0.1 --port 8000
```

Во втором терминале:

```bash
cd web
npm ci
npm run dev
```

Откройте `http://localhost:3000`. Первый зарегистрированный пользователь получает роль администратора.

## Данные

По умолчанию база создаётся в `web/data/fabriq.db`. SQLite работает в WAL-режиме с `busy_timeout=5000`. Путь можно изменить переменной `FABRIQ_DATABASE_PATH`.

Очередь расчётов хранится в базе. После перезапуска незавершённые задания возвращаются в состояние `pending` и запускаются заново. Число параллельных расчётов задаёт `FABRIQ_MAX_CONCURRENT_RUNS`.

## Проверки

```bash
cd web
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Резервное копирование

```bash
cd web
npm run backup
npm run backup:verify -- ./backups/<backup-file>.db
```

Резервные копии нужно переносить на отдельный носитель или объектное хранилище. Для восстановления остановите web-процесс, замените файл базы проверенной копией и снова запустите приложение.

