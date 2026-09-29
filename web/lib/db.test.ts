// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "./db";

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe("SQLite migrations", () => {
  it("creates all application tables and enables WAL", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fabriq-db-"));
    tempDirectories.push(directory);
    const db = createDatabase(path.join(directory, "test.db"));
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{
      name: string;
    }>;
    expect(tables.map((row) => row.name)).toEqual(
      expect.arrayContaining(["users", "sessions", "scenarios", "simulation_runs", "simulation_results"]),
    );
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    db.close();
  });
});
