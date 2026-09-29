import path from "node:path";
import {
  backupDatabase,
  claimRun,
  completeRun,
  deleteOldTerminalRuns,
  failRun,
  getRunInternal,
  pendingRunIds,
  resetInterruptedRuns,
} from "./db";
import { runPythonSimulation } from "./python-client";

const globalRunner = globalThis as typeof globalThis & {
  fabriqQueue?: string[];
  fabriqActive?: Set<string>;
  fabriqBackupTimer?: NodeJS.Timeout;
};

function queue(): string[] {
  return (globalRunner.fabriqQueue ??= []);
}

function active(): Set<string> {
  return (globalRunner.fabriqActive ??= new Set<string>());
}

export function enqueueRun(id: string): void {
  if (!queue().includes(id) && !active().has(id)) queue().push(id);
  setImmediate(processQueue);
}

async function processQueue(): Promise<void> {
  const limit = Math.max(1, Number(process.env.FABRIQ_MAX_CONCURRENT_RUNS ?? 2));
  while (active().size < limit && queue().length > 0) {
    const id = queue().shift()!;
    if (!claimRun(id)) continue;
    active().add(id);
    void execute(id).finally(() => {
      active().delete(id);
      setImmediate(processQueue);
    });
  }
}

async function execute(id: string): Promise<void> {
  try {
    const data = getRunInternal(id);
    if (!data || data.run.status === "cancelled") return;
    const payload = await runPythonSimulation(data.scenario, data.run.parameters);
    const latest = getRunInternal(id);
    if (latest?.run.status !== "cancelled") completeRun(id, payload);
  } catch (error) {
    failRun(id, error instanceof Error ? error.message : "Unknown simulation error");
  }
}

export function recoverRuns(): void {
  resetInterruptedRuns();
  deleteOldTerminalRuns(Number(process.env.FABRIQ_TERMINAL_RUN_RETENTION_DAYS ?? 90));
  for (const id of pendingRunIds()) enqueueRun(id);
  scheduleBackups();
}

function scheduleBackups(): void {
  if (globalRunner.fabriqBackupTimer) return;
  const hours = Math.max(1, Number(process.env.FABRIQ_BACKUP_INTERVAL_HOURS ?? 24));
  globalRunner.fabriqBackupTimer = setInterval(
    () => {
      const stamp = new Date().toISOString().replaceAll(":", "-");
      const directory = process.env.FABRIQ_BACKUP_DIR ?? path.join(process.cwd(), "backups");
      void backupDatabase(path.join(directory, `fabriq-${stamp}.db`)).catch((error) => {
        console.error(
          "Scheduled database backup failed",
          error instanceof Error ? error.message : "unknown error",
        );
      });
    },
    hours * 60 * 60 * 1000,
  );
  globalRunner.fabriqBackupTimer.unref();
}
