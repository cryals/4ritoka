---
title: REST API web-платформы
---

# REST API web-платформы

Next.js route handlers обслуживают браузер и являются основным публичным application API. Локальный префикс — `/api`, production-префикс — `/fabriq/api`.

## Общие правила

- Формат запросов и ответов — JSON, кроме export endpoints.
- Защищённые методы требуют cookie `fabriq_session`.
- Изменяющие запросы проверяют same-origin.
- Ошибка возвращается как `{ "error": "сообщение" }` с подходящим HTTP-статусом.
- Пользователь получает только сущности со своим `user_id`.

## Авторизация

| Метод и маршрут | Назначение | Ответ |
| --- | --- | --- |
| `POST /api/auth/register` | Создать аккаунт и сессию | `201 { user }` |
| `POST /api/auth/login` | Проверить пароль и создать сессию | `200 { user }` |
| `POST /api/auth/logout` | Удалить текущую сессию | `200 { ok: true }` |
| `GET /api/auth/me` | Получить текущего пользователя | `{ user }`, включая `null` |

Тело регистрации и входа:

```json
{
  "email": "user@example.com",
  "password": "minimum-10-characters"
}
```

Возможные ответы: `401` для неверной пары email/пароль, `409` для существующего аккаунта, `422` для ошибки формата.

## Сценарии

| Метод и маршрут | Назначение |
| --- | --- |
| `GET /api/presets` | Список встроенных JSON-конфигураций |
| `GET /api/scenarios` | Сценарии текущего пользователя |
| `POST /api/scenarios` | Создать сценарий |
| `GET /api/scenarios/:id` | Получить один сценарий |
| `PUT /api/scenarios/:id` | Полностью обновить сценарий |
| `DELETE /api/scenarios/:id` | Удалить сценарий |

Тело `POST` и `PUT`:

```json
{
  "name": "Линия после модернизации",
  "description": "Второй станок на упаковке",
  "config": {
    "scenario_name": "packaging-v2",
    "simulation_duration": 480,
    "seed": 42,
    "stages": [],
    "batches": {}
  }
}
```

Валидация выполняется дважды: Zod проверяет web-контракт до записи, а Python-сценарный слой проверяет предметные связи перед расчётом.

## Запуски

| Метод и маршрут | Назначение |
| --- | --- |
| `GET /api/runs?limit=50` | История, максимум 200 записей |
| `POST /api/runs` | Поставить расчёт в очередь |
| `GET /api/runs/:id` | Метаданные и результат, если он готов |
| `DELETE /api/runs/:id` | Отменить `pending` или `running` задачу |
| `GET /api/runs/:id/status` | Короткий ответ для polling |
| `GET /api/runs/:id/result` | Только готовый payload |
| `GET /api/runs/:id/export?format=json` | Полный JSON |
| `GET /api/runs/:id/export?format=csv` | CSV по этапам |
| `GET /api/runs/:id/export?format=md` | Markdown-сводка |

Запуск из сохранённого сценария:

```json
{
  "scenarioId": "0c5e7445-871d-4ad4-8ee0-6c933ae78e31",
  "overrides": {
    "seed": 42,
    "batches_count": 500
  }
}
```

Для preset вместо `scenarioId` передаётся `presetId`. Успешная постановка возвращает:

```json
{
  "runId": "8ad7de85-c8ec-4d62-9ba3-da20dc0878a8",
  "status": "pending"
}
```

HTTP-статус — `202 Accepted`. Ограничение создания — 10 запусков на пользователя за 60 секунд.

## Сравнение

`POST /api/runs/compare` принимает от 2 до 10 идентификаторов завершённых запусков:

```json
{
  "runIds": ["uuid-1", "uuid-2"]
}
```

Сервис не повторяет вычисления, а строит comparison из сохранённых результатов. В ответ входят выпуск, средний цикл, брак, throughput, completion rate, средняя очередь и средняя загрузка станков.

## Настройки и health check

| Метод и маршрут | Назначение |
| --- | --- |
| `PUT /api/preferences/language` | Сохранить `ru` или `en` |
| `GET /api/health` | Проверить SQLite и Python API |

Health response:

```json
{
  "status": "ok",
  "database": true,
  "simulation": true
}
```

При недоступности одного из компонентов endpoint возвращает `503` и `status: "degraded"`.
