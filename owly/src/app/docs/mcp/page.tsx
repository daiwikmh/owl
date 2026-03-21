export default function McpPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          MCP Tools Reference
        </h1>
        <p className="text-text-secondary leading-relaxed">
          OWL exposes 15 tools via the Model Context Protocol. All tools are
          prefixed{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            owl_
          </code>{" "}
          to avoid conflicts with MoonPay&apos;s tools. Additionally, all
          MoonPay tools are proxied transparently through the same server.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Starting the Server
        </h2>
        <div className="code-block">
          <code>
            <span className="cmd">owl</span> mcp
          </code>
        </div>
        <p className="text-sm text-text-secondary">
          Communicates over stdio. Point your AI agent&apos;s MCP config to this
          command. It spawns{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            mp mcp
          </code>{" "}
          as a child process and proxies all its tools, then registers the 15 OWL
          tools on top.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-neon-magenta glow-magenta">
          Tunnel Tools
        </h2>

        <ToolCard
          name="owl_tunnel_create"
          description="Create a tunnel to share wallet access with other agents"
          params={[
            { name: "wallet", type: "string", required: true, desc: "Wallet name to share" },
            { name: "name", type: "string", required: true, desc: "Tunnel name" },
            { name: "port", type: "number", required: false, desc: "WebSocket port (default: 9800)" },
          ]}
        />

        <ToolCard
          name="owl_tunnel_connect"
          description="Connect to an existing tunnel as a peer"
          params={[
            { name: "uri", type: "string", required: true, desc: "Tunnel URI to connect to" },
            { name: "wallet", type: "string", required: true, desc: "Local wallet for signing auth challenges" },
          ]}
        />

        <ToolCard
          name="owl_tunnel_list"
          description="List all active tunnels and connected peers"
          params={[]}
        />

        <ToolCard
          name="owl_tunnel_propose"
          description="Propose a transaction through a tunnel (peer side)"
          params={[
            { name: "tunnel", type: "string", required: true, desc: "Tunnel name or ID" },
            { name: "operation", type: "enum", required: true, desc: "swap | transfer | bridge" },
            { name: "params", type: "object", required: true, desc: "Operation parameters (same as mp tool params)" },
          ]}
        />

        <ToolCard
          name="owl_tunnel_approve"
          description="Approve a pending transaction proposal (host side)"
          params={[
            { name: "proposal_id", type: "string", required: true, desc: "Proposal ID to approve" },
          ]}
        />

        <ToolCard
          name="owl_tunnel_reject"
          description="Reject a pending transaction proposal (host side)"
          params={[
            { name: "proposal_id", type: "string", required: true, desc: "Proposal ID to reject" },
            { name: "reason", type: "string", required: false, desc: "Reason for rejection" },
          ]}
        />

        <ToolCard
          name="owl_tunnel_policy_set"
          description="Set policies on a tunnel (spending limits, token whitelist, auto-approve rules)"
          params={[
            { name: "tunnel", type: "string", required: true, desc: "Tunnel name or ID" },
            { name: "peer", type: "string", required: true, desc: "Peer wallet address" },
            { name: "daily_limit_usd", type: "number", required: false, desc: "Daily spending limit in USD" },
            { name: "allowed_tokens", type: "string[]", required: false, desc: "Token symbols allowed" },
            { name: "allowed_operations", type: "string[]", required: false, desc: "Operations allowed (swap, transfer, bridge)" },
            { name: "auto_approve_max_usd", type: "number", required: false, desc: "Auto-approve under this USD amount" },
          ]}
        />

        <ToolCard
          name="owl_tunnel_policy_get"
          description="Get current tunnel policies for a peer"
          params={[
            { name: "tunnel", type: "string", required: true, desc: "Tunnel name or ID" },
            { name: "peer", type: "string", required: false, desc: "Peer address (all peers if omitted)" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-neon-green glow-green">
          Alert Tools
        </h2>

        <ToolCard
          name="owl_alert_add"
          description="Add a price alert rule with cross-device notifications"
          params={[
            { name: "token", type: "string", required: true, desc: "Token address" },
            { name: "chain", type: "string", required: true, desc: "Chain name" },
            { name: "condition_type", type: "enum", required: true, desc: "price_above | price_below | percent_change | balance_below" },
            { name: "condition_value", type: "number", required: true, desc: "Threshold value" },
            { name: "channels", type: "string[]", required: true, desc: "Notification channels (telegram, webhook)" },
            { name: "webhook_url", type: "string", required: false, desc: "Webhook URL if using webhook channel" },
          ]}
        />

        <ToolCard
          name="owl_alert_list"
          description="List all active price alerts"
          params={[]}
        />

        <ToolCard
          name="owl_alert_remove"
          description="Remove a price alert by ID"
          params={[
            { name: "id", type: "string", required: true, desc: "Alert ID to remove" },
          ]}
        />

        <ToolCard
          name="owl_alert_channels_set"
          description="Configure notification channels (Telegram bot, webhook URL)"
          params={[
            { name: "telegram_token", type: "string", required: false, desc: "Telegram bot token" },
            { name: "telegram_chat_id", type: "string", required: false, desc: "Telegram chat ID" },
            { name: "webhook_url", type: "string", required: false, desc: "Default webhook URL" },
          ]}
        />

        <ToolCard
          name="owl_alert_history"
          description="View past triggered alerts"
          params={[
            { name: "limit", type: "number", required: false, desc: "Max results (default: 20)" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Terminal Tools
        </h2>

        <ToolCard
          name="owl_terminal_start"
          description="Start the interactive TUI terminal dashboard"
          params={[
            { name: "wallet", type: "string", required: false, desc: "Wallet name (default: main)" },
          ]}
        />

        <ToolCard
          name="owl_terminal_status"
          description="Get current terminal session status (portfolio, watches, activity)"
          params={[]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Proxied MoonPay Tools
        </h2>
        <p className="text-sm text-text-secondary">
          All tools from{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            mp mcp
          </code>{" "}
          are proxied transparently. This includes wallet management, token
          operations, swaps, transfers, bridges, and more. The proxy
          auto-discovers tools at startup and converts their JSON Schema
          definitions to Zod for the MCP server.
        </p>
        <p className="text-sm text-text-muted">
          See{" "}
          <a
            href="https://agents.moonpay.com/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            MoonPay CLI docs
          </a>{" "}
          for the full list of proxied tools.
        </p>
      </section>
    </article>
  );
}

function ToolCard({
  name,
  description,
  params,
}: {
  name: string;
  description: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
}) {
  return (
    <div className="rounded-lg border border-border-dim bg-bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border-dim flex items-center gap-3">
        <code className="text-sm font-mono text-neon-cyan">{name}</code>
      </div>
      <div className="px-5 py-3">
        <p className="text-sm text-text-secondary mb-3">{description}</p>
        {params.length > 0 && (
          <table className="param-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name}>
                  <td>
                    {p.name}{" "}
                    {p.required ? (
                      <span className="tag tag-required ml-1">req</span>
                    ) : (
                      <span className="tag tag-optional ml-1">opt</span>
                    )}
                  </td>
                  <td>
                    <code className="text-text-muted text-xs">{p.type}</code>
                  </td>
                  <td>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {params.length === 0 && (
          <p className="text-xs text-text-muted">No parameters</p>
        )}
      </div>
    </div>
  );
}
