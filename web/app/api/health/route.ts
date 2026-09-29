import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { pythonHealth } from "@/lib/python-client";

export async function GET(): Promise<NextResponse> {
  let database = false;
  try {
    getDatabase().prepare("SELECT 1").get();
    database = true;
  } catch {
    database = false;
  }
  const simulation = await pythonHealth();
  const ok = database && simulation;
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", database, simulation },
    { status: ok ? 200 : 503 },
  );
}
