import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "./auth";
import type { User } from "./types";

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiUser(): Promise<User | NextResponse> {
  const user = await currentUser();
  return user ?? apiError("Authentication required", 401);
}

export function isErrorResponse(value: User | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function verifySameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const requestHost =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
    if (new URL(origin).host !== requestHost) return apiError("Invalid request origin", 403);
  } catch {
    return apiError("Invalid request origin", 403);
  }
  return null;
}

export function safeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint failed")) return "This value already exists";
    return error.message;
  }
  return "Unexpected server error";
}
