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

В production они доступны с префиксом `/python-api`, например `GET /python-api/health`.

## `POST /simulate`

Запрос:

```json
{
  "scenario": {
    "scenario_name": "Base line",
    "simulation_duration": 480,
    "stages": [],
    "batches": {}
  },
  "overrides": {
    "seed": 42,
    "batches_count": 100,
    "simulation_duration": 600,
    "breakdown_probability": 0.03
  }
}
```

`overrides` необязателен. Неизвестные поля внутри него запрещены. Ограничения: до 100 000 партий, длительность до 10 000 000 модельных единиц, `seed` до `2 147 483 647`, вероятность от `0` до `1`.

Ответ содержит:

- `scenario_name`, `simulation_time`, `seed`;
- `analytics.general`, `analytics.stages`, `analytics.machines`, `analytics.batches`;
- `report` с узким местом, выводами и рекомендациями;
- `event_log` — журнал результата каждого события;
- `raw_data` — временные ряды очередей, буферов и состояний станков.

## `POST /compare`

Принимает от 2 до 20 объектов формата `SimulationRequest`. Сервис запускает их последовательно внутри запроса и возвращает полные результаты плюс агрегированную таблицу `comparison`. Для пользовательского интерфейса основным способом сравнения остаётся `/fabriq/api/runs/compare`: он использует уже сохранённые результаты и не запускает модели повторно.

## Ошибки и ограничения

- `400` — некорректный `Content-Length`;
- `413` — тело больше `FABRIQ_MAX_REQUEST_BYTES`;
- `422` — ошибка Pydantic или предметной конфигурации;
- `504` — превышен `FABRIQ_SIMULATION_TIMEOUT`;
- `500` — необработанная ошибка процесса.

CPU-bound расчёт переносится через `asyncio.to_thread`, поэтому event loop продолжает принимать health-запросы. Таймаут ограничивает ожидание HTTP-ответа, но не является механизмом жёсткого завершения Python thread.

Интерактивная схема доступна локально на `http://127.0.0.1:8000/docs`, а в production — на [https://ritoka.stopco.ru/python-api/docs](https://ritoka.stopco.ru/python-api/docs). Swagger включается переменной `FABRIQ_API_DOCS=true`.
