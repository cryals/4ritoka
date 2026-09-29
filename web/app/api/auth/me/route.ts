import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ user: await currentUser() });
}
