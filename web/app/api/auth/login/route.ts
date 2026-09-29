import { NextRequest, NextResponse } from "next/server";
import { issueSession, verifyPassword } from "@/lib/auth";
import { apiError, verifySameOrigin } from "@/lib/api";
import { findUserByEmail } from "@/lib/db";
import { credentialsSchema, formatZodError } from "@/lib/validation";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(formatZodError(parsed.error), 422);
  const user = findUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return apiError("Invalid email or password", 401);
  }
  await issueSession(user.id);
  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    language: user.language,
    createdAt: user.createdAt,
  };
  return NextResponse.json({ user: safeUser });
}
