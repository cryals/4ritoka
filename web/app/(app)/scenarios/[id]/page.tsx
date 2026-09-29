import { notFound } from "next/navigation";
import { ScenarioEditor } from "@/components/scenario-editor";
import { currentUser } from "@/lib/auth";
import { getScenario } from "@/lib/db";
import { listPresets } from "@/lib/presets";

export const dynamic = "force-dynamic";

export default async function EditScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await currentUser())!;
  const scenario = getScenario(user.id, (await params).id);
  if (!scenario) notFound();
  return <ScenarioEditor presets={listPresets()} scenario={scenario} />;
}
