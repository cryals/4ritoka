import { NextResponse } from "next/server";
import { isErrorResponse, requireApiUser } from "@/lib/api";
import { listPresets } from "@/lib/presets";

export async function GET(): Promise<NextResponse> {
  const user = await requireApiUser();
  if (isErrorResponse(user)) return user;
  return NextResponse.json({ presets: listPresets() });
}
