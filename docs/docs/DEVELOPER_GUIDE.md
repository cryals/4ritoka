---
title: Руководство разработчика
---

# Руководство разработчика

## Границы системы

- `web/` владеет UI, authentication, application data и очередью;
- `python_service/` переводит HTTP-запросы в вызовы engine;
- `domain/`, `scenario/`, `engine/`, `analytics/` не зависят от web-слоя;
- `reporting/` формирует чистый JSON payload и CLI-экспорты.

Не дублируйте правила симуляции в TypeScript. Если меняется контракт, синхронно обновляйте Pydantic, Zod/TypeScript и contract tests.

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

## Безопасность

Все пользовательские сущности фильтруются по `user_id`. Mutating routes требуют cookie-session и same-origin. Не логируйте scenario JSON, пароли, session tokens и environment secrets.

## UI

Используйте semantic HTML, явные labels, keyboard navigation, `:focus-visible`, `prefers-reduced-motion` и табличную альтернативу графикам. Визуальный язык проекта — безрамочный чёрно-белый layout с крупной типографикой, тонкими линиями и редким сигнальным цветом.
