import Link from "next/link";
import { Plus } from "lucide-react";
import { RunList } from "@/components/run-list";
import { currentUser } from "@/lib/auth";
import { listRuns } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const user = (await currentUser())!;
  const runs = listRuns(user.id, 200);
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Execution ledger / SQLite</p>
          <h1 className="display">
            История
            <br />
            запусков.
          </h1>
        </div>
        <div className="hero-actions">
          <p className="hero-copy">
            Каждый запуск сохраняет входные параметры, статус, метрики и журнал событий.
          </p>
          <Link className="button button-primary" href="/runs/new">
            <Plus aria-hidden="true" size={18} />
            Новый запуск
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Все запуски</h2>
          <span className="section-index">({String(runs.length).padStart(2, "0")})</span>
        </div>
        <RunList runs={runs} />
      </section>
    </>
  );
}
