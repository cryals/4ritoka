# Fabriq

Fabriq — веб-приложение для дискретно-событийного моделирования производственных линий. Пользовательский контур построен на Next.js, React и TypeScript; сценарии, запуски и результаты хранятся в SQLite; расчёты выполняет существующий Python-движок через FastAPI.

## Презентация

- [Открыть HTML-презентацию](PREZA-WEB/index.html)
- [Текст доклада на 15 минут](PREZA-WEB/DOKLAD.md)
- После запуска `START-FABRIQ.bat` презентация доступна на `http://127.0.0.1:8080`.

Production:

- приложение: [ritoka.stopco.ru/fabriq](https://ritoka.stopco.ru/fabriq);
- презентация: [ritoka.stopco.ru/preza](https://ritoka.stopco.ru/preza/);
- документация: [ritoka.stopco.ru/docs](https://ritoka.stopco.ru/docs/);
- Swagger: [ritoka.stopco.ru/python-api/docs](https://ritoka.stopco.ru/python-api/docs).

## Архитектура

```text
Browser → Next.js REST layer → SQLite
                         └──→ FastAPI → simulation engine
```

- `web/` — сайт, REST API, авторизация, очередь расчётов и SQLite;
- `python_service/` — HTTP-адаптер Python-движка;
- `domain/`, `scenario/`, `engine/`, `analytics/` — модель и расчёты;
- `reporting/`, `visualization/` — отчёты и SVG для CLI;
- `app/main.py` — CLI;
- `docs/` — документация Docusaurus.

## Локальный запуск

### Windows: запуск одной командой

Дважды щёлкните `START-FABRIQ.bat` или выполните его из консоли. Скрипт проверит версии Python и Node.js, установит зависимости, соберёт web-приложение и запустит API, сайт и презентацию. Логи и PID-файлы сохраняются в `.temp/`.

```powershell
.\START-FABRIQ.bat
.\START-FABRIQ.bat status
.\START-FABRIQ.bat stop
.\START-FABRIQ.bat logs
```

После успешного запуска BAT выводит статусы и все локальные ссылки, включая документацию на `http://127.0.0.1:3001/docs/`.

### Ручной запуск

Python API:

```powershell
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn python_service.main:app --host 127.0.0.1 --port 8000
```

Web-приложение во втором терминале:

```powershell
cd web
npm ci
npm run dev
```

Откройте `http://127.0.0.1:3000`. Первый зарегистрированный пользователь получает роль `admin`.

## Production

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Compose запускает web-приложение, Python API и Caddy. SQLite, резервные копии и логи находятся в persistent volumes. Переменные окружения описаны в `.env.example` и `web/.env.example`.

## Тесты

```powershell
.venv\Scripts\python -m pytest -q
cd web
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Резервные копии

```powershell
cd web
npm run backup
npm run backup:verify -- ./backups/<backup-file>.db
```

Полная документация:

- [`docs/docs/USER_GUIDE.md`](docs/docs/USER_GUIDE.md) — пользовательский путь;
- [`docs/docs/web-application.md`](docs/docs/web-application.md) — web-архитектура;
- [`docs/docs/api-reference.md`](docs/docs/api-reference.md) — application REST API;
- [`docs/docs/configuration.md`](docs/docs/configuration.md) — переменные окружения;
- [`docs/docs/deployment.md`](docs/docs/deployment.md) — deployment;
- [`docs/docs/operations.md`](docs/docs/operations.md) — backup, retention и диагностика.
