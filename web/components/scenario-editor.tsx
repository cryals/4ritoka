"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Save, Trash2 } from "lucide-react";
import type { Preset } from "@/lib/presets";
import type { Scenario } from "@/lib/types";
import { ScenarioPipeline } from "./scenario-pipeline";

const fallbackConfig = {
  scenario_name: "new_scenario",
  description: "",
  simulation_duration: 100,
  seed: 42,
  stages: [
    {
      stage_id: "stage_1",
      name: "Этап 1",
      queue_limit: 5,
      buffer_capacity: 2,
      reject_probability: 0,
      next_stage_id: null,
      machines: [
        {
          machine_id: "machine_1",
          name: "Станок 1",
          processing_time: 1,
          breakdown_probability: 0,
          repair_time: 1,
        },
      ],
    },
  ],
  batches: { mode: "equal_intervals", count: 20, size: 1, arrival_interval: 1, route: ["stage_1"] },
};

export function ScenarioEditor({
  scenario,
  presets,
  initialPreset,
}: {
  scenario?: Scenario;
  presets: Preset[];
  initialPreset?: Preset;
}) {
  const router = useRouter();
  const [name, setName] = useState(scenario?.name ?? initialPreset?.name ?? "Новый сценарий");
  const [description, setDescription] = useState(scenario?.description ?? initialPreset?.description ?? "");
  const [json, setJson] = useState(
    JSON.stringify(scenario?.config ?? initialPreset?.config ?? fallbackConfig, null, 2),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const parsed = useMemo(() => {
    try {
      return JSON.parse(json) as typeof fallbackConfig;
    } catch {
      return null;
    }
  }, [json]);

  function loadPreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setName(preset.name);
    setDescription(preset.description);
    setJson(JSON.stringify(preset.config, null, 2));
    setError("");
  }

  async function save(duplicate = false) {
    setError("");
    let config: unknown;
    try {
      config = JSON.parse(json);
    } catch {
      setError("JSON содержит синтаксическую ошибку.");
      return;
    }
    setPending(true);
    const target = scenario && !duplicate
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/scenarios/${scenario.id}`
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/scenarios`;
    const response = await fetch(target, {
      method: scenario && !duplicate ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: duplicate ? `${name} — копия` : name, description, config }),
    });
    const body = (await response.json()) as { error?: string; scenario?: Scenario };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Не удалось сохранить сценарий.");
      return;
    }
    router.push(`/scenarios/${body.scenario!.id}`);
    router.refresh();
  }

  async function remove() {
    if (!scenario || !window.confirm("Удалить сценарий? История запусков сохранится.")) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/scenarios/${scenario.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Не удалось удалить сценарий.");
      return;
    }
    router.push("/scenarios");
    router.refresh();
  }

  return (
    <>
      <section className="section">
        <div className="section-head">
          <h1 className="page-title">{scenario ? "Редактор" : "Новый сценарий"}</h1>
        </div>
        <div className="split">
          <div className="form">
            <div className="field">
              <label htmlFor="scenario-name">Название</label>
              <input
                className="input"
                id="scenario-name"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>
            <div className="field">
              <label htmlFor="description">Описание</label>
              <textarea
                className="input"
                id="description"
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                value={description}
              />
            </div>
            <div className="field">
              <label htmlFor="preset">Взять базовый сценарий</label>
              <select
                className="select"
                defaultValue=""
                id="preset"
                onChange={(event) => loadPreset(event.target.value)}
              >
                <option disabled value="">
                  Выберите шаблон
                </option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="scenario-json">Конфигурация JSON</label>
            <textarea
              aria-describedby="json-help"
              className="textarea"
              id="scenario-json"
              onChange={(event) => setJson(event.target.value)}
              spellCheck={false}
              value={json}
            />
            <p className="field-help" id="json-help">
              Вероятности — от 0 до 1; capacity и limits — целые числа либо null.
            </p>
          </div>
        </div>
        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="form-actions">
          <button
            className="button button-primary"
            disabled={pending}
            onClick={() => save(false)}
            type="button"
          >
            <Save aria-hidden="true" size={17} />
            {pending ? "Сохранение…" : "Сохранить"}
          </button>
          {scenario ? (
            <button className="button" disabled={pending} onClick={() => save(true)} type="button">
              <Copy aria-hidden="true" size={17} />
              Создать копию
            </button>
          ) : null}
          {scenario ? (
            <button className="button button-danger" disabled={pending} onClick={remove} type="button">
              <Trash2 aria-hidden="true" size={17} />
              Удалить
            </button>
          ) : null}
        </div>
      </section>
      {parsed ? (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Линия</h2>
          </div>
          <ScenarioPipeline config={parsed} />
        </section>
      ) : null}
    </>
  );
}
