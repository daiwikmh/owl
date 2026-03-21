import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const DB_PATH = join(CONFIG_DIR, "ledger.db");

export interface LedgerEntry {
  id: number;
  timestamp: string;
  tool: string;
  args: string;
  result: string;
  wallet: string;
  chain: string;
  status: "ok" | "error";
  agent: string;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  mkdirSync(CONFIG_DIR, { recursive: true });
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      tool TEXT NOT NULL,
      args TEXT NOT NULL DEFAULT '{}',
      result TEXT NOT NULL DEFAULT '',
      wallet TEXT NOT NULL DEFAULT '',
      chain TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ok',
      agent TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_ledger_ts ON ledger(timestamp);
    CREATE INDEX IF NOT EXISTS idx_ledger_tool ON ledger(tool);
    CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON ledger(wallet);
  `);

  return db;
}

export function logEntry(entry: {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  wallet?: string;
  chain?: string;
  status?: "ok" | "error";
  agent?: string;
}) {
  const d = getDb();
  d.prepare(
    `INSERT INTO ledger (timestamp, tool, args, result, wallet, chain, status, agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    new Date().toISOString(),
    entry.tool,
    JSON.stringify(entry.args),
    entry.result.slice(0, 2000),
    entry.wallet ?? "",
    entry.chain ?? "",
    entry.status ?? "ok",
    entry.agent ?? "",
  );
}

export function queryLedger(opts: {
  limit?: number;
  tool?: string;
  wallet?: string;
  chain?: string;
  since?: string;
  status?: string;
}): LedgerEntry[] {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.tool) { conditions.push("tool = ?"); params.push(opts.tool); }
  if (opts.wallet) { conditions.push("wallet = ?"); params.push(opts.wallet); }
  if (opts.chain) { conditions.push("chain = ?"); params.push(opts.chain); }
  if (opts.since) { conditions.push("timestamp >= ?"); params.push(opts.since); }
  if (opts.status) { conditions.push("status = ?"); params.push(opts.status); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts.limit ?? 50;

  return d
    .prepare(`SELECT * FROM ledger ${where} ORDER BY timestamp DESC LIMIT ?`)
    .all(...params, limit) as LedgerEntry[];
}

export function ledgerStats(since?: string): {
  total: number;
  errors: number;
  by_tool: Record<string, number>;
  by_chain: Record<string, number>;
} {
  const d = getDb();
  const sinceClause = since ? "WHERE timestamp >= ?" : "";
  const params = since ? [since] : [];

  const total = (d.prepare(`SELECT COUNT(*) as c FROM ledger ${sinceClause}`).get(...params) as any).c;
  const errors = (d.prepare(`SELECT COUNT(*) as c FROM ledger ${sinceClause ? sinceClause + " AND" : "WHERE"} status = 'error'`).get(...params) as any).c;

  const toolRows = d.prepare(`SELECT tool, COUNT(*) as c FROM ledger ${sinceClause} GROUP BY tool ORDER BY c DESC`).all(...params) as any[];
  const by_tool: Record<string, number> = {};
  for (const r of toolRows) by_tool[r.tool] = r.c;

  const chainRows = d.prepare(`SELECT chain, COUNT(*) as c FROM ledger ${sinceClause} AND chain != '' GROUP BY chain ORDER BY c DESC`.replace("AND", sinceClause ? "AND" : "WHERE")).all(...params) as any[];
  const by_chain: Record<string, number> = {};
  for (const r of chainRows) by_chain[r.chain] = r.c;

  return { total, errors, by_tool, by_chain };
}

export function clearLedger(before?: string) {
  const d = getDb();
  if (before) {
    d.prepare("DELETE FROM ledger WHERE timestamp < ?").run(before);
  } else {
    d.exec("DELETE FROM ledger");
  }
}

export function exportLedger(opts: {
  format: "json" | "csv";
  limit?: number;
  since?: string;
}): string {
  const entries = queryLedger({ limit: opts.limit ?? 1000, since: opts.since });

  if (opts.format === "csv") {
    const header = "timestamp,tool,wallet,chain,status,args,result";
    const rows = entries.map((e) =>
      `${e.timestamp},${e.tool},${e.wallet},${e.chain},${e.status},"${e.args.replace(/"/g, '""')}","${e.result.replace(/"/g, '""')}"`
    );
    return [header, ...rows].join("\n");
  }

  return JSON.stringify(entries, null, 2);
}
