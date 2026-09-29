import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Language, Scenario, ScenarioConfig, SimulationPayload, SimulationRun, User } from "./types";

type SqliteDatabase = Database.Database;

const globalDatabase = globalThis as typeof globalThis & { fabriqDb?: SqliteDatabase };

export function createDatabase(databasePath: string): SqliteDatabase {
  fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

export function getDatabase(): SqliteDatabase {
  if (!globalDatabase.fabriqDb) {
    globalDatabase.fabriqDb = createDatabase(
      process.env.FABRIQ_DATABASE_PATH ?? path.join(process.cwd(), "data", "fabriq.db"),
    );
  }
  return globalDatabase.fabriqDb;
}

function migrate(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      language TEXT NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'en')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      config_json TEXT NOT NULL,
      format_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS simulation_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scenario_id TEXT REFERENCES scenarios(id) ON DELETE SET NULL,
      scenario_name TEXT NOT NULL,
      scenario_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed','cancelled')),
      seed INTEGER,
      parameters_json TEXT NOT NULL DEFAULT '{}',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      finished_at TEXT
    );
    CREATE TABLE IF NOT EXISTS simulation_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL UNIQUE REFERENCES simulation_runs(id) ON DELETE CASCADE,
      analytics_json TEXT NOT NULL,
      report_json TEXT NOT NULL,
      event_log_json TEXT NOT NULL,
      raw_data_json TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_scenarios_user_updated ON scenarios(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_user_created ON simulation_runs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_status ON simulation_runs(status, created_at);
    INSERT OR IGNORE INTO schema_migrations(version) VALUES (1);
  `);
}

type UserRow = { id: string; email: string; role: "admin" | "user"; language: Language; created_at: string };
type ScenarioRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  config_json: string;
  format_version: number;
  created_at: string;
  updated_at: string;
};
type RunRow = {
  id: string;
  scenario_id: string | null;
  scenario_name: string;
  status: SimulationRun["status"];
  seed: number | null;
  parameters_json: string;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  payload_json?: string | null;
};

function mapUser(row: UserRow): User {
  return { id: row.id, email: row.email, role: row.role, language: row.language, createdAt: row.created_at };
}

function mapScenario(row: ScenarioRow): Scenario {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    config: JSON.parse(row.config_json) as ScenarioConfig,
    formatVersion: row.format_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRun(row: RunRow): SimulationRun {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    scenarioName: row.scenario_name,
    status: row.status,
    seed: row.seed,
    parameters: JSON.parse(row.parameters_json) as Record<string, unknown>,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    result: row.payload_json ? (JSON.parse(row.payload_json) as SimulationPayload) : null,
  };
}

export function countUsers(): number {
  return (getDatabase().prepare("SELECT COUNT(*) count FROM users").get() as { count: number }).count;
}

export function createUser(email: string, passwordHash: string): User {
  const id = randomUUID();
  const role = countUsers() === 0 ? "admin" : "user";
  getDatabase()
    .prepare("INSERT INTO users(id,email,password_hash,role) VALUES (?,?,?,?)")
    .run(id, email, passwordHash, role);
  return findUserById(id)!;
}

export function findUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const row = getDatabase()
    .prepare("SELECT id,email,password_hash,role,language,created_at FROM users WHERE email = ?")
    .get(email) as (UserRow & { password_hash: string }) | undefined;
  return row ? { ...mapUser(row), passwordHash: row.password_hash } : null;
}

export function findUserById(id: string): User | null {
  const row = getDatabase()
    .prepare("SELECT id,email,role,language,created_at FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function updateUserLanguage(userId: string, language: Language): void {
  getDatabase().prepare("UPDATE users SET language = ? WHERE id = ?").run(language, userId);
}

export function createSession(userId: string, tokenHash: string, expiresAt: string): string {
  const id = randomUUID();
  getDatabase()
    .prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES (?,?,?,?)")
    .run(id, userId, tokenHash, expiresAt);
  return id;
}

export function findUserBySession(tokenHash: string): User | null {
  const row = getDatabase()
    .prepare(
      `
    SELECT u.id,u.email,u.role,u.language,u.created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
  `,
    )
    .get(tokenHash) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function deleteSession(tokenHash: string): void {
  getDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function createScenario(
  userId: string,
  name: string,
  description: string,
  config: ScenarioConfig,
): Scenario {
  const id = randomUUID();
  getDatabase()
    .prepare(
      `
    INSERT INTO scenarios(id,user_id,name,description,config_json) VALUES (?,?,?,?,?)
  `,
    )
    .run(id, userId, name, description, JSON.stringify(config));
  return getScenario(userId, id)!;
}

export function listScenarios(userId: string): Scenario[] {
  const rows = getDatabase()
    .prepare("SELECT * FROM scenarios WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as ScenarioRow[];
  return rows.map(mapScenario);
}

export function getScenario(userId: string, id: string): Scenario | null {
  const row = getDatabase()
    .prepare("SELECT * FROM scenarios WHERE id = ? AND user_id = ?")
    .get(id, userId) as ScenarioRow | undefined;
  return row ? mapScenario(row) : null;
}

export function updateScenario(
  userId: string,
  id: string,
  name: string,
  description: string,
  config: ScenarioConfig,
): Scenario | null {
  const result = getDatabase()
    .prepare(
      `
    UPDATE scenarios SET name=?,description=?,config_json=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND user_id=?
  `,
    )
    .run(name, description, JSON.stringify(config), id, userId);
  return result.changes ? getScenario(userId, id) : null;
}

export function deleteScenario(userId: string, id: string): boolean {
  return getDatabase().prepare("DELETE FROM scenarios WHERE id=? AND user_id=?").run(id, userId).changes > 0;
}

export function createRun(
  userId: string,
  scenarioId: string | null,
  scenarioName: string,
  scenario: ScenarioConfig,
  seed: number | null,
  parameters: Record<string, unknown>,
): string {
  const id = randomUUID();
  getDatabase()
    .prepare(
      `
    INSERT INTO simulation_runs(
      id,user_id,scenario_id,scenario_name,scenario_json,status,seed,parameters_json
    ) VALUES (?,?,?,?,?,'pending',?,?)
  `,
    )
    .run(id, userId, scenarioId, scenarioName, JSON.stringify(scenario), seed, JSON.stringify(parameters));
  return id;
}

export function claimRun(id: string): boolean {
  return (
    getDatabase()
      .prepare(
        `
    UPDATE simulation_runs SET status='running',started_at=CURRENT_TIMESTAMP,error_message=NULL
    WHERE id=? AND status='pending'
  `,
      )
      .run(id).changes === 1
  );
}

export function completeRun(id: string, payload: SimulationPayload): void {
  getDatabase().transaction(() => {
    getDatabase()
      .prepare(
        `
      INSERT OR REPLACE INTO simulation_results(
        id,run_id,analytics_json,report_json,event_log_json,raw_data_json,payload_json
      ) VALUES (?,?,?,?,?,?,?)
    `,
      )
      .run(
        randomUUID(),
        id,
        JSON.stringify(payload.analytics),
        JSON.stringify(payload.report),
        JSON.stringify(payload.event_log),
        JSON.stringify(payload.raw_data),
        JSON.stringify(payload),
      );
    getDatabase()
      .prepare("UPDATE simulation_runs SET status='completed',finished_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(id);
  })();
}

export function failRun(id: string, message: string): void {
  getDatabase()
    .prepare(
      `
    UPDATE simulation_runs SET status='failed',error_message=?,finished_at=CURRENT_TIMESTAMP WHERE id=?
  `,
    )
    .run(message.slice(0, 1000), id);
}

export function cancelRun(userId: string, id: string): boolean {
  return (
    getDatabase()
      .prepare(
        `
    UPDATE simulation_runs SET status='cancelled',finished_at=CURRENT_TIMESTAMP
    WHERE id=? AND user_id=? AND status IN ('pending','running')
  `,
      )
      .run(id, userId).changes > 0
  );
}

export function getRun(userId: string, id: string): SimulationRun | null {
  const row = getDatabase()
    .prepare(
      `
    SELECT r.*,result.payload_json FROM simulation_runs r
    LEFT JOIN simulation_results result ON result.run_id=r.id
    WHERE r.id=? AND r.user_id=?
  `,
    )
    .get(id, userId) as RunRow | undefined;
  return row ? mapRun(row) : null;
}

export function getRunInternal(id: string): { run: SimulationRun; scenario: ScenarioConfig } | null {
  const row = getDatabase()
    .prepare(
      `
    SELECT r.*,result.payload_json FROM simulation_runs r
    LEFT JOIN simulation_results result ON result.run_id=r.id WHERE r.id=?
  `,
    )
    .get(id) as (RunRow & { scenario_json: string }) | undefined;
  return row ? { run: mapRun(row), scenario: JSON.parse(row.scenario_json) as ScenarioConfig } : null;
}

export function listRuns(userId: string, limit = 50): SimulationRun[] {
  const rows = getDatabase()
    .prepare(
      `
    SELECT r.*,result.payload_json FROM simulation_runs r
    LEFT JOIN simulation_results result ON result.run_id=r.id
    WHERE r.user_id=? ORDER BY r.created_at DESC LIMIT ?
  `,
    )
    .all(userId, Math.min(limit, 200)) as RunRow[];
  return rows.map(mapRun);
}

export function pendingRunIds(): string[] {
  return (
    getDatabase()
      .prepare("SELECT id FROM simulation_runs WHERE status IN ('pending','running') ORDER BY created_at")
      .all() as Array<{ id: string }>
  ).map((row) => row.id);
}

export function resetInterruptedRuns(): void {
  getDatabase()
    .prepare("UPDATE simulation_runs SET status='pending',started_at=NULL WHERE status='running'")
    .run();
}

export function recentRunCount(userId: string, seconds = 60): number {
  const row = getDatabase()
    .prepare(
      `
    SELECT COUNT(*) count FROM simulation_runs
    WHERE user_id=? AND created_at >= datetime('now', ?)
  `,
    )
    .get(userId, `-${seconds} seconds`) as { count: number };
  return row.count;
}

export function deleteOldTerminalRuns(days = 90): number {
  return getDatabase()
    .prepare(
      `
    DELETE FROM simulation_runs
    WHERE status IN ('failed','cancelled') AND created_at < datetime('now', ?)
  `,
    )
    .run(`-${days} days`).changes;
}

export function deleteExpiredRuns(days = 7): number {
  return getDatabase()
    .prepare(
      `
    DELETE FROM simulation_runs
    WHERE status IN ('completed','failed','cancelled')
      AND COALESCE(finished_at, created_at) < datetime('now', ?)
  `,
    )
    .run(`-${days} days`).changes;
}

export function backupDatabase(destination: string): Promise<void> {
  fs.mkdirSync(path.dirname(path.resolve(destination)), { recursive: true });
  return getDatabase()
    .backup(destination)
    .then(() => undefined);
}
