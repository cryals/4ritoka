import { LaunchForm } from "@/components/launch-form";
import { currentUser } from "@/lib/auth";
import { listScenarios } from "@/lib/db";
import { listPresets } from "@/lib/presets";

export const dynamic = "force-dynamic";

export default async function NewRunPage() {
  const user = (await currentUser())!;
  return (
    <section className="section split">
      <div>
        <p className="eyebrow">Execution / queued worker</p>
        <h1 className="page-title">
          Новый
          <br />
          запуск.
        </h1>
        <p className="lede">
          Переопределения применяются к копии сценария. Исходная модель останется неизменной.
        </p>
      </div>
      <LaunchForm presets={listPresets()} scenarios={listScenarios(user.id)} />
    </section>
  );
}
