export default function TerminalPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-cyan glow-cyan">
            {">_"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Terminal
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          A persistent TUI dashboard that wraps MoonPay CLI. Chat with an AI
          agent, manage your portfolio, and monitor activity in a single
          interface.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>owl terminal --wallet main</code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Description</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>-w, --wallet</td>
              <td>Wallet name to use</td>
              <td>main</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Interface
        </h2>
        <div className="code-block text-xs">
          <code>{`+------------------------------------------------------------------+
|  OWL Terminal  |  wallet: main  |  agent: nemotron  |  $5,248    |
+------------------------------------------------------------------+
|  Portfolio                                                        |
|    SOL         12.4                                    $2,108     |
|    ETH          0.8                                    $2,640     |
|    USDC       500.0                                      $500     |
+------------------------------------------------------------------+
|  Activity                                                         |
|  14:32:01 [ALERT]  BONK +18.2% in 47min                         |
|  14:31:45 [TUNNEL] Agent-B proposed: swap 50 USDC                |
|  14:30:12 [AGENT]  Connected: openrouter/nemotron                |
+------------------------------------------------------------------+
|  > _                                                              |
+------------------------------------------------------------------+`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="agent-setup-wizard" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Agent Setup Wizard
        </h2>
        <p className="text-sm text-text-secondary">
          On first launch, an interactive wizard prompts for AI agent
          configuration. Config persists to{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            ~/.config/owl/agent.json
          </code>
        </p>
        <table className="param-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Provider</td>
              <td>openrouter, openai, ollama, custom</td>
            </tr>
            <tr>
              <td>Model</td>
              <td>
                Any model the provider supports (e.g. nvidia/nemotron-3-super-120b-a12b:free)
              </td>
            </tr>
            <tr>
              <td>API Key</td>
              <td>Provider API key (stored locally)</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-text-muted">
          Reconfigure anytime by typing{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            agent setup
          </code>{" "}
          inside the terminal.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: "AI Chat",
              desc: "Talk to your agent in natural language. It calls wallet tools on your behalf.",
            },
            {
              title: "Activity Feed",
              desc: "Real-time stream of tool calls, alerts, and tunnel proposals.",
            },
            {
              title: "Portfolio View",
              desc: "Live token balances with USD values from your MoonPay wallet.",
            },
            {
              title: "Agent Integration",
              desc: "Connect any OpenAI-compatible provider and chat inline.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-lg bg-bg-card border border-border-dim"
            >
              <h4 className="text-sm font-semibold text-text-primary mb-1">
                {f.title}
              </h4>
              <p className="text-xs text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Agent Tools
        </h2>
        <p className="text-sm text-text-secondary">
          The terminal agent has access to all 22 OWL tools plus 13 MoonPay tools.
          Every tool call is logged to the Activity Ledger automatically.
        </p>
        <table className="param-table">
          <thead>
            <tr>
              <th>MoonPay Tool</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>mp_token_balance</td><td>Check token balances</td></tr>
            <tr><td>mp_token_swap</td><td>Swap tokens</td></tr>
            <tr><td>mp_token_transfer</td><td>Transfer tokens</td></tr>
            <tr><td>mp_token_search</td><td>Search for tokens</td></tr>
            <tr><td>mp_token_trending</td><td>Get trending tokens</td></tr>
            <tr><td>mp_token_bridge</td><td>Bridge tokens cross-chain</td></tr>
            <tr><td>mp_token_retrieve</td><td>Get token price and details</td></tr>
            <tr><td>mp_transaction_list</td><td>List transactions</td></tr>
            <tr><td>mp_wallet_list</td><td>List wallets</td></tr>
            <tr><td>mp_wallet_create</td><td>Create a new wallet</td></tr>
            <tr><td>mp_message_sign</td><td>Sign a message</td></tr>
            <tr><td>mp_buy</td><td>Buy crypto with fiat</td></tr>
            <tr><td>mp_deposit_create</td><td>Create a deposit address</td></tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="mcp-tools" className="text-xl font-semibold text-neon-cyan glow-cyan">
          MCP Tools
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>owl_terminal_start</td>
              <td>
                Start the terminal (returns a CLI command to run)
              </td>
            </tr>
            <tr>
              <td>owl_terminal_status</td>
              <td>Get current session state: portfolio, activity</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
