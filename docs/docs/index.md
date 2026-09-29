---
slug: /
title: Fabriq
---

# Fabriq

Fabriq — многопользовательская web-платформа для дискретно-событийного моделирования производственных линий. Она помогает проверить пропускную способность, очереди, загрузку оборудования, поломки и брак до изменения реального процесса.

## Что входит в проект

| Контур | Назначение | Реализация |
| --- | --- | --- |
| Рабочее место | Сценарии, запуски, результаты и сравнение | Next.js 16, React 19, TypeScript |
| Application API | Авторизация, CRUD, очередь и экспорт | Next.js Route Handlers |
| Хранилище | Пользователи, сессии, сценарии и история | SQLite, WAL, `better-sqlite3` |
| Расчётный сервис | Проверка запроса и запуск модели | FastAPI, Pydantic |
| Движок | Очередь событий и состояние производства | Python |
| Аналитика | Метрики, узкие места и рекомендации | Python |
| CLI и отчёты | Пакетные запуски, JSON, CSV, TXT и SVG | Python |
| Production | Маршрутизация, HTTPS и процессы | Docker Compose, Caddy |
| Материалы | Документация и автономная презентация | Docusaurus, HTML/CSS/JS |

## Как проходит один расчёт

```text
Пользователь
    │ создаёт или выбирает сценарий
    ▼
Next.js API ── сохраняет run со статусом pending ──► SQLite
    │                                                   │
    └──────────── встроенная очередь ◄──────────────────┘
                         │
                         ▼
                  FastAPI /simulate
                         │
                         ▼
                  Python DES engine
                         │
                         ▼
           analytics + report + event log
                         │
                         ▼
                 SQLite → web-интерфейс
```

Задача проходит состояния `pending → running → completed`. При ошибке она получает статус `failed`, при отмене — `cancelled`. После перезапуска незавершённые задания возвращаются в очередь.

## Рабочие адреса

- [Fabriq Web](https://ritoka.stopco.ru/fabriq)
- [Презентация](https://ritoka.stopco.ru/preza/)
- [Swagger Python API](https://ritoka.stopco.ru/python-api/docs)
- [Исходный код](https://github.com/cryals/4ritoka)

## Быстрый локальный запуск

На Windows используйте единый launcher:

```powershell
.\START-FABRIQ.bat
```

Он проверит Python и Node.js, установит зависимости, выполнит production-сборки и запустит четыре локальных процесса. После запуска доступны:

- приложение: `http://127.0.0.1:3000`;
- Python API: `http://127.0.0.1:8000`;
- презентация: `http://127.0.0.1:8080`;
- документация: `http://127.0.0.1:3001/docs/`.

## Куда идти дальше

- [Руководство пользователя](./USER_GUIDE.md) — работа со сценарием от входа до сравнения.
- [Web-платформа](./web-application.md) — страницы, данные, очередь и безопасность.
- [REST API](./api-reference.md) — маршруты Next.js и форматы ответов.
- [Python Simulation API](./python-api.md) — прямой HTTP-контракт движка.
- [Конфигурация](./configuration.md) — все переменные окружения.
- [Развёртывание](./deployment.md) — Docker Compose и Caddy.
- [Эксплуатация](./operations.md) — health checks, backup, retention и диагностика.
- [Архитектура движка](./architecture.md) — event loop и обработчики событий.
