import { execMp } from "../mp.js";
import { getStore } from "../alerts/store.js";
import { tunnelStore } from "../tunnel/store.js";

const HELP_TEXT = `Commands:
  show portfolio                    Refresh and display balances
  show balances <chain>             Balances for a specific chain
  watch <token> on <chain>          Add price watch
  swap <amount> <from> to <to>      Execute swap via mp
  transfer <amount> <token> to <addr>  Transfer tokens
  search <query> on <chain>         Search for tokens
  trending <chain>                  Show trending tokens
  tunnel status                     Show tunnel connections
  tunnel proposals                  Show pending proposals
  alert list                        Show active alerts
  history                           Recent transactions
  agent setup                       Configure AI agent (provider, model, API key)
  agent status                      Show current agent config
  agent disconnect                  Disconnect AI agent
  clear                             Clear output
  help                              Show this help
  exit / quit                       Exit terminal`;

export function parseCommand(input: string): { cmd: string; args: string[] } {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? "";
  return { cmd, args: parts.slice(1) };
}

export async function executeCommand(input: string, wallet: string): Promise<string | null> {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === "help") {
    return HELP_TEXT;
  }

  if (trimmed === "show portfolio" || trimmed === "portfolio") {
    return await showPortfolio(wallet);
  }

  if (trimmed.startsWith("show balances")) {
    const chain = trimmed.split(/\s+/)[2] ?? "solana";
    return await showBalances(wallet, chain);
  }

  if (trimmed.startsWith("search ")) {
    const match = input.match(/search\s+(.+?)\s+on\s+(\w+)/i);
    if (match) {
      return await searchTokens(match[1], match[2]);
    }
    return "Usage: search <query> on <chain>";
  }

  if (trimmed.startsWith("trending")) {
    const chain = trimmed.split(/\s+/)[1] ?? "solana";
    return await trendingTokens(chain);
  }

  if (trimmed.startsWith("swap ")) {
    const match = input.match(/swap\s+(\S+)\s+(\S+)\s+to\s+(\S+)/i);
    if (match) {
      return await executeSwap(wallet, match[1], match[2], match[3]);
    }
    return "Usage: swap <amount> <from_token> to <to_token>";
  }

  if (trimmed.startsWith("transfer ")) {
    const match = input.match(/transfer\s+(\S+)\s+(\S+)\s+to\s+(\S+)/i);
    if (match) {
      return await executeTransfer(wallet, match[1], match[2], match[3]);
    }
    return "Usage: transfer <amount> <token> to <address>";
  }

  if (trimmed === "tunnel status") {
    return tunnelStatus();
  }

  if (trimmed === "tunnel proposals") {
    return tunnelProposals();
  }

  if (trimmed === "alert list" || trimmed === "alerts") {
    return alertList();
  }

  if (trimmed === "history") {
    return await txHistory();
  }

  return `Unknown command: ${input}. Type "help" for available commands.`;
}

async function showPortfolio(wallet: string): Promise<string> {
  try {
    const chains = ["solana", "ethereum", "base"];
    const lines: string[] = [];

    for (const chain of chains) {
      try {
        const output = await execMp([
          "token", "balance", "list",
          "--wallet", wallet,
          "--chain", chain,
          "-f", "compact",
        ]);
        const data = JSON.parse(output);
        if (Array.isArray(data) && data.length > 0) {
          lines.push(`  ${chain}:`);
          for (const t of data) {
            lines.push(`    ${t.symbol ?? "???"}: ${t.balance ?? 0} ($${t.valueUsd ?? t.value_usd ?? "0"})`);
          }
        }
      } catch {
        // Chain not available
      }
    }

    return lines.length > 0 ? lines.join("\n") : "No balances found";
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}

async function showBalances(wallet: string, chain: string): Promise<string> {
  try {
    const output = await execMp([
      "token", "balance", "list",
      "--wallet", wallet,
      "--chain", chain,
      "-f", "compact",
    ]);
    return output;
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}

async function searchTokens(query: string, chain: string): Promise<string> {
  try {
    const output = await execMp([
      "token", "search",
      "--query", query,
      "--chain", chain,
      "--limit", "5",
      "-f", "compact",
    ]);
    return output;
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}

async function trendingTokens(chain: string): Promise<string> {
  try {
    const output = await execMp([
      "token", "trending", "list",
      "--chain", chain,
      "--limit", "10",
      "-f", "compact",
    ]);
    return output;
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}

async function executeSwap(
  wallet: string,
  amount: string,
  fromToken: string,
  toToken: string
): Promise<string> {
  try {
    const output = await execMp([
      "token", "swap",
      "--wallet", wallet,
      "--chain", "solana",
      "--from-token", fromToken,
      "--from-amount", amount,
      "--to-token", toToken,
    ]);
    return output;
  } catch (err) {
    return `Swap error: ${(err as Error).message}`;
  }
}

async function executeTransfer(
  wallet: string,
  amount: string,
  token: string,
  to: string
): Promise<string> {
  try {
    const output = await execMp([
      "token", "transfer",
      "--wallet", wallet,
      "--chain", "solana",
      "--token", token,
      "--amount", amount,
      "--to", to,
    ]);
    return output;
  } catch (err) {
    return `Transfer error: ${(err as Error).message}`;
  }
}

function tunnelStatus(): string {
  const tunnels = tunnelStore.listTunnels();
  if (tunnels.length === 0) return "No active tunnels";

  return tunnels
    .map((t) => `[${t.name}] wallet: ${t.wallet} | peers: ${t.peers.length} | port: ${t.port}`)
    .join("\n");
}

function tunnelProposals(): string {
  const proposals = tunnelStore.listProposals().filter((p) => p.status === "pending");
  if (proposals.length === 0) return "No pending proposals";

  return proposals
    .map(
      (p) =>
        `[${p.id.slice(0, 8)}] ${p.operation} from ${p.peer.slice(0, 8)}... | ${JSON.stringify(p.params)}`
    )
    .join("\n");
}

function alertList(): string {
  const store = getStore();
  const rules = store.listRules();
  if (rules.length === 0) return "No active alerts";

  return rules
    .map((r) => {
      const status = r.triggered_at ? "triggered" : "active";
      return `[${r.id.slice(0, 8)}] ${r.condition_type} ${r.condition_value} on ${r.chain} [${status}]`;
    })
    .join("\n");
}

async function txHistory(): Promise<string> {
  try {
    const output = await execMp(["transaction", "list", "-f", "compact"]);
    return output;
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}
