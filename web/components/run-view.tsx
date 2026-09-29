"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, X } from "lucide-react";
import type { SimulationRun } from "@/lib/types";
import { dateTime, number, percent } from "@/lib/format";

const ResultCharts = dynamic(() => import("./result-charts").then((module) => module.ResultCharts), {
  loading: () => <div className="empty">Подготовка графиков…</div>,
  ssr: false,
});

export function RunView({ initialRun }: { initialRun: SimulationRun }) {
  const [run, setRun] = useState(initialRun);
  const [tab, setTab] = useState<"stages" | "machines" | "batches" | "events">("stages");

  useEffect(() => {
    if (!["pending", "running"].includes(run.status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/runs/${run.id}`, { cache: "no-store" });
      if (response.ok) setRun(((await response.json()) as { run: SimulationRun }).run);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [run.id, run.status]);

  async function cancel() {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/runs/${run.id}`, { method: "DELETE" });
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/runs/${run.id}`);
    if (response.ok) setRun(((await response.json()) as { run: SimulationRun }).run);
  }

  const result = run.result;
  const general = result?.analytics.general;
  return (
    <>
      <section className="section">
        <Link className="button" href="/runs">
          <ArrowLeft aria-hidden="true" size={17} />К истории
        </Link>
        <div className="section-head" style={{ marginTop: 30 }}>
          <div>
            <p className="context-line">
              Запуск {run.id.slice(0, 8)} · {dateTime(run.createdAt)}
            </p>
            <h1 className="page-title">{run.scenarioName}</h1>
          </div>
          <span className={`status status-${run.status}`}>{run.status}</span>
        </div>
        {run.errorMessage ? (
          <div className="error" role="alert">
            {run.errorMessage} Попробуйте изменить сценарий или повторить запуск.
          </div>
        ) : null}
        {["pending", "running"].includes(run.status) ? (
          <div className="empty" aria-live="polite">
            Симуляция выполняется. Страница обновит результат автоматически.
            <div style={{ marginTop: 18 }}>
              <button className="button button-danger" onClick={cancel} type="button">
                <X aria-hidden="true" size={17} />
                Отменить
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {general && result ? (
        <>
          <section className="section">
            <div className="metric-strip">
              <div className="metric">
                <span className="metric-label">Выпуск</span>
                <span className="metric-value">{number(general.output_units, 0)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Готовность</span>
                <span className="metric-value">{percent(general.completion_rate)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Брак</span>
                <span className="metric-value">{percent(general.rejection_rate)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Темп</span>
                <span className="metric-value">{number(general.throughput)}</span>
              </div>
            </div>
          </section>
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Динамика</h2>
            </div>
            <ResultCharts result={result} />
          </section>
          <section className="section split">
            <div>
              <h2 className="section-title">Рекомендации</h2>
            </div>
            <ol>
              {result.report.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ol>
          </section>
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Детали</h2>
            </div>
            <div className="tabs" role="tablist" aria-label="Result details">
              {(["stages", "machines", "batches", "events"] as const).map((item) => (
                <button
                  className="tab"
                  data-active={tab === item}
                  key={item}
                  onClick={() => setTab(item)}
                  role="tab"
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <ResultTable run={run} tab={tab} />
          </section>
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Экспорт</h2>
            </div>
            <div className="form-actions">
              {(["json", "csv", "md"] as const).map((format) => (
        <a className="button" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/runs/${run.id}/export?format=${format}`} key={format}>
                  <Download aria-hidden="true" size={17} />
                  {format.toUpperCase()}
                </a>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

function ResultTable({
  run,
  tab,
}: {
  run: SimulationRun;
  tab: "stages" | "machines" | "batches" | "events";
}) {
  const result = run.result!;
  const rows: Array<Record<string, unknown>> =
    tab === "events"
      ? (result.event_log as unknown as Array<Record<string, unknown>>)
      : (result.analytics[tab] as unknown as Array<Record<string, unknown>>);
  const columns = rows.length ? Object.keys(rows[0]).filter((key) => key !== "details") : [];
  return rows.length ? (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 500).map((row, index) => (
            <tr key={`${tab}-${index}`}>
              {columns.map((column) => (
                <td key={column}>
                  {typeof row[column] === "number"
                    ? number(row[column] as number)
                    : String(row[column] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 500 ? (
        <p className="field-help">Показаны первые 500 записей. Полный журнал доступен в JSON.</p>
      ) : null}
    </div>
  ) : (
    <div className="empty">Нет данных для отображения.</div>
  );
}
