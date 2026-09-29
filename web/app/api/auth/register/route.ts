import { NextRequest, NextResponse } from "next/server";
import { issueSession, hashPassword } from "@/lib/auth";
import { apiError, safeError, verifySameOrigin } from "@/lib/api";
import { createUser, findUserByEmail } from "@/lib/db";
import { credentialsSchema, formatZodError } from "@/lib/validation";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(formatZodError(parsed.error), 422);
  if (findUserByEmail(parsed.data.email)) return apiError("Account already exists", 409);
  try {
    const user = createUser(parsed.data.email, hashPassword(parsed.data.password));
    await issueSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(safeError(error), 500);
  }
}
