---
title: Конфигурация
---

# Конфигурация

Все runtime-настройки передаются через environment variables. Значения в таблице совпадают с текущим кодом и `docker-compose.yml`.

## Production и маршрутизация

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `FABRIQ_DOMAIN` | `localhost` | Host, который обслуживает Caddy |
| `FABRIQ_PUBLIC_ORIGIN` | `http://localhost` | Разрешённый origin Python API |
| `FABRIQ_BASE_PATH` | `/fabriq` | Base path Next.js |
| `DOCS_SITE_URL` | `https://ritoka.stopco.ru` | Публичный origin документации |
| `DOCS_BASE_URL` | `/docs/` | Base path Docusaurus |

## Web, SQLite и очередь

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `FABRIQ_DATABASE_PATH` | `web/data/fabriq.db` | Путь к SQLite |
| `FABRIQ_CONFIG_DIR` | `configs/` | Каталог встроенных preset |
| `FABRIQ_PYTHON_API_URL` | `http://127.0.0.1:8000` | Внутренний адрес FastAPI |
| `FABRIQ_MAX_CONCURRENT_RUNS` | `2` | Одновременные workers |
| `FABRIQ_RUN_TIMEOUT_MS` | `120000` | Таймаут HTTP-вызова FastAPI в миллисекундах |
| `FABRIQ_SESSION_DAYS` | `30` | Срок cookie-session |
| `FABRIQ_SECURE_COOKIES` | `false` | Установить флаг `Secure` у cookie |

В Docker Compose `FABRIQ_DATABASE_PATH` установлен в `/data/fabriq.db`, `FABRIQ_CONFIG_DIR` — в `/app/configs`, а Python API доступен как `http://simulation:8000`.

## Backup и retention

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `FABRIQ_BACKUP_DIR` | `web/backups/` | Каталог копий SQLite |
| `FABRIQ_BACKUP_INTERVAL_HOURS` | `24` | Интервал автоматического backup |
| `FABRIQ_RETENTION_DAYS` | `7` | Возраст terminal runs для общей очистки |
| `FABRIQ_TERMINAL_RUN_RETENTION_DAYS` | `90` | Совместимая очистка `failed/cancelled` при recovery |

## Python API

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `FABRIQ_API_DOCS` | `false` | Включить Swagger `/docs` |
| `FABRIQ_ALLOWED_ORIGINS` | `http://localhost:3000` | CORS origins через запятую |
| `FABRIQ_MAX_REQUEST_BYTES` | `2097152` | Максимальный размер тела, 2 MiB |
| `FABRIQ_SIMULATION_TIMEOUT` | `120` | Таймаут расчёта в секундах |

## Рекомендуемые production-значения

```dotenv
FABRIQ_DOMAIN=ritoka.stopco.ru
FABRIQ_PUBLIC_ORIGIN=https://ritoka.stopco.ru
FABRIQ_BASE_PATH=/fabriq
FABRIQ_API_DOCS=true
FABRIQ_SECURE_COOKIES=true
FABRIQ_MAX_CONCURRENT_RUNS=2
FABRIQ_BACKUP_INTERVAL_HOURS=24
FABRIQ_RETENTION_DAYS=7
FABRIQ_SIMULATION_TIMEOUT=120
```

После изменения build-time переменных `FABRIQ_BASE_PATH` или `DOCS_BASE_URL` соответствующее приложение нужно пересобрать.
