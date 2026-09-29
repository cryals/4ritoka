# TASK.md — завершённый переход на web-приложение

## Definition of Done

- [x] Пользовательский интерфейс реализован на Next.js + React + TypeScript.
- [x] Python simulation engine сохранён как единственный источник расчётов.
- [x] FastAPI предоставляет health, version, simulation и comparison contracts.
- [x] Browser работает через Node.js REST layer, без прямого доступа к Python API.
- [x] SQLite хранит пользователей, сессии, сценарии, запуски и результаты.
- [x] Включены WAL, busy timeout, индексы, транзакционное сохранение результата и migrations table.
- [x] Реализованы регистрация, password hashing, HttpOnly sessions, роли и user isolation.
- [x] Mutating endpoints защищены same-origin проверкой; запуск имеет rate limit.
- [x] Реализована background queue с ограничением параллелизма, отменой и восстановлением после рестарта.
- [x] Старые failed/cancelled задачи очищаются по retention policy.
- [x] Реализованы CRUD сценариев, presets, JSON editor, основные overrides и визуализация линии.
- [x] Реализованы история, polling статуса, полный результат, рекомендации и таблицы деталей.
- [x] Реализованы графики очередей, загрузки, цикла партий, отказов, выпуска и событий.
- [x] Реализованы JSON, CSV и Markdown exports.
- [x] Реализовано сравнение нескольких запусков и KPI-визуализация.
- [x] Выбор RU/EN сохраняется в настройках пользователя.
- [x] Интерфейс адаптивен, имеет focus states, semantic controls, skip link и reduced-motion режим.
- [x] Дизайн соответствует выбранному направлению: безрамочная композиция, крупная типографика, тонкие разделители и hover только у интерактивных элементов.
- [x] Python API покрыт contract, invalid input, repeatability, all-config и 20-way concurrency тестами.
- [x] TypeScript validation и SQLite migration покрыты unit tests.
- [x] Browser E2E покрывает регистрацию, сценарий, два запуска, результат, историю и сравнение; mobile layout проверяется отдельно.
- [x] Production build web-приложения и Docusaurus проходят.
- [x] Dockerfiles, Compose, persistent volumes, healthchecks, Caddy HTTPS и restart policy подготовлены.
- [x] Ручной и периодический SQLite backup реализован; целостность восстановленной копии проверена.
- [x] CI запускает Python tests, TypeScript checks, unit tests, build и Compose validation.
- [x] README, developer instructions и Docusaurus описывают новую архитектуру и команды.
- [x] Старый UI, его специализированные helpers, runtime-зависимости, deployment URL и документация удалены.
- [x] Сгенерированные базы, backups, build output и test reports исключены из Git.

## Принятые решения

- Next.js используется как UI и REST application layer, чтобы не добавлять отдельный Node backend.
- `better-sqlite3` выбран как минимальный query layer: для одного процесса и примерно 20 одновременных пользователей ORM не даёт достаточной выгоды.
- Очередь остаётся внутри web-процесса с состоянием в SQLite; Redis не нужен при текущем масштабе.
- Результат хранится целиком в SQLite. Выделять event log в отдельное хранилище следует только после фактического роста объёма.
- Caddy выбран за короткую конфигурацию и автоматический HTTPS.

## Проверки

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
