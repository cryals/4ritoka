import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser, safeError, verifySameOrigin } from "@/lib/api";
import { createScenario, listScenarios } from "@/lib/db";
import { formatZodError, scenarioInputSchema } from "@/lib/validation";

export async function GET(): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  return NextResponse.json({ scenarios: listScenarios(user.id) });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const parsed = scenarioInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(formatZodError(parsed.error), 422);
  try {
    const scenario = createScenario(user.id, parsed.data.name, parsed.data.description, parsed.data.config);
    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    return apiError(safeError(error), 500);
  }
}
