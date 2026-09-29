---
sidebar_position: 4
title: Развёртывание
---

# Развёртывание

Production-контур описан в корневом `docker-compose.yml`:

- `simulation` — Python API;
- `web` — Next.js application server и SQLite;
- `caddy` — reverse proxy и автоматический HTTPS.

Текущий production-домен публикует сервисы по одному origin:

| Путь | Сервис |
| --- | --- |
| `/fabriq` | Next.js UI и application API |
| `/python-api` | FastAPI, health и Swagger |
| `/preza` | Статическая HTML-презентация |
| `/docs` | Статическая Docusaurus-сборка |

## Запуск

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Перед запуском задайте домен и безопасные значения переменных окружения. Каталоги базы, резервных копий и логов подключены как persistent volumes. `web` и `simulation` имеют healthcheck; все три сервиса имеют `restart: unless-stopped`. Caddy зависит от healthy web-процесса и слушает внешний порт, заданный в Compose.

## Сборка документации

Статика документации должна существовать до запуска Caddy:

```bash
cd docs
npm ci
npm run build
cd ..
```

По умолчанию Docusaurus собирается для `/docs/`. Презентация не требует сборщика и монтируется из `PREZA-WEB/`.

## Эксплуатация

Проверяйте `/fabriq/api/health`, свободное место в volumes и успешность ежедневной резервной копии. Перед обновлением создайте и проверьте backup. Docker stdout/stderr ограничен тремя файлами по 10 МБ на сервис, а история завершённых расчётов очищается по сроку `FABRIQ_RETENTION_DAYS`.

Предварительный локальный тест подтвердил 20 успешных параллельных запросов за 0,88 секунды на базовом сценарии. Это проверка конкретного тестового контура, а не production SLA и не предел числа пользователей. Реальная ёмкость зависит от сложности сценариев, CPU, памяти и заданного worker pool.

Один экземпляр web-приложения и SQLite WAL являются сознательно простым стартовым вариантом. Горизонтальное масштабирование потребует вынести очередь и базу данных. Подробные процедуры находятся в разделе [«Эксплуатация»](./operations.md).
