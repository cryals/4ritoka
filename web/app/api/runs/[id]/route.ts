import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser, verifySameOrigin } from "@/lib/api";
import { cancelRun, getRun } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const run = getRun(user.id, (await context.params).id);
  return run ? NextResponse.json({ run }) : apiError("Run not found", 404);
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  return cancelRun(user.id, (await context.params).id)
    ? NextResponse.json({ ok: true })
    : apiError("Run is already finished or was not found", 409);
}
