import { queryLedger, ledgerStats, type LedgerEntry } from "../ledger/store.js";
import { execMp } from "../mp.js";

// generate a spending report from ledger data + live balances
export async function generateReport(opts: {
  period: "daily" | "weekly" | "monthly" | "custom";
  wallet?: string;
  since?: string;
}): Promise<ReportResult> {
  const since = opts.since ?? periodToDate(opts.period);
  const entries = queryLedger({ limit: 1000, since, wallet: opts.wallet });
  const stats = ledgerStats(since);

  const writes = entries.filter((e) => isWriteOp(e.tool));
  const reads = entries.filter((e) => !isWriteOp(e.tool));

  const swaps = writes.filter((e) => e.tool === "mp_token_swap").length;
  const transfers = writes.filter((e) => e.tool === "mp_token_transfer").length;
  const bridges = writes.filter((e) => e.tool === "mp_token_bridge").length;
  const alertsSet = writes.filter((e) => e.tool === "owl_alert_add").length;
  const tunnelOps = writes.filter((e) => e.tool.startsWith("owl_tunnel_")).length;

  return {
    period: opts.period,
    since,
    generated: new Date().toISOString(),
    summary: {
      total_operations: stats.total,
      write_operations: writes.length,
      read_operations: reads.length,
      errors: stats.errors,
    },
    breakdown: {
      swaps,
      transfers,
      bridges,
      alerts_set: alertsSet,
      tunnel_operations: tunnelOps,
    },
    by_tool: stats.by_tool,
    by_chain: stats.by_chain,
    recent_writes: writes.slice(0, 10).map((e) => ({
      timestamp: e.timestamp,
      tool: e.tool,
      wallet: e.wallet,
      chain: e.chain,
      status: e.status,
      args: safeParseArgs(e.args),
    })),
  };
}

// multi-wallet portfolio: query all wallets across all chains
export async function portfolioAll(): Promise<PortfolioResult> {
  let walletList: string;
  try {
    walletList = await execMp(["wallet", "list"]);
  } catch {
    return { wallets: [], total_usd: 0, error: "Failed to list wallets" };
  }

  const walletNames = parseWalletNames(walletList);
  if (!walletNames.length) return { wallets: [], total_usd: 0, error: "No wallets found" };

  const chains = ["solana", "ethereum", "base", "polygon", "arbitrum", "optimism", "bnb", "avalanche"];
  const wallets: WalletPortfolio[] = [];

  for (const name of walletNames) {
    const holdings: ChainHolding[] = [];
    for (const chain of chains) {
      try {
        const raw = await execMp(["token", "balance", "list", "--wallet", name, "--chain", chain]);
        if (raw && !raw.includes("No balances") && raw.trim().length > 5) {
          holdings.push({ chain, raw: raw.trim() });
        }
      } catch {
        // skip chains with no balance or errors
      }
    }
    if (holdings.length > 0) {
      wallets.push({ name, holdings });
    }
  }

  return { wallets, total_usd: 0 };
}

// resolve token symbol to info via mp token search
async function getTokenPrice(token: string, chain: string): Promise<string> {
  try {
    return (await execMp(["token", "search", "--query", token, "--chain", chain, "--limit", "1"])).trim();
  } catch {
    return `Could not retrieve price for ${token} on ${chain}`;
  }
}

// dry run: estimate a transaction without broadcasting
export async function dryRun(opts: {
  operation: "swap" | "transfer" | "bridge";
  wallet: string;
  chain: string;
  params: Record<string, string>;
}): Promise<DryRunResult> {
  const p = opts.params;
  try {
    let output = "";
    switch (opts.operation) {
      case "swap": {
        const fromInfo = await getTokenPrice(p.from_token ?? "", opts.chain);
        const toInfo = await getTokenPrice(p.to_token ?? "", opts.chain);
        output = `Swap estimate: ${p.from_amount} ${p.from_token} -> ${p.to_token}\n`;
        output += `From token: ${fromInfo}\nTo token: ${toInfo}`;
        break;
      }
      case "transfer": {
        const info = await getTokenPrice(p.token ?? "", opts.chain);
        output = `Transfer estimate: ${p.amount} ${p.token} -> ${p.to}\n`;
        output += `Token: ${info}`;
        break;
      }
      case "bridge": {
        const fromInfo = await getTokenPrice(p.from_token ?? "", opts.chain);
        const toInfo = await getTokenPrice(p.to_token ?? "", p.to_chain ?? opts.chain);
        output = `Bridge estimate: ${p.from_amount} ${p.from_token} (${opts.chain}) -> ${p.to_token} (${p.to_chain})\n`;
        output += `From token: ${fromInfo}\nTo token: ${toInfo}`;
        break;
      }
      default:
        output = "Unsupported operation";
    }
    return {
      operation: opts.operation,
      wallet: opts.wallet,
      chain: opts.chain,
      simulation: true,
      success: true,
      output,
      params: p,
    };
  } catch (err) {
    return {
      operation: opts.operation,
      wallet: opts.wallet,
      chain: opts.chain,
      simulation: true,
      success: false,
      output: (err as Error).message,
      params: p,
    };
  }
}

function periodToDate(period: string): string {
  const now = new Date();
  switch (period) {
    case "daily":
      now.setHours(0, 0, 0, 0);
      return now.toISOString();
    case "weekly":
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case "monthly":
      now.setMonth(now.getMonth() - 1);
      return now.toISOString();
    default:
      return now.toISOString();
  }
}

function isWriteOp(tool: string): boolean {
  const writes = [
    "mp_token_swap", "mp_token_transfer", "mp_token_bridge",
    "mp_wallet_create", "mp_buy", "mp_deposit_create", "mp_message_sign",
    "owl_alert_add", "owl_alert_remove", "owl_alert_channels_set",
    "owl_tunnel_create", "owl_tunnel_connect", "owl_tunnel_propose",
    "owl_tunnel_approve", "owl_tunnel_reject", "owl_tunnel_policy_set",
  ];
  return writes.includes(tool);
}

function parseWalletNames(output: string): string[] {
  const names: string[] = [];
  for (const line of output.split("\n")) {
    const m = line.match(/^-?\s*name:\s*(.+)/);
    if (m) names.push(m[1].trim());
  }
  return names;
}

function safeParseArgs(argsStr: string): Record<string, unknown> {
  try {
    return JSON.parse(argsStr);
  } catch {
    return {};
  }
}

export interface ReportResult {
  period: string;
  since: string;
  generated: string;
  summary: {
    total_operations: number;
    write_operations: number;
    read_operations: number;
    errors: number;
  };
  breakdown: {
    swaps: number;
    transfers: number;
    bridges: number;
    alerts_set: number;
    tunnel_operations: number;
  };
  by_tool: Record<string, number>;
  by_chain: Record<string, number>;
  recent_writes: Array<{
    timestamp: string;
    tool: string;
    wallet: string;
    chain: string;
    status: string;
    args: Record<string, unknown>;
  }>;
}

export interface PortfolioResult {
  wallets: WalletPortfolio[];
  total_usd: number;
  error?: string;
}

interface WalletPortfolio {
  name: string;
  holdings: ChainHolding[];
}

interface ChainHolding {
  chain: string;
  raw: string;
}

export interface DryRunResult {
  operation: string;
  wallet: string;
  chain: string;
  simulation: boolean;
  success: boolean;
  output: string;
  params: Record<string, string>;
}
