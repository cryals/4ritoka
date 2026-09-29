"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import type { Preset } from "@/lib/presets";
import type { Scenario } from "@/lib/types";

export function LaunchForm({ scenarios, presets }: { scenarios: Scenario[]; presets: Preset[] }) {
  const router = useRouter();
  const [source, setSource] = useState(
    scenarios[0] ? `scenario:${scenarios[0].id}` : presets[0] ? `preset:${presets[0].id}` : "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source) return;
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const [kind, id] = source.split(":");
    const optionalNumber = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value === "" ? undefined : Number(value);
    };
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/runs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: kind === "scenario" ? id : undefined,
        presetId: kind === "preset" ? id : undefined,
        overrides: {
          seed: optionalNumber("seed"),
          batches_count: optionalNumber("batches_count"),
          simulation_duration: optionalNumber("simulation_duration"),
          breakdown_probability: optionalNumber("breakdown_probability"),
        },
      }),
    });
    const body = (await response.json()) as { error?: string; runId?: string };
    if (!response.ok) {
      setError(body.error ?? "Запуск не создан.");
      setPending(false);
      return;
    }
    router.push(`/runs/${body.runId}`);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={submit}>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="source">Сценарий</label>
        <select
          className="select"
          id="source"
          onChange={(event) => setSource(event.target.value)}
          required
          value={source}
        >
          {scenarios.length ? (
            <optgroup label="Сохранённые">
              {scenarios.map((item) => (
                <option key={item.id} value={`scenario:${item.id}`}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          <optgroup label="Базовые">
            {presets.map((item) => (
              <option key={item.id} value={`preset:${item.id}`}>
                {item.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="seed">Seed</label>
          <input className="input" id="seed" min="0" name="seed" placeholder="Из сценария" type="number" />
        </div>
        <div className="field">
          <label htmlFor="batches_count">Количество партий</label>
          <input
            className="input"
            id="batches_count"
            min="1"
            name="batches_count"
            placeholder="Из сценария"
            type="number"
          />
        </div>
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="simulation_duration">Длительность</label>
          <input
            className="input"
            id="simulation_duration"
            min="0"
            name="simulation_duration"
            placeholder="Из сценария"
            step="any"
            type="number"
          />
        </div>
        <div className="field">
          <label htmlFor="breakdown_probability">Вероятность поломки</label>
          <input
            className="input"
            id="breakdown_probability"
            max="1"
            min="0"
            name="breakdown_probability"
            placeholder="0…1"
            step="0.01"
            type="number"
          />
        </div>
      </div>
      <button className="button button-primary" disabled={pending || !source} type="submit">
        <Play aria-hidden="true" size={17} />
        {pending ? "Создание запуска…" : "Запустить моделирование"}
      </button>
    </form>
  );
}
