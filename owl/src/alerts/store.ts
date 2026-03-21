import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AlertRule } from "./engine.js";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const DB_PATH = join(CONFIG_DIR, "alerts.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  mkdirSync(CONFIG_DIR, { recursive: true });
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      chain TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      condition_value REAL NOT NULL,
      channels TEXT NOT NULL,
      webhook_url TEXT,
      created_at TEXT NOT NULL,
      triggered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id TEXT NOT NULL,
      message TEXT NOT NULL,
      triggered_at TEXT NOT NULL
    );
  `);

  return db;
}

export function getStore() {
  return {
    addRule(rule: AlertRule) {
      const d = getDb();
      d.prepare(
        `INSERT INTO rules (id, token, chain, condition_type, condition_value, channels, webhook_url, created_at, triggered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        rule.id,
        rule.token,
        rule.chain,
        rule.condition_type,
        rule.condition_value,
        JSON.stringify(rule.channels),
        rule.webhook_url ?? null,
        rule.created_at,
        rule.triggered_at
      );
    },

    listRules(): AlertRule[] {
      const d = getDb();
      const rows = d.prepare("SELECT * FROM rules ORDER BY created_at DESC").all() as any[];
      return rows.map(rowToRule);
    },

    removeRule(id: string) {
      const d = getDb();
      d.prepare("DELETE FROM rules WHERE id = ? OR id LIKE ?").run(id, `${id}%`);
    },

    markTriggered(id: string) {
      const d = getDb();
      const now = new Date().toISOString();
      d.prepare("UPDATE rules SET triggered_at = ? WHERE id = ?").run(now, id);
    },

    addHistory(ruleId: string, message: string) {
      const d = getDb();
      d.prepare(
        "INSERT INTO history (rule_id, message, triggered_at) VALUES (?, ?, ?)"
      ).run(ruleId, message, new Date().toISOString());
    },

    getHistory(limit: number) {
      const d = getDb();
      return d
        .prepare("SELECT * FROM history ORDER BY triggered_at DESC LIMIT ?")
        .all(limit);
    },
  };
}

function rowToRule(row: any): AlertRule {
  return {
    id: row.id,
    token: row.token,
    chain: row.chain,
    condition_type: row.condition_type,
    condition_value: row.condition_value,
    channels: JSON.parse(row.channels),
    webhook_url: row.webhook_url,
    created_at: row.created_at,
    triggered_at: row.triggered_at,
  };
}
