import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser } from "@/lib/api";
import { getRun } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const run = getRun(user.id, (await context.params).id);
  return run
    ? NextResponse.json({ id: run.id, status: run.status, errorMessage: run.errorMessage })
    : apiError("Run not found", 404);
}
