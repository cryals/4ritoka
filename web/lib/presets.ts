import fs from "node:fs";
import path from "node:path";
import type { ScenarioConfig } from "./types";
import { scenarioConfigSchema } from "./validation";

export type Preset = { id: string; name: string; description: string; config: ScenarioConfig };

function configDirectory(): string {
  const configured = process.env.FABRIQ_CONFIG_DIR;
  return configured
    ? path.resolve(/* turbopackIgnore: true */ configured)
    : path.join(process.cwd(), "..", "configs");
}

export function listPresets(): Preset[] {
  const directory = configDirectory();
  if (!fs.existsSync(/* turbopackIgnore: true */ directory)) return [];
  return fs
    .readdirSync(/* turbopackIgnore: true */ directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((fileName) => {
      const filePath = path.join(/* turbopackIgnore: true */ directory, fileName);
      const raw = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ filePath, "utf8")) as unknown;
      const config = scenarioConfigSchema.parse(raw);
      return {
        id: fileName.replace(/\.json$/, ""),
        name: config.scenario_name,
        description: config.description ?? "",
        config,
      };
    });
}

export function getPreset(id: string): Preset | null {
  return listPresets().find((preset) => preset.id === id) ?? null;
}
