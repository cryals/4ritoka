import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const backup = path.resolve(process.argv[2] ?? "./backups/restore-check.db");
if (!fs.existsSync(backup)) throw new Error(`Backup not found: ${backup}`);

const db = new Database(backup, { readonly: true, fileMustExist: true });
const integrity = db.pragma("integrity_check", { simple: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
db.close();

const required = ["scenarios", "sessions", "simulation_results", "simulation_runs", "users"];
const names = tables.map((row) => row.name);
if (integrity !== "ok" || required.some((name) => !names.includes(name))) {
  throw new Error(`Backup verification failed: integrity=${integrity}; tables=${names.join(",")}`);
}
console.log(`Backup verified: ${backup}`);
