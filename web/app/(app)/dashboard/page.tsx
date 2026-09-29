import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { listRuns, listScenarios } from "@/lib/db";
import { number, percent } from "@/lib/format";
import { RunList } from "@/components/run-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await currentUser())!;
  const runs = listRuns(user.id, 8);
  const completed = runs.find((run) => run.result)?.result?.analytics.general;
  const scenarios = listScenarios(user.id);
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Fabriq operational model / live workspace</p>
          <h1 className="display">
            Производство
            <br />
            до запуска.
          </h1>
        </div>
        <div className="hero-actions">
          <p className="hero-copy">
            Проверяйте нагрузку, очереди и надёжность линии на модели — до изменений в цехе.
          </p>
          <Link className="button button-primary" href="/runs/new">
            Новый запуск <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Последний срез</h2>
          <span className="section-index">(01)</span>
        </div>
        <div className="metric-strip">
          <div className="metric">
            <span className="metric-label">Выпуск</span>
            <span className="metric-value">{number(completed?.output_units ?? 0, 0)}</span>
            <span className="metric-note">единиц</span>
          </div>
          <div className="metric">
            <span className="metric-label">Готовность</span>
            <span className="metric-value">{percent(completed?.completion_rate ?? 0)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Брак</span>
            <span className="metric-value">{percent(completed?.rejection_rate ?? 0)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Темп</span>
            <span className="metric-value">{number(completed?.throughput ?? 0)}</span>
            <span className="metric-note">ед./время</span>
          </div>
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">Состояние пространства</p>
          <h2 className="section-title">
            {scenarios.length} сценариев
            <br />
            {runs.length} запусков
          </h2>
        </div>
        <div>
          <div className="section-head">
            <h2 className="section-title">Последние запуски</h2>
            <Link className="text-link" href="/runs">
              Все запуски
            </Link>
          </div>
          <RunList runs={runs} />
        </div>
      </section>
    </>
  );
}
