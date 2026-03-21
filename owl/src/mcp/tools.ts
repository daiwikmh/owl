import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerOwlTools(server: McpServer) {
  registerAlertTools(server);
  registerTunnelTools(server);
  registerTerminalTools(server);
}

function registerAlertTools(server: McpServer) {
  server.tool(
    "owl_alert_add",
    "Add a price alert rule with cross-device notifications",
    {
      token: z.string().describe("Token address"),
      chain: z.string().describe("Chain name (solana, ethereum, base, etc.)"),
      condition_type: z
        .enum(["price_above", "price_below", "percent_change", "balance_below"])
        .describe("Type of alert condition"),
      condition_value: z.number().describe("Threshold value"),
      channels: z
        .array(z.enum(["telegram", "webhook"]))
        .describe("Notification channels"),
      webhook_url: z.string().optional().describe("Webhook URL if using webhook channel"),
    },
    async (args) => {
      const { addAlertFromMcp } = await import("../alerts/engine.js");
      return addAlertFromMcp(args);
    }
  );

  server.tool(
    "owl_alert_list",
    "List all active price alerts",
    async () => {
      const { listAlertsFromMcp } = await import("../alerts/engine.js");
      return listAlertsFromMcp();
    }
  );

  server.tool(
    "owl_alert_remove",
    "Remove a price alert by ID",
    {
      id: z.string().describe("Alert ID to remove"),
    },
    async (args) => {
      const { removeAlertFromMcp } = await import("../alerts/engine.js");
      return removeAlertFromMcp(args.id);
    }
  );

  server.tool(
    "owl_alert_channels_set",
    "Configure notification channels (Telegram bot, webhook URL)",
    {
      telegram_token: z.string().optional().describe("Telegram bot token"),
      telegram_chat_id: z.string().optional().describe("Telegram chat ID"),
      webhook_url: z.string().optional().describe("Default webhook URL"),
    },
    async (args) => {
      const { configureChannelsFromMcp } = await import("../alerts/channels/index.js");
      return configureChannelsFromMcp(args);
    }
  );

  server.tool(
    "owl_alert_history",
    "View past triggered alerts",
    {
      limit: z.number().optional().describe("Max results to return (default 20)"),
    },
    async (args) => {
      const { alertHistoryFromMcp } = await import("../alerts/engine.js");
      return alertHistoryFromMcp(args.limit ?? 20);
    }
  );
}

function registerTunnelTools(server: McpServer) {
  server.tool(
    "owl_tunnel_create",
    "Create a tunnel to share wallet access with other agents",
    {
      wallet: z.string().describe("Wallet name to share"),
      name: z.string().describe("Tunnel name"),
      port: z.number().optional().describe("WebSocket port for remote peers (default 9800)"),
    },
    async (args) => {
      const { createTunnelFromMcp } = await import("../tunnel/host.js");
      return createTunnelFromMcp(args.wallet, args.name, args.port ?? 9800);
    }
  );

  server.tool(
    "owl_tunnel_connect",
    "Connect to an existing tunnel as a peer",
    {
      uri: z.string().describe("Tunnel URI to connect to"),
      wallet: z.string().describe("Local wallet for signing auth challenges"),
    },
    async (args) => {
      const { connectTunnelFromMcp } = await import("../tunnel/peer.js");
      return connectTunnelFromMcp(args.uri, args.wallet);
    }
  );

  server.tool(
    "owl_tunnel_list",
    "List all active tunnels and connected peers",
    async () => {
      const { listTunnelsFromMcp } = await import("../tunnel/host.js");
      return listTunnelsFromMcp();
    }
  );

  server.tool(
    "owl_tunnel_propose",
    "Propose a transaction through a tunnel (peer side)",
    {
      tunnel: z.string().describe("Tunnel name or ID"),
      operation: z.enum(["swap", "transfer", "bridge"]).describe("Operation type"),
      params: z.record(z.any()).describe("Operation parameters (same as mp tool params)"),
    },
    async (args) => {
      const { proposeTxFromMcp } = await import("../tunnel/peer.js");
      return proposeTxFromMcp(args.tunnel, args.operation, args.params);
    }
  );

  server.tool(
    "owl_tunnel_approve",
    "Approve a pending transaction proposal (host side)",
    {
      proposal_id: z.string().describe("Proposal ID to approve"),
    },
    async (args) => {
      const { approveProposalFromMcp } = await import("../tunnel/host.js");
      return approveProposalFromMcp(args.proposal_id);
    }
  );

  server.tool(
    "owl_tunnel_reject",
    "Reject a pending transaction proposal (host side)",
    {
      proposal_id: z.string().describe("Proposal ID to reject"),
      reason: z.string().optional().describe("Reason for rejection"),
    },
    async (args) => {
      const { rejectProposalFromMcp } = await import("../tunnel/host.js");
      return rejectProposalFromMcp(args.proposal_id, args.reason);
    }
  );

  server.tool(
    "owl_tunnel_policy_set",
    "Set policies on a tunnel (spending limits, token whitelist, auto-approve rules)",
    {
      tunnel: z.string().describe("Tunnel name or ID"),
      peer: z.string().describe("Peer wallet address"),
      daily_limit_usd: z.number().optional().describe("Daily spending limit in USD"),
      allowed_tokens: z.array(z.string()).optional().describe("Token symbols allowed"),
      allowed_operations: z
        .array(z.enum(["swap", "transfer", "bridge"]))
        .optional()
        .describe("Operations allowed"),
      auto_approve_max_usd: z
        .number()
        .optional()
        .describe("Auto-approve transactions under this USD amount"),
    },
    async (args) => {
      const { setPolicyFromMcp } = await import("../tunnel/policy.js");
      return setPolicyFromMcp(args);
    }
  );

  server.tool(
    "owl_tunnel_policy_get",
    "Get current tunnel policies for a peer",
    {
      tunnel: z.string().describe("Tunnel name or ID"),
      peer: z.string().optional().describe("Peer wallet address (all peers if omitted)"),
    },
    async (args) => {
      const { getPolicyFromMcp } = await import("../tunnel/policy.js");
      return getPolicyFromMcp(args.tunnel, args.peer);
    }
  );
}

function registerTerminalTools(server: McpServer) {
  server.tool(
    "owl_terminal_start",
    "Start the interactive TUI terminal dashboard",
    {
      wallet: z.string().optional().describe("Wallet name (default: main)"),
    },
    async (args) => {
      return {
        content: [
          {
            type: "text" as const,
            text: `To start the terminal, run: owl terminal --wallet ${args.wallet ?? "main"}`,
          },
        ],
      };
    }
  );

  server.tool(
    "owl_terminal_status",
    "Get current terminal session status (portfolio, watches, activity)",
    async () => {
      const { getTerminalStatus } = await import("../terminal/state.js");
      return getTerminalStatus();
    }
  );
}
