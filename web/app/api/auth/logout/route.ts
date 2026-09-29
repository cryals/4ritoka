import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth";
import { verifySameOrigin } from "@/lib/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = verifySameOrigin(request);
  if (originError) return originError;
  await revokeSession();
  return NextResponse.json({ ok: true });
}
