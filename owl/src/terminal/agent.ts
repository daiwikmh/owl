import { execMp } from "../mp.js";
import { logEntry, queryLedger, ledgerStats, exportLedger, clearLedger } from "../ledger/store.js";
import { addAlertFromMcp, listAlertsFromMcp, removeAlertFromMcp, alertHistoryFromMcp } from "../alerts/engine.js";
import { configureChannelsFromMcp } from "../alerts/channels/index.js";
import { createTunnelFromMcp, listTunnelsFromMcp, approveProposalFromMcp, rejectProposalFromMcp } from "../tunnel/host.js";
import { connectTunnelFromMcp, proposeTxFromMcp } from "../tunnel/peer.js";
import { setPolicyFromMcp, getPolicyFromMcp } from "../tunnel/policy.js";
import { getTerminalStatus } from "./state.js";
import { getBaseUrl, type AgentConfig } from "./agent-config.js";

export type ChatMessage = { role: string; content: unknown; tool_calls?: unknown; tool_call_id?: string; name?: string };

const SYSTEM_PROMPT = `You are OWL, an AI agent with access to MoonPay wallet tools. Help users manage their crypto portfolio, set price alerts, and coordinate multi-agent wallet operations via tunnels.

STRICT OUTPUT RULES - these are non-negotiable:
- Never use markdown. No asterisks (*), no bold (**), no headers (#), no backticks (\`), no underscores (_).
- Keep responses short and direct. Two to four sentences max unless the user asks for detail.
- Use line breaks to separate distinct points. One idea per line.
- When listing items, put each on its own line with a label like "Token: SOL  Chain: solana  Price: $148".
- When showing results, use aligned labels. Example:
  Swapped: 10 USDC -> 0.067 SOL
  Chain: solana
  Status: confirmed
- If a user greets you, respond in one short sentence and ask what they need.
- Add a blank line between sections of your response for readability.

TOOL ERROR RECOVERY - when a tool call fails or returns an error, do NOT just tell the user to fix it themselves. Instead:
- If a channel (telegram, webhook) is not configured: ask the user for the credentials, then call owl_alert_channels_set to save them, then retry the alert.
- If a wallet is missing or not found: ask the user for the wallet name or offer to create one with mp_wallet_create, then retry.
- If a required parameter was missing or wrong: ask the user for the correct value and retry the tool call.
- If a tunnel connection or auth fails: check if the tunnel exists with owl_tunnel_list, help the user create one if needed.
- If a token search or retrieve fails: ask the user to clarify the token name or chain, try alternative search terms.
- For any other error: read the error message, figure out what is needed, ask the user only for what you cannot resolve yourself, then retry.
Never respond with raw CLI instructions. You have tools, use them.`;

