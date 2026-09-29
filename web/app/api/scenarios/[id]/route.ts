import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser, verifySameOrigin } from "@/lib/api";
import { deleteScenario, getScenario, updateScenario } from "@/lib/db";
import { formatZodError, scenarioInputSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const scenario = getScenario(user.id, (await context.params).id);
  return scenario ? NextResponse.json({ scenario }) : apiError("Scenario not found", 404);
}

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const parsed = scenarioInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(formatZodError(parsed.error), 422);
  const scenario = updateScenario(
    user.id,
    (await context.params).id,
    parsed.data.name,
    parsed.data.description,
    parsed.data.config,
  );
  return scenario ? NextResponse.json({ scenario }) : apiError("Scenario not found", 404);
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  return deleteScenario(user.id, (await context.params).id)
    ? NextResponse.json({ ok: true })
    : apiError("Scenario not found", 404);
}
