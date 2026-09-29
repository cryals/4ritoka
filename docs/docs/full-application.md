---
sidebar_position: 6
title: Полное приложение
---

# Полное приложение

Fabriq состоит из web-платформы и независимого Python-контура. Браузер никогда не вызывает движок напрямую: Next.js отвечает за пользователей, данные и очередь, а FastAPI предоставляет узкий вычислительный контракт.

```text
web/            Next.js UI, REST API, SQLite и очередь
python_service/ FastAPI-адаптер
app/            Python CLI-точка входа
domain/         общие сущности, enum и DTO
scenario/       загрузка JSON/YAML, валидация и сборка сценариев
engine/         дискретно-событийное ядро
analytics/      расчет метрик
reporting/      экспорт JSON, CSV и TXT
visualization/  SVG-графики
configs/        15 встроенных сценариев
tests/          unit- и интеграционные тесты
PREZA-WEB/      автономная презентация и доклад
docs/           Docusaurus-документация
```

## Основной web-запуск

```powershell
.\START-FABRIQ.bat
```

Для production используется `docker compose up -d --build`. Подробности приведены в [развёртывании](./deployment.md).

## CLI-запуск

```bash
python -m app.main --config configs/base_scenario.json
```

CLI также поддерживает сравнение нескольких сценариев одной командой:

```bash
python -m app.main --config \
  configs/base_scenario.json \
  configs/high_load.json \
  configs/frequent_breakdowns.json
```

CLI принимает любой валидный JSON/YAML-файл. Готовые конфигурации из `configs/` также отображаются как presets в web-интерфейсе.

Поддерживаемые форматы конфигураций:

- `JSON`;
- `YAML`;
- `YML`.

Сценарный слой отдает в ядро объект `ScenarioInput`, включающий:

- `production_line`;
- `batches`;
- `scenario_config`.

## Выходные файлы

Результаты сохраняются в ``results/<scenario_name>/``:

- `report.json` - полный отчет;
- `metrics.csv` - таблица метрик;
- `summary.txt` - краткая сводка;
- `charts/queue_length.svg` - длина очереди по времени;
- `charts/machine_utilization.svg` - загрузка станков;
- `charts/batch_cycle_time.svg` - время прохождения партий.

Если передано несколько конфигураций, дополнительно создается каталог `results/comparison/`:

- `comparison_report.json` - полный сравнительный отчет;
- `comparison.csv` - агрегированная таблица сравнения;
- `comparison_summary.txt` - краткая текстовая сводка.

Логи приложения и ядра сохраняются в `logs/`.

## Гарантии текущей реализации

Приложение поддерживает:

- корректный публичный контракт `SimulationResult` с разделением `events` и `event_log`;
- защиту движка от зависания на нулевых длительностях обработки;
- несколько входных этапов линии при явном маршруте партии;
- автоматическое сравнение сценариев на уровне CLI и reporting;
- расширенные отчеты с bottleneck, problem stages и comparison summary.
- хранение snapshot сценария внутри каждого запуска;
- восстановление незавершённых задач после перезапуска;
- разграничение пользовательских данных;
- автоматические backup и retention;
- экспорт web-результата в JSON, CSV и Markdown.

## Проверка

Полный набор команд описан в разделе [«Проверка и тесты»](./testing.md).
