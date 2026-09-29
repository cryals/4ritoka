---
sidebar_position: 3
title: Python Simulation API
---

# Python Simulation API

FastAPI-адаптер в `python_service/` предоставляет движок расчётов по HTTP, не дублируя бизнес-логику из `domain/`, `scenario/`, `engine/` и `analytics/`.

## Endpoints

- `GET /health` — готовность процесса;
- `GET /version` — версия контракта;
- `POST /simulate` — один расчёт;
- `POST /compare` — сравнение нескольких конфигураций.

`POST /simulate` принимает объект `scenario` и необязательные переопределения `seed`, `batches_count`, `simulation_duration`, `breakdown_probability`. Ответ содержит `analytics`, `report`, `event_log` и `raw_data`.

Размер тела запроса, таймаут и разрешённый development-origin настраиваются переменными окружения. Ошибки конфигурации возвращаются как безопасные JSON-ответы без traceback.

Интерактивная схема доступна на `http://127.0.0.1:8000/docs` после запуска сервиса.

