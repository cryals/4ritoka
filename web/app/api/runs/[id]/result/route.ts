import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser } from "@/lib/api";
import { getRun } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const run = getRun(user.id, (await context.params).id);
  if (!run) return apiError("Run not found", 404);
  if (run.status !== "completed" || !run.result) return apiError("Run result is not ready", 409);
  return NextResponse.json({ result: run.result });
}
