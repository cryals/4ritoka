---
title: Эксплуатация
---

# Эксплуатация

Этот раздел описывает проверки после запуска, резервное копирование, обновление и диагностику production-контура.

## Нормальное состояние

```bash
docker compose ps
```

Ожидаемое состояние:

- `web` — `Up (healthy)`;
- `simulation` — `Up (healthy)`;
- `caddy` — `Up`.

Публичные проверки:

```bash
curl -fsS https://ritoka.stopco.ru/fabriq/api/health
curl -fsS https://ritoka.stopco.ru/python-api/health
curl -fsSI https://ritoka.stopco.ru/preza/
curl -fsSI https://ritoka.stopco.ru/docs/
```

Application health считается успешным, только когда доступны и SQLite, и Python API.

## Логи

```bash
docker compose logs --tail=200 web
docker compose logs --tail=200 simulation
docker compose logs --tail=200 caddy
docker compose logs -f web simulation
```

Для каждого контейнера включён Docker driver `json-file` с `max-size: 10m` и `max-file: 3`. Максимальный объём container stdout/stderr ограничен примерно 30 МБ на сервис. Python-файлы логов находятся в volume `fabriq_logs`.

## История и retention

При старте web-процесса и затем раз в семь суток выполняется очистка terminal runs старше `FABRIQ_RETENTION_DAYS`. Удаление `simulation_runs` каскадно удаляет соответствующий `simulation_results`.

Проверить выполнение можно по сообщению:

```text
[retention] deleted N terminal runs older than 7 days
```

## Резервные копии

Автоматическая копия создаётся работающим web-процессом через SQLite backup API. Ручной вариант:

```bash
cd web
npm run backup
npm run backup:verify -- ./backups/<backup-file>.db
```

Production volumes:

- `fabriq_data` — рабочая SQLite;
- `fabriq_backups` — резервные копии;
- `fabriq_logs` — Python-логи;
- `caddy_data`, `caddy_config` — состояние reverse proxy.

Копия в том же сервере защищает от повреждения рабочей базы, но не от потери хоста. Периодически переносите проверенный backup на отдельное хранилище.

## Восстановление SQLite

1. Проверьте backup командой `backup:verify`.
2. Остановите только сервис `web`: `docker compose stop web`.
3. Сохраните текущую базу отдельным файлом.
4. Замените `/data/fabriq.db` внутри volume проверенной копией.
5. Запустите `docker compose up -d web`.
6. Проверьте `/fabriq/api/health`, вход и один тестовый запуск.

Не заменяйте SQLite во время активной записи.

## Обновление

```bash
git pull --ff-only
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Статические каталоги `PREZA-WEB/` и `docs/build/` подключены к Caddy read-only. После изменения документации сначала выполните `npm ci && npm run build` в `docs/`.

## Типовые неисправности

### `/fabriq/api/health` возвращает `503`

Посмотрите поля `database` и `simulation`. Если `database=false`, проверьте volume, права и свободное место. Если `simulation=false`, проверьте контейнер `simulation`, `/health` и внутренний адрес `FABRIQ_PYTHON_API_URL`.

### Запуск долго остаётся `pending`

Проверьте логи `web`, число активных задач и `FABRIQ_MAX_CONCURRENT_RUNS`. Очередь ограничивает параллелизм намеренно, чтобы тяжёлые расчёты не исчерпали CPU и память.

### Презентация или документация открывается без CSS

Проверьте base path и реальные asset URL в HTML. Для документации должны использоваться `/docs/assets/...`, для презентации — `/preza/styles.css` и `/preza/script.js`. Caddy обслуживает оба каталога через `handle_path`.

### После перезапуска задача снова выполняется

Это штатный recovery: записи со статусом `running` переводятся в `pending`, потому что процесс не может доказать, что прерванный расчёт завершился. Повторяемость обеспечивается snapshot конфигурации и сохранённым seed.

## Масштабирование

Текущий production-контур намеренно использует один web-инстанс, встроенную очередь и SQLite WAL. Увеличивать число web-контейнеров поверх одного файла нельзя. Для горизонтального масштабирования сначала вынесите очередь в broker и данные в PostgreSQL, затем масштабируйте Python workers независимо от интерфейса.
