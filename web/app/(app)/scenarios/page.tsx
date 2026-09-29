import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { listScenarios } from "@/lib/db";
import { listPresets } from "@/lib/presets";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const user = (await currentUser())!;
  const scenarios = listScenarios(user.id);
  const presets = listPresets();
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Input models / editable JSON</p>
          <h1 className="display">
            Сценарии
            <br />
            линии.
          </h1>
        </div>
        <div className="hero-actions">
          <p className="hero-copy">Соберите маршрут, параметры станков, очереди и поток партий.</p>
          <Link className="button button-primary" href="/scenarios/new">
            <Plus aria-hidden="true" size={18} />
            Создать сценарий
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Сохранённые</h2>
          <span className="section-index">({String(scenarios.length).padStart(2, "0")})</span>
        </div>
        {scenarios.length ? (
          <div className="list">
            {scenarios.map((scenario) => (
              <Link className="list-row" href={`/scenarios/${scenario.id}`} key={scenario.id}>
                <span className="list-main">
                  <span className="list-title">{scenario.name}</span>
                  <span className="list-meta">{scenario.description || scenario.config.scenario_name}</span>
                </span>
                <span className="mono">{scenario.config.stages.length} этапов</span>
                <span className="mono">{scenario.config.batches.count ?? "—"} партий</span>
                <ArrowUpRight aria-hidden="true" size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">Сохранённых сценариев нет. Можно начать с одного из базовых.</div>
        )}
      </section>
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Базовые модели</h2>
          <span className="section-index">({String(presets.length).padStart(2, "0")})</span>
        </div>
        <div className="list">
          {presets.map((preset) => (
            <Link className="list-row" href={`/scenarios/new?preset=${preset.id}`} key={preset.id}>
              <span className="list-main">
                <span className="list-title">{preset.name}</span>
                <span className="list-meta">{preset.description}</span>
              </span>
              <span className="mono">{preset.config.stages.length} этапов</span>
              <span className="mono">seed {preset.config.seed ?? "—"}</span>
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
