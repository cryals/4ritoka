import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser, verifySameOrigin } from "@/lib/api";
import { createRun, getScenario, listRuns, recentRunCount } from "@/lib/db";
import { getPreset } from "@/lib/presets";
import { enqueueRun } from "@/lib/runner";
import { formatZodError, runInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  return NextResponse.json({ runs: listRuns(user.id, limit) });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  if (recentRunCount(user.id) >= 10) return apiError("Too many runs. Wait one minute and retry.", 429);
  const parsed = runInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(formatZodError(parsed.error), 422);

  const saved = parsed.data.scenarioId ? getScenario(user.id, parsed.data.scenarioId) : null;
  const preset = parsed.data.presetId ? getPreset(parsed.data.presetId) : null;
  const source = saved ?? preset;
  if (!source) return apiError("Scenario not found", 404);
  const seed = parsed.data.overrides.seed ?? source.config.seed ?? null;
  const runId = createRun(
    user.id,
    saved?.id ?? null,
    source.name,
    source.config,
    seed,
    parsed.data.overrides,
  );
  enqueueRun(runId);
  return NextResponse.json({ runId, status: "pending" }, { status: 202 });
}
