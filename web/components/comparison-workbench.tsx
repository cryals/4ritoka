"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { SimulationRun } from "@/lib/types";
import { number, percent } from "@/lib/format";

const ComparisonChart = dynamic(() => import("./comparison-chart").then((module) => module.ComparisonChart), {
  ssr: false,
  loading: () => <div className="empty">Подготовка сравнения…</div>,
});

export type ComparisonRow = {
  run_id: string;
  scenario_name: string;
  output_units: number;
  average_cycle_time: number;
  rejection_rate: number;
  throughput: number;
  completion_rate: number;
  average_queue_length: number;
  average_machine_utilization: number;
};

export function ComparisonWorkbench({ runs }: { runs: SimulationRun[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 10
          ? [...current, id]
          : current,
    );
  }

  async function compare() {
    setPending(true);
    setError("");
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/runs/compare`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runIds: selected }),
    });
    const body = (await response.json()) as { error?: string; comparison?: ComparisonRow[] };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Сравнение не построено.");
      return;
    }
    setRows(body.comparison ?? []);
  }

  return (
    <>
      <section className="section split">
        <div>
          <p className="eyebrow">Comparison set / 2—10 runs</p>
          <h1 className="page-title">
            Сравнить
            <br />
            решения.
          </h1>
          <p className="lede">
            Выберите завершённые запуски. Сравнение использует уже рассчитанные данные и не запускает движок
            повторно.
          </p>
        </div>
        <div>
          <div className="list">
            {runs.map((run) => (
              <label className="list-row" key={run.id} style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <input checked={selected.includes(run.id)} onChange={() => toggle(run.id)} type="checkbox" />
                <span className="list-main">
                  <span className="list-title">{run.scenarioName}</span>
                  <span className="list-meta">{run.id.slice(0, 8)}</span>
                </span>
                <span className="mono">{number(run.result!.analytics.general.output_units, 0)} ед.</span>
              </label>
            ))}
          </div>
          {error ? (
            <div className="error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button
              className="button button-primary"
              disabled={pending || selected.length < 2}
              onClick={compare}
              type="button"
            >
              {pending ? "Сравнение…" : `Сравнить (${selected.length})`}
            </button>
          </div>
        </div>
      </section>
      {rows.length ? (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Результат</h2>
            <span className="section-index">(01)</span>
          </div>
          <ComparisonChart rows={rows} />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Сценарий</th>
                  <th>Выпуск</th>
                  <th>Цикл</th>
                  <th>Брак</th>
                  <th>Темп</th>
                  <th>Загрузка</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.run_id}>
                    <td>{row.scenario_name}</td>
                    <td>{number(row.output_units, 0)}</td>
                    <td>{number(row.average_cycle_time)}</td>
                    <td>{percent(row.rejection_rate)}</td>
                    <td>{number(row.throughput)}</td>
                    <td>{percent(row.average_machine_utilization)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
