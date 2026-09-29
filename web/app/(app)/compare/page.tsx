import { ComparisonWorkbench } from "@/components/comparison-workbench";
import { currentUser } from "@/lib/auth";
import { listRuns } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const user = (await currentUser())!;
  const runs = listRuns(user.id, 100).filter((run) => run.status === "completed" && run.result);
  return runs.length >= 2 ? (
    <ComparisonWorkbench runs={runs} />
  ) : (
    <section className="section">
      <p className="eyebrow">Comparison unavailable</p>
      <h1 className="page-title">
        Нужно два
        <br />
        запуска.
      </h1>
      <div className="empty">Завершите минимум две симуляции, чтобы сравнить стратегии.</div>
    </section>
  );
}
