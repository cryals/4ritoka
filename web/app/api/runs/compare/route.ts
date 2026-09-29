import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser } from "@/lib/api";
import { getRun } from "@/lib/db";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const body = (await request.json().catch(() => null)) as { runIds?: string[] } | null;
  if (!body?.runIds || body.runIds.length < 2 || body.runIds.length > 10) {
    return apiError("Select between 2 and 10 runs", 422);
  }
  const runs = body.runIds.map((id) => getRun(user.id, id));
  if (runs.some((run) => !run?.result)) return apiError("Every selected run must be completed", 422);
  const comparison = runs.map((run) => {
    const analytics = run!.result!.analytics;
    const general = analytics.general;
    const avg = (rows: Array<Record<string, unknown>>, key: string) =>
      rows.length ? rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length : 0;
    return {
      run_id: run!.id,
      scenario_name: run!.scenarioName,
      output_units: general.output_units,
      average_cycle_time: general.average_cycle_time,
      rejection_rate: general.rejection_rate,
      throughput: general.throughput,
      completion_rate: general.completion_rate,
      average_queue_length: avg(analytics.stages, "average_queue_length"),
      average_machine_utilization: avg(analytics.machines, "utilization"),
    };
  });
  return NextResponse.json({ comparison });
}
