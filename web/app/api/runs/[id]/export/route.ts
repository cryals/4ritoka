import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser } from "@/lib/api";
import { getRun } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

function csv(run: NonNullable<ReturnType<typeof getRun>>): string {
  const rows = run.result?.analytics.stages ?? [];
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    keys.join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key as keyof typeof row])).join(",")),
  ].join("\n");
}

function markdown(run: NonNullable<ReturnType<typeof getRun>>): string {
  const general = run.result!.analytics.general;
  return [
    `# ${run.scenarioName}`,
    "",
    `- Output units: ${general.output_units}`,
    `- Completion rate: ${(general.completion_rate * 100).toFixed(1)}%`,
    `- Rejection rate: ${(general.rejection_rate * 100).toFixed(1)}%`,
    `- Throughput: ${general.throughput.toFixed(3)}`,
    "",
    "## Recommendations",
    ...run.result!.report.recommendations.map((item) => `- ${item}`),
  ].join("\n");
}

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const run = getRun(user.id, (await context.params).id);
  if (!run?.result) return apiError("Completed run not found", 404);
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  if (format === "csv")
    return new NextResponse(csv(run), { headers: { "content-type": "text/csv; charset=utf-8" } });
  if (format === "md")
    return new NextResponse(markdown(run), { headers: { "content-type": "text/markdown; charset=utf-8" } });
  return new NextResponse(JSON.stringify(run.result, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
