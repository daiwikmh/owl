import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { getDashboardHtml } from "./dashboard.js";
import { queryLedger, ledgerStats } from "../ledger/store.js";
import { getStore } from "../alerts/store.js";
import { tunnelStore } from "../tunnel/store.js";
import { generateReport, portfolioAll } from "../reports/engine.js";
import { execMp } from "../mp.js";

const CONFIG_DIR = join(homedir(), ".config", "owl");

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}

function html(res: ServerResponse, body: string) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

function md(res: ServerResponse, body: string) {
  res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(body);
}

function loadSkillMd(): string {
  try {
    // resolve relative to this file's package
    const skillPath = join(new URL(".", import.meta.url).pathname, "..", "..", "docs", "skill.md");
    return readFileSync(skillPath, "utf-8");
  } catch {
    // fallback: try cwd
    try { return readFileSync(join(process.cwd(), "docs", "skill.md"), "utf-8"); }
    catch { return "# skill.md not found"; }
  }
}

function loadJsonFile(name: string): unknown {
  try { return JSON.parse(readFileSync(join(CONFIG_DIR, name), "utf-8")); }
  catch { return null; }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = url.pathname;
  const q = url.searchParams;

  try {
    // skill.md for agent discovery
    if (path === "/skill.md") return md(res, loadSkillMd());

    // dashboard
    if (path === "/") return html(res, getDashboardHtml());

    // wallets
    if (path === "/api/wallets") {
      const raw = await execMp(["--json", "wallet", "list"]);
      return json(res, JSON.parse(raw));
    }

    // portfolio
    if (path === "/api/portfolio") {
      const data = await portfolioAll();
      return json(res, data);
    }

    // ledger
    if (path === "/api/ledger") {
      const entries = queryLedger({
        limit: parseInt(q.get("limit") ?? "50"),
        tool: q.get("tool") ?? undefined,
        wallet: q.get("wallet") ?? undefined,
        chain: q.get("chain") ?? undefined,
        since: q.get("since") ?? undefined,
        status: q.get("status") ?? undefined,
      });
      return json(res, entries);
    }

    if (path === "/api/ledger/stats") {
      const stats = ledgerStats(q.get("since") ?? undefined);
      return json(res, stats);
    }

    // alerts
    if (path === "/api/alerts") {
      const store = getStore();
      return json(res, store.listRules());
    }

    if (path === "/api/alerts/history") {
      const store = getStore();
      const limit = parseInt(q.get("limit") ?? "50");
      return json(res, store.getHistory(limit));
    }

    // tunnels
    if (path === "/api/tunnels") {
      const tunnels = tunnelStore.listTunnels();
      const proposals = tunnelStore.listProposals();
      return json(res, { tunnels, proposals });
    }

    // reports
    const reportMatch = path.match(/^\/api\/reports\/(daily|weekly|monthly)$/);
    if (reportMatch) {
      const data = await generateReport({
        period: reportMatch[1] as "daily" | "weekly" | "monthly",
        wallet: q.get("wallet") ?? undefined,
      });
      return json(res, data);
    }

    // config
    if (path === "/api/config") {
      const agent = loadJsonFile("agent.json") as Record<string, unknown> | null;
      const channels = loadJsonFile("channels.json");
      // redact secrets
      if (agent?.apiKey) agent.apiKey = "***";
      if (agent && typeof agent === "object") {
        const a = agent as Record<string, unknown>;
        if (a.apiKey) a.apiKey = "***";
      }
      const ch = channels as Record<string, unknown> | null;
      if (ch?.telegram && typeof ch.telegram === "object") {
        (ch.telegram as Record<string, unknown>).token = "***";
      }
      return json(res, { agent, channels });
    }

    json(res, { error: "Not found" }, 404);
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
}

export async function startWebServer(port: number) {
  const server = createServer(handleRequest);

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is in use. Try: owl web --port ${port + 1}`);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`OWL dashboard: http://127.0.0.1:${port}`);
    console.log("Read-only mode. Press Ctrl+C to stop.");
  });

  await new Promise(() => {});
}
