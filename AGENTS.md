# AGENTS.md

## Назначение проекта

Fabriq моделирует производственные линии. React/Next.js отвечает за пользовательский интерфейс и application layer, SQLite — за пользователей и историю, FastAPI — за доступ к Python simulation engine. Бизнес-логика расчётов должна оставаться независимой от HTTP и UI.

## Карта репозитория

| Путь | Назначение |
|---|---|
| `web/app/` | Страницы и REST route handlers Next.js. |
| `web/components/` | React-компоненты интерфейса и графиков. |
| `web/lib/` | SQLite, auth, очередь, validation и Python client. |
| `python_service/` | FastAPI endpoints и Pydantic-контракты. |
| `domain/`, `scenario/`, `engine/`, `analytics/` | Python-модель, валидация, симуляция и метрики. |
| `reporting/`, `visualization/` | Независимые отчёты и CLI-графики. |
| `configs/` | Базовые конфигурации сценариев. |
| `tests/`, `web/e2e/` | Python, TypeScript и browser-тесты. |
| `docs/` | Docusaurus-документация. |

## Инварианты архитектуры

- Browser обращается только к `/api/*` Next.js; Python API не публикуется пользователю напрямую.
- Python engine остаётся источником истины для результата и аналитики.
- Изменения сценария применяются к глубокой копии входного JSON.
- Все user-owned запросы фильтруются по `user_id`.
- SQLite работает в WAL-режиме; один web-процесс обслуживает встроенную очередь.
- Для горизонтального масштабирования сначала нужно вынести очередь и БД.
- Секреты, базы, backups, результаты тестов и build output не коммитятся.

## Команды проверки

```powershell
.venv\Scripts\python -m pytest -q
cd web
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
cd ..\docs
npm run build
```

## Правила изменений

1. Не переносить simulation rules в API route или React-компоненты.
2. Любой новый вход проверять Zod/Pydantic-схемой и возвращать безопасную ошибку.
3. Для mutating endpoints требовать сессию и same-origin проверку.
4. Сохранять доступность: label для controls, focus-visible, semantic HTML, keyboard path и reduced motion.
5. Сохранять визуальное направление: безрамочная композиция, крупная типографика, тонкие разделители, минимум декоративных контейнеров; hover только у интерактивных элементов.
6. После изменения схемы добавить идемпотентную миграцию и тест на временной SQLite.
7. После изменения контракта обновить Python и TypeScript типы, тесты и документацию.

## Потенциально полезные skills

- `brainstorming` — уточнение требований перед новым поведением или крупным компонентом.
- `codebase-memory` — архитектурный поиск, call graph и impact analysis, если граф доступен.
- `context7-mcp` — актуальная документация библиотек и framework API.
- `frontend-design` — визуальное направление и уход от шаблонного dashboard-дизайна.
- `ui-ux-pro-max` — дизайн-система, responsive, accessibility и UX-проверки.
- `react-dev` — типобезопасные React/TypeScript-компоненты и hooks.
- `vercel-react-best-practices` — производительность Next.js/React и границы client/server.
- `web-design-guidelines` — финальный аудит форм, focus, semantics и interactions.
- `motion-react` — только для осмысленных анимаций с reduced-motion fallback.
- `vercel-react-view-transitions` — только при добавлении переходов между маршрутами.
- `computer-use:computer-use` — ручная проверка desktop/mobile в браузере.
- `imagegen` — создание самостоятельных растровых материалов; не для UI, который лучше реализовать HTML/CSS.
- `pdf:pdf`, `documents:documents`, `spreadsheets:Spreadsheets`, `presentations:Presentations` — экспорт и проверка соответствующих артефактов, если появится такая задача.
- `openai-docs` — только для интеграций с OpenAI/Codex.
- `skill-creator`, `plugin-creator`, `plugin-management:plugin-management`, `find-skills` — расширение агентного окружения, не runtime приложения.
- `sites:sites-building`, `sites:sites-hosting` — только при явном переносе проекта на Sites.
- `telegram-bot-grammy`, `telegram-mini-app` — только если будет отдельный Telegram-клиент.

Минимальный набор для обычной UI-задачи: `brainstorming` → `frontend-design`/`ui-ux-pro-max` → `react-dev` → `vercel-react-best-practices` → `web-design-guidelines`.
