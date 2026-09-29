import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireApiUser, verifySameOrigin } from "@/lib/api";
import { updateUserLanguage } from "@/lib/db";

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  const body = (await request.json().catch(() => null)) as { language?: string } | null;
  if (body?.language !== "ru" && body?.language !== "en") return apiError("Unsupported language", 422);
  updateUserLanguage(user.id, body.language);
  return NextResponse.json({ ok: true });
}
