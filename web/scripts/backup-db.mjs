import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const source = path.resolve(process.env.FABRIQ_DATABASE_PATH ?? "./data/fabriq.db");
const backupDir = path.resolve(process.env.FABRIQ_BACKUP_DIR ?? "./backups");
if (!fs.existsSync(source)) throw new Error(`Database not found: ${source}`);
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replaceAll(":", "-");
const destination = path.join(backupDir, `fabriq-${stamp}.db`);
const db = new Database(source, { readonly: true });
await db.backup(destination);
db.close();
console.log(destination);
