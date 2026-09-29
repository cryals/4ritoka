---
title: Руководство разработчика
---

# Руководство разработчика

## Границы системы

- `web/` владеет UI, authentication, application data и очередью;
- `python_service/` переводит HTTP-запросы в вызовы engine;
- `domain/`, `scenario/`, `engine/`, `analytics/` не зависят от web-слоя;
- `reporting/` формирует чистый JSON payload и CLI-экспорты.
- `visualization/` создаёт независимые SVG для CLI;
- `PREZA-WEB/` и `docs/` не участвуют в расчёте и разворачиваются как статика.

Не дублируйте правила симуляции в TypeScript. Если меняется контракт, синхронно обновляйте Pydantic, Zod/TypeScript и contract tests.

## Карта изменения контракта

| Изменение | Что обновить |
| --- | --- |
| Поле сценария | `scenario/`, `python_service/schemas.py`, `web/lib/validation.ts`, editor и тесты |
| Поле результата | Python DTO/analytics, `python_service/service.py`, `web/lib/types.ts`, UI и export |
| Новый статус запуска | SQLite CHECK, TypeScript union, runner, API и интерфейс |
| Новая таблица | Идемпотентная migration, индексы, integration test и backup verification |
| Новый public route | route handler, auth/origin policy, документация и E2E |

## Python

```powershell
.venv\Scripts\python -m pytest -q
.venv\Scripts\python -m compileall app domain scenario engine analytics reporting visualization python_service tests
```

## Web

```powershell
cd web
npm ci
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## SQLite

Миграции идемпотентны и выполняются при открытии базы. Любое изменение схемы требует новой версии в `schema_migrations`, индексов под реальные запросы и integration test на временной базе. Не запускайте несколько экземпляров встроенного worker поверх одного SQLite-файла.

В тестах задавайте временный `FABRIQ_DATABASE_PATH`; не используйте production volume. Операции, которые записывают и результат, и terminal status, должны оставаться транзакционными.

## Безопасность

Все пользовательские сущности фильтруются по `user_id`. Mutating routes требуют cookie-session и same-origin. Не логируйте scenario JSON, пароли, session tokens и environment secrets. Новые API-ошибки должны быть безопасными для показа пользователю и не содержать traceback или SQL.

## UI

Используйте semantic HTML, явные labels, keyboard navigation, `:focus-visible`, `prefers-reduced-motion` и табличную альтернативу графикам. Визуальный язык проекта — безрамочный чёрно-белый layout с крупной типографикой, тонкими линиями и редким сигнальным цветом.

Документация продолжает этот язык: системная типографика, строгая сетка, жёлтый signal color, прямые границы без декоративных карточек. Hover применяется только к интерактивным элементам.

## Перед commit

```powershell
.venv\Scripts\python -m pytest -q
cd web
npm run typecheck
npm run lint
npm test
npm run build
cd ..\docs
npm run build
```

Для изменения пользовательского потока дополнительно запускайте `npm run test:e2e` в `web/`.