const OWL_TOOLS = [
  {
    type: "function",
    function: {
      name: "mp_token_balance",
      description: "Get token balances for a wallet on a chain",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet name" },
          chain: { type: "string", description: "Chain name (solana, ethereum, base, etc)" },
        },
        required: ["wallet", "chain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_token_swap",
      description: "Swap tokens on a chain",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string" },
          chain: { type: "string" },
          from_token: { type: "string", description: "Token symbol to sell" },
          from_amount: { type: "string", description: "Amount to sell" },
          to_token: { type: "string", description: "Token symbol to buy" },
        },
        required: ["wallet", "chain", "from_token", "from_amount", "to_token"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_token_transfer",
      description: "Transfer tokens to an address",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string" },
          chain: { type: "string" },
          token: { type: "string" },
          amount: { type: "string" },
          to: { type: "string", description: "Destination address" },
        },
        required: ["wallet", "chain", "token", "amount", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_token_search",
      description: "Search for tokens on a chain",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          chain: { type: "string" },
        },
        required: ["query", "chain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_transaction_list",
      description: "List recent transactions",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_token_trending",
      description: "Get trending tokens on a chain",
      parameters: {
        type: "object",
        properties: {
          chain: { type: "string" },
          limit: { type: "number" },
          page: { type: "number" },
        },
        required: ["chain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_token_bridge",
      description: "Bridge tokens across chains",
      parameters: {
        type: "object",
        properties: {
          from_wallet: { type: "string", description: "Source wallet name" },
          from_chain: { type: "string", description: "Source chain" },
          from_token: { type: "string", description: "Source token address" },
          from_amount: { type: "string", description: "Amount to send" },
          to_chain: { type: "string", description: "Destination chain" },
          to_token: { type: "string", description: "Destination token address" },
        },
        required: ["from_wallet", "from_chain", "from_token", "from_amount", "to_chain", "to_token"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_token_retrieve",
      description: "Get detailed token info including price, volume, market data",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Token address" },
          chain: { type: "string", description: "Chain name" },
        },
        required: ["token", "chain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_wallet_list",
      description: "List all local wallets",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_wallet_create",
      description: "Create a new multi-chain HD wallet",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Wallet name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_message_sign",
      description: "Sign a message with a local wallet",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet name" },
          chain: { type: "string", description: "Chain (solana, ethereum, etc)" },
          message: { type: "string", description: "Message to sign" },
        },
        required: ["wallet", "chain", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_buy",
      description: "Buy crypto with fiat via MoonPay checkout URL",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Currency code (sol, eth, usdc_sol, etc)" },
          amount: { type: "string", description: "Amount in USD" },
          wallet: { type: "string", description: "Destination wallet address" },
        },
        required: ["token", "amount", "wallet"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mp_deposit_create",
      description: "Create a deposit link with multi-chain deposit addresses",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Destination wallet" },
          name: { type: "string", description: "Deposit name" },
        },
        required: ["wallet"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_alert_add",
      description: "Add a price alert for a token. You MUST ask the user which channel to use (telegram or webhook) and include it. If the channel is not configured, ask for credentials and call owl_alert_channels_set first.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Token address (use mp_token_search to resolve names)" },
          chain: { type: "string" },
          condition_type: { type: "string", enum: ["price_above", "price_below", "percent_change", "balance_below"] },
          condition_value: { type: "number" },
          channels: { type: "array", items: { type: "string", enum: ["telegram", "webhook"] }, description: "Notification channels (required)" },
          webhook_url: { type: "string", description: "Webhook URL if using webhook channel" },
        },
        required: ["token", "chain", "condition_type", "condition_value", "channels"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_alert_list",
      description: "List all active price alerts",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_alert_remove",
      description: "Remove a price alert by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_alert_channels_set",
      description: "Configure alert notification channels (Telegram or webhook)",
      parameters: {
        type: "object",
        properties: {
          telegram_token: { type: "string" },
          telegram_chat_id: { type: "string" },
          webhook_url: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_alert_history",
      description: "View past triggered alerts",
      parameters: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_create",
      description: "Create a tunnel for multi-agent wallet sharing",
      parameters: {
        type: "object",
        properties: {
          wallet: { type: "string" },
          name: { type: "string" },
          port: { type: "number" },
        },
        required: ["wallet", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_connect",
      description: "Connect to a tunnel as a peer",
      parameters: {
        type: "object",
        properties: {
          uri: { type: "string" },
          wallet: { type: "string" },
        },
        required: ["uri", "wallet"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_list",
      description: "List active tunnels",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_propose",
      description: "Propose a transaction through a tunnel",
      parameters: {
        type: "object",
        properties: {
          tunnel: { type: "string" },
          operation: { type: "string" },
          params: { type: "object" },
        },
        required: ["tunnel", "operation", "params"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_approve",
      description: "Approve a pending tunnel transaction proposal",
      parameters: {
        type: "object",
        properties: { proposal_id: { type: "string" } },
        required: ["proposal_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_reject",
      description: "Reject a pending tunnel transaction proposal",
      parameters: {
        type: "object",
        properties: {
          proposal_id: { type: "string" },
          reason: { type: "string" },
        },
        required: ["proposal_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_policy_set",
      description: "Set spending policy for a tunnel peer",
      parameters: {
        type: "object",
        properties: {
          tunnel: { type: "string" },
          peer: { type: "string" },
          daily_limit_usd: { type: "number" },
          token_whitelist: { type: "array", items: { type: "string" } },
          auto_approve_below_usd: { type: "number" },
          allowed_operations: { type: "array", items: { type: "string" } },
        },
        required: ["tunnel", "peer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_tunnel_policy_get",
      description: "Get current tunnel policy for a peer",
      parameters: {
        type: "object",
        properties: {
          tunnel: { type: "string" },
          peer: { type: "string" },
        },
        required: ["tunnel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_terminal_status",
      description: "Get current terminal status (portfolio, activity, watches)",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_ledger_query",
      description: "Query the activity ledger for past agent actions",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max entries to return (default 20)" },
          tool: { type: "string", description: "Filter by tool name" },
          wallet: { type: "string", description: "Filter by wallet" },
          chain: { type: "string", description: "Filter by chain" },
          since: { type: "string", description: "ISO date to start from" },
          status: { type: "string", enum: ["ok", "error"], description: "Filter by status" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_ledger_stats",
      description: "Get summary statistics from the activity ledger",
      parameters: {
        type: "object",
        properties: {
          since: { type: "string", description: "ISO date to start from (e.g. today's date for daily stats)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_ledger_export",
      description: "Export the activity ledger as JSON or CSV",
      parameters: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["json", "csv"], description: "Export format" },
          limit: { type: "number" },
          since: { type: "string" },
        },
        required: ["format"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_report_generate",
      description: "Generate a spending report (daily, weekly, monthly) from the activity ledger with operation breakdown",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["daily", "weekly", "monthly"], description: "Report period" },
          wallet: { type: "string", description: "Filter by wallet name" },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_portfolio_all",
      description: "Get a unified portfolio view across all wallets and all chains in one call",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "owl_dryrun",
      description: "Simulate a transaction (swap, transfer, bridge) without broadcasting. Returns quote, fees, and expected output.",
      parameters: {
        type: "object",
        properties: {
          operation: { type: "string", enum: ["swap", "transfer", "bridge"], description: "Operation to simulate" },
          wallet: { type: "string", description: "Wallet name" },
          chain: { type: "string", description: "Chain name" },
          from_token: { type: "string", description: "Source token (for swap/bridge)" },
          from_amount: { type: "string", description: "Amount (for swap/bridge)" },
          to_token: { type: "string", description: "Destination token (for swap/bridge)" },
          token: { type: "string", description: "Token (for transfer)" },
          amount: { type: "string", description: "Amount (for transfer)" },
          to: { type: "string", description: "Destination address (for transfer)" },
          to_chain: { type: "string", description: "Destination chain (for bridge)" },
        },
        required: ["operation", "wallet", "chain"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    let result: unknown;
    switch (name) {
      case "mp_token_balance":
        result = await execMp(["token", "balance", "list", "--wallet", String(args.wallet), "--chain", String(args.chain)]);
        break;
      case "mp_token_swap":
        result = await execMp(["token", "swap", "--wallet", String(args.wallet), "--chain", String(args.chain), "--from-token", String(args.from_token), "--from-amount", String(args.from_amount), "--to-token", String(args.to_token)]);
        break;
      case "mp_token_transfer":
        result = await execMp(["token", "transfer", "--wallet", String(args.wallet), "--chain", String(args.chain), "--token", String(args.token), "--amount", String(args.amount), "--to", String(args.to)]);
        break;
      case "mp_token_search":
        result = await execMp(["token", "search", "--query", String(args.query), "--chain", String(args.chain), "--limit", "5"]);
        break;
      case "mp_transaction_list":
        result = await execMp(args.wallet ? ["transaction", "list", "--wallet", String(args.wallet)] : ["transaction", "list"]);
        break;
      case "mp_token_trending":
        result = await execMp(["token", "trending", "list", "--chain", String(args.chain), "--limit", String(args.limit ?? 10), "--page", String(args.page ?? 1)]);
        break;
      case "mp_token_bridge":
        result = await execMp(["token", "bridge", "--from-wallet", String(args.from_wallet), "--from-chain", String(args.from_chain), "--from-token", String(args.from_token), "--from-amount", String(args.from_amount), "--to-chain", String(args.to_chain), "--to-token", String(args.to_token)]);
        break;
      case "mp_token_retrieve":
        result = await execMp(["token", "retrieve", "--token", String(args.token), "--chain", String(args.chain)]);
        break;
      case "mp_wallet_list":
        result = await execMp(["wallet", "list"]);
        break;
      case "mp_wallet_create":
        result = await execMp(["wallet", "create", "--name", String(args.name)]);
        break;
      case "mp_message_sign":
        result = await execMp(["message", "sign", "--wallet", String(args.wallet), "--chain", String(args.chain), "--message", String(args.message)]);
        break;
      case "mp_buy":
        result = await execMp(["buy", "--token", String(args.token), "--amount", String(args.amount), "--wallet", String(args.wallet)]);
        break;
      case "mp_deposit_create": {
        const depositArgs = ["deposit", "create", "--wallet", String(args.wallet)];
        if (args.name) depositArgs.push("--name", String(args.name));
        result = await execMp(depositArgs);
        break;
      }
      case "owl_alert_add":
        result = await addAlertFromMcp(args as Parameters<typeof addAlertFromMcp>[0]);
        break;
      case "owl_alert_list":
        result = await listAlertsFromMcp();
        break;
      case "owl_alert_remove":
        result = await removeAlertFromMcp(String(args.id));
        break;
      case "owl_alert_channels_set":
        result = await configureChannelsFromMcp(args as Parameters<typeof configureChannelsFromMcp>[0]);
        break;
      case "owl_alert_history":
        result = await alertHistoryFromMcp(Number(args.limit ?? 20));
        break;
      case "owl_tunnel_create":
        result = await createTunnelFromMcp(String(args.wallet), String(args.name), Number(args.port ?? 0));
        break;
      case "owl_tunnel_connect":
        result = await connectTunnelFromMcp(String(args.uri), String(args.wallet));
        break;
      case "owl_tunnel_list":
        result = await listTunnelsFromMcp();
        break;
      case "owl_tunnel_propose":
        result = await proposeTxFromMcp(String(args.tunnel), String(args.operation), args.params as Record<string, unknown>);
        break;
      case "owl_tunnel_approve":
        result = await approveProposalFromMcp(String(args.proposal_id));
        break;
      case "owl_tunnel_reject":
        result = await rejectProposalFromMcp(String(args.proposal_id), args.reason ? String(args.reason) : undefined);
        break;
      case "owl_tunnel_policy_set":
        result = await setPolicyFromMcp(args as Parameters<typeof setPolicyFromMcp>[0]);
        break;
      case "owl_tunnel_policy_get":
        result = await getPolicyFromMcp(String(args.tunnel), args.peer ? String(args.peer) : undefined);
        break;
      case "owl_terminal_status":
        result = await getTerminalStatus();
        break;
      case "owl_ledger_query":
        result = queryLedger({ limit: Number(args.limit ?? 20), tool: args.tool as string, wallet: args.wallet as string, chain: args.chain as string, since: args.since as string, status: args.status as string });
        break;
      case "owl_ledger_stats":
        result = ledgerStats(args.since as string);
        break;
      case "owl_ledger_export":
        result = exportLedger({ format: (args.format as "json" | "csv") ?? "json", limit: args.limit as number, since: args.since as string });
        break;
      case "owl_report_generate": {
        const { generateReport } = await import("../reports/engine.js");
        result = await generateReport({ period: args.period as "daily" | "weekly" | "monthly", wallet: args.wallet as string });
        break;
      }
      case "owl_portfolio_all": {
        const { portfolioAll } = await import("../reports/engine.js");
        result = await portfolioAll();
        break;
      }
      case "owl_dryrun": {
        const { dryRun } = await import("../reports/engine.js");
        const dryParams: Record<string, string> = {};
        if (args.from_token) dryParams.from_token = String(args.from_token);
        if (args.from_amount) dryParams.from_amount = String(args.from_amount);
        if (args.to_token) dryParams.to_token = String(args.to_token);
        if (args.token) dryParams.token = String(args.token);
        if (args.amount) dryParams.amount = String(args.amount);
        if (args.to) dryParams.to = String(args.to);
        if (args.to_chain) dryParams.to_chain = String(args.to_chain);
        result = await dryRun({ operation: args.operation as "swap" | "transfer" | "bridge", wallet: String(args.wallet), chain: String(args.chain), params: dryParams });
        break;
      }
      default:
        return `Unknown tool: ${name}`;
    }
    const output = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    logEntry({ tool: name, args, result: output, wallet: String(args.wallet ?? ""), chain: String(args.chain ?? ""), status: "ok" });
    return output;
  } catch (err) {
    const errMsg = `Error: ${(err as Error).message}`;
    logEntry({ tool: name, args, result: errMsg, wallet: String(args.wallet ?? ""), chain: String(args.chain ?? ""), status: "error" });
    return errMsg;
  }
}

async function callLlm(baseUrl: string, apiKey: string, model: string, messages: ChatMessage[]) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, tools: OWL_TOOLS, tool_choice: "auto" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<any>;
}

export async function runAgent(
  config: AgentConfig,
  userMessage: string,
  history: ChatMessage[],
  onThinking: () => void,
  onToolCall: (name: string, args: Record<string, unknown>) => void,
  onToolResult: (name: string, result: string) => void,
  onText: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  const baseUrl = getBaseUrl(config);

  if (!history.length) {
    history.push({ role: "system", content: SYSTEM_PROMPT });
  }
  history.push({ role: "user", content: userMessage });

  onThinking();

  try {
    while (true) {
      const res = await callLlm(baseUrl, config.apiKey, config.model, history);
      const msg = res.choices?.[0]?.message;
      if (!msg) throw new Error("Empty response from LLM");

      history.push(msg);

      if (msg.tool_calls?.length) {
        if (msg.content) onText(msg.content);

        for (const tc of msg.tool_calls) {
          const name = tc.function.name;
          const args = JSON.parse(tc.function.arguments ?? "{}");
          onToolCall(name, args);
          const result = await executeTool(name, args);
          onToolResult(name, result);
          history.push({ role: "tool", tool_call_id: tc.id, name, content: result });
        }
        continue;
      }

      if (msg.content) onText(msg.content);
      break;
    }
    onDone();
  } catch (err) {
    onError((err as Error).message);
  }
}
