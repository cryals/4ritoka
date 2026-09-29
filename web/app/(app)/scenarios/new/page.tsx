import { ScenarioEditor } from "@/components/scenario-editor";
import { listPresets } from "@/lib/presets";

export default async function NewScenarioPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const presets = listPresets();
  const query = await searchParams;
  const selected = presets.find((preset) => preset.id === query.preset);
  return <ScenarioEditor initialPreset={selected} presets={presets} />;
}
