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
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            @moonpay/cli
          </code>
          ) and extends it. When you run{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            owl mcp
          </code>
          , it spawns{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            mp mcp
          </code>{" "}
          as a child process and acts as a single gateway for AI agents.
        </p>
        <div className="code-block text-xs">
          <code>
            <span className="keyword">Agent</span>
            {" --MCP--> "}
            <span className="string">owl mcp</span>
            {" --MCP--> "}
            <span className="flag">mp mcp</span>
            {" --> "}
            <span className="cmd">Blockchains</span>
            {"\n\n"}
            <span className="comment">
              {"# owl mcp = all MoonPay tools + 15 owl_* tools"}
            </span>
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          MCP Client Configuration
        </h2>
        <p className="text-sm text-text-secondary">
          Add OWL to your AI agent&apos;s MCP config. This replaces{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            mp mcp
          </code>{" "}
          since OWL proxies all MoonPay tools.
        </p>
        <div className="code-block">
          <code>
            <span className="comment">
              {"// claude_desktop_config.json or similar"}
            </span>
            {"\n"}
            {"{\n"}
            {'  '}
            <span className="string">&quot;mcpServers&quot;</span>
            {": {\n"}
            {'    '}
            <span className="string">&quot;owl&quot;</span>
            {": {\n"}
            {'      '}
            <span className="string">&quot;command&quot;</span>
            {": "}
            <span className="string">&quot;npx&quot;</span>
            {",\n"}
            {'      '}
            <span className="string">&quot;args&quot;</span>
            {": ["}
            <span className="string">&quot;@moonpay/owl&quot;</span>
            {", "}
            <span className="string">&quot;mcp&quot;</span>
            {"]\n"}
            {"    }\n"}
            {"  }\n"}
            {"}"}
          </code>
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
          <code>
            <span className="comment"># install MoonPay CLI</span>
            {"\n"}
            <span className="cmd">npm</span> install{" "}
            <span className="flag">-g</span>{" "}
            <span className="string">@moonpay/cli</span>
            {"\n\n"}
            <span className="comment"># authenticate</span>
            {"\n"}
            <span className="cmd">mp</span> login{" "}
            <span className="flag">--email</span> you@example.com{"\n"}
            <span className="cmd">mp</span> verify{" "}
            <span className="flag">--email</span> you@example.com{" "}
            <span className="flag">--code</span> 123456{"\n\n"}
            <span className="comment"># create a wallet</span>
            {"\n"}
            <span className="cmd">mp</span> wallet create{" "}
            <span className="flag">--name</span> main{"\n\n"}
            <span className="comment"># verify everything works</span>
            {"\n"}
            <span className="cmd">mp</span> wallet balance{" "}
            <span className="flag">--wallet</span> main
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Skills Format
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          OWL publishes three skills to the{" "}
          <a
            href="https://github.com/moonpay/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            MoonPay Skills repo
          </a>{" "}
          following the{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
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
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Ecosystem
        </h2>
        <div className="code-block text-xs">
          <code>
            <span className="comment">{"  MoonPay Skills Repo"}</span>
            {"\n"}
            {"  "}
            <span className="flag">moonpay-auth</span>
            {"       "}
            <span className="flag">moonpay-swap-tokens</span>
            {"\n"}
            {"  "}
            <span className="flag">moonpay-deposit</span>
            {"    "}
            <span className="flag">moonpay-trading-auto</span>
            {"\n"}
            {"  "}
            <span className="flag">messari-x402</span>
            {"       "}
            <span className="flag">myriad-prediction</span>
            {"\n"}
            {"  "}
            <span className="string">owl-terminal</span>
            {"       "}
            <span className="string">owl-tunnel</span>
            {"\n"}
            {"  "}
            <span className="string">owl-alerts</span>
            {"\n\n"}
            <span className="comment">{"  CLIs"}</span>
            {"\n"}
            {"  "}
            <span className="flag">mp</span>
            {" (MoonPay)          "}
            <span className="string">owl</span>
            {" (this project)\n"}
            {"  "}
            <span className="flag">pc</span>
            {" (Polymarket)       "}
            <span className="flag">messari-cli</span>
            {"\n\n"}
            <span className="comment">{"  MCP Servers"}</span>
            {"\n"}
            {"  "}
            <span className="flag">mp mcp</span>
            {"  -->  "}
            <span className="string">owl mcp</span>
            {" (wraps mp mcp)"}
          </code>
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
