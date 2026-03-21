export default function IntegrationPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          MoonPay Integration
        </h1>
        <p className="text-text-secondary leading-relaxed">
          OWL is a partner extension for MoonPay&apos;s Open Wallet Standard.
          It follows the same pattern as Messari, Polymarket, and Myriad in the
          MoonPay skills ecosystem.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          How It Works
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          OWL wraps the MoonPay CLI (
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            @moonpay/cli
          </code>
          ) and extends it. When you run{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            owl mcp
          </code>
          , it spawns{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            mp mcp
          </code>{" "}
          as a child process and acts as a single gateway for AI agents.
        </p>
        <div className="code-block text-xs">
          <code>{`Agent --MCP--> owl mcp --MCP--> mp mcp --> Blockchains

# owl mcp = all MoonPay tools + 22 owl_* tools`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          MCP Client Configuration
        </h2>
        <p className="text-sm text-text-secondary">
          Add OWL to your AI agent&apos;s MCP config. This replaces{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            mp mcp
          </code>{" "}
          since OWL proxies all MoonPay tools.
        </p>
        <div className="code-block">
          <code>{`// mcp config (claude_desktop_config.json or similar)
{
  "mcpServers": {
    "owl": {
      "command": "npx",
      "args": ["moonpay-owl", "mcp"]
    }
  }
}`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          MoonPay Prerequisites
        </h2>
        <p className="text-sm text-text-secondary">
          Before using OWL, you need a MoonPay account and wallet.
        </p>
        <div className="code-block">
          <code>{`# install MoonPay CLI
npm install -g @moonpay/cli

# authenticate
mp login --email you@example.com
mp verify --email you@example.com --code 123456

# create a wallet
mp wallet create --name main

# verify everything works
mp wallet balance --wallet main`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Skills Format
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          OWL publishes six skills to the{" "}
          <a
            href="https://github.com/moonpay/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            MoonPay Skills repo
          </a>{" "}
          following the{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            SKILL.md
          </code>{" "}
          format.
        </p>
        <table className="param-table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>owl-terminal</td>
              <td>
                TUI dashboard with portfolio, activity feed, and agent
                integration
              </td>
            </tr>
            <tr>
              <td>owl-tunnel</td>
              <td>
                Multi-agent wallet sharing with policy-based access control
              </td>
            </tr>
            <tr>
              <td>owl-alerts</td>
              <td>
                Cross-device price monitoring with Telegram and webhook support
              </td>
            </tr>
            <tr>
              <td>owl-ledger</td>
              <td>
                SQLite audit trail of every agent tool call with query, stats, and export
              </td>
            </tr>
            <tr>
              <td>owl-reports</td>
              <td>
                Spending reports, portfolio snapshots, and multi-wallet aggregation
              </td>
            </tr>
            <tr>
              <td>owl-dryrun</td>
              <td>
                Transaction simulation (swap, transfer, bridge) without broadcasting
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Ecosystem
        </h2>
        <div className="code-block text-xs">
          <code>{`  MoonPay Skills Repo
  moonpay-auth       moonpay-swap-tokens
  moonpay-deposit    moonpay-trading-auto
  messari-x402       myriad-prediction
  owl-terminal       owl-tunnel
  owl-alerts         owl-ledger
  owl-reports        owl-dryrun

  CLIs
  mp (MoonPay)          owl (this project)
  pc (Polymarket)       messari-cli

  MCP Servers
  mp mcp  -->  owl mcp (wraps mp mcp)`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Supported Chains
        </h2>
        <p className="text-sm text-text-secondary">
          OWL inherits all chain support from MoonPay CLI:
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            "Solana",
            "Ethereum",
            "Base",
            "Polygon",
            "Arbitrum",
            "Optimism",
            "BNB Chain",
            "Avalanche",
            "Bitcoin",
            "TRON",
          ].map((chain) => (
            <span
              key={chain}
              className="px-3 py-1 rounded-full text-xs font-mono bg-bg-card border border-border-dim text-text-secondary"
            >
              {chain}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: "OWS Docs",
              desc: "Open Wallet Standard specification",
              href: "https://openwallet.sh",
            },
            {
              title: "MoonPay Agents",
              desc: "MoonPay's agent platform",
              href: "https://www.moonpay.com/agents",
            },
            {
              title: "MoonPay CLI Docs",
              desc: "Full CLI and MCP reference",
              href: "https://agents.moonpay.com/skill.md",
            },
            {
              title: "Skills Repo",
              desc: "MoonPay skills ecosystem on GitHub",
              href: "https://github.com/moonpay/skills",
            },
          ].map((r) => (
            <a
              key={r.title}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg bg-bg-card border border-border-dim hover:border-neon-cyan/30 transition-colors group"
            >
              <h4 className="text-sm font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">
                {r.title}
              </h4>
              <p className="text-xs text-text-secondary mt-1">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
