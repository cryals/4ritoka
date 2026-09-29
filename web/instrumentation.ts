export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { recoverRuns } = await import("./lib/runner");
    const { deleteExpiredRuns } = await import("./lib/db");
    recoverRuns();

    const retentionDays = Number(process.env.FABRIQ_RETENTION_DAYS ?? "7");
    const cleanup = () => {
      try {
        const deleted = deleteExpiredRuns(retentionDays);
        console.info(`[retention] deleted ${deleted} terminal runs older than ${retentionDays} days`);
      } catch (error) {
        console.error("[retention] cleanup failed", error);
      }
    };
    cleanup();
    setInterval(cleanup, 7 * 24 * 60 * 60 * 1000);
  }
}
