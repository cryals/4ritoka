import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SimulationRun } from "@/lib/types";
import { dateTime } from "@/lib/format";

export function RunList({ runs }: { runs: SimulationRun[] }) {
  if (!runs.length)
    return <div className="empty">Нет запусков. Выберите сценарий и запустите первую симуляцию.</div>;
  return (
    <div className="list">
      {runs.map((run) => (
        <Link className="list-row" href={`/runs/${run.id}`} key={run.id}>
          <span className="list-main">
            <span className="list-title">{run.scenarioName}</span>
            <span className="list-meta">{run.id.slice(0, 8)}</span>
          </span>
          <span className={`status status-${run.status}`}>{run.status}</span>
          <span className="list-meta">{dateTime(run.createdAt)}</span>
          <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      ))}
    </div>
  );
}
