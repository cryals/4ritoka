import type { ScenarioConfig, SimulationPayload } from "./types";

const API_URL = process.env.FABRIQ_PYTHON_API_URL ?? "http://127.0.0.1:8000";

export async function runPythonSimulation(
  scenario: ScenarioConfig,
  overrides: Record<string, unknown>,
): Promise<SimulationPayload> {
  const timeoutMs = Number(process.env.FABRIQ_RUN_TIMEOUT_MS ?? 120_000);
  const response = await fetch(`${API_URL}/simulate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenario, overrides }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ detail: response.statusText }))) as {
      detail?: string;
    };
    throw new Error(body.detail ?? `Simulation service returned ${response.status}`);
  }
  return response.json() as Promise<SimulationPayload>;
}

export async function pythonHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
