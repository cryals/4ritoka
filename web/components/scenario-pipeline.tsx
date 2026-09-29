import type { ScenarioConfig } from "@/lib/types";

export function ScenarioPipeline({ config }: { config: ScenarioConfig }) {
  return (
    <div className="pipeline" aria-label="Production line stages">
      {config.stages.map((stage, index) => (
        <div className="pipeline-stage" key={stage.stage_id}>
          <span className="pipeline-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="pipeline-name">{stage.name || stage.stage_id}</span>
          <span className="pipeline-meta">
            {stage.machines.length} machine(s) · queue {stage.queue_limit ?? "∞"}
          </span>
        </div>
      ))}
    </div>
  );
}
