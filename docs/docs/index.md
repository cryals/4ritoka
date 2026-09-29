---
slug: /
title: Fabriq
---

# Fabriq

Fabriq — система дискретно-событийного моделирования производственных линий с полноценным web-приложением, Python-движком и SQLite-хранилищем.

Начните с разделов:

- [Руководство пользователя](./USER_GUIDE.md);
- [Web-приложение](./web-application.md);
- [Python Simulation API](./python-api.md);
- [Развёртывание](./deployment.md);
- [Архитектура движка](./architecture.md).

## Быстрый старт

```powershell
.venv\Scripts\python -m uvicorn python_service.main:app --host 127.0.0.1 --port 8000
cd web
npm ci
npm run dev
```

Откройте `http://localhost:3000`, зарегистрируйтесь и выберите базовый сценарий.
