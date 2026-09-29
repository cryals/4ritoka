import { notFound } from "next/navigation";
import { RunView } from "@/components/run-view";
import { currentUser } from "@/lib/auth";
import { getRun } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await currentUser())!;
  const run = getRun(user.id, (await params).id);
  if (!run) notFound();
  return <RunView initialRun={run} />;
}
