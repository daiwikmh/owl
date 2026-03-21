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
          A persistent TUI dashboard that wraps MoonPay CLI. View your
          portfolio, monitor activity, and interact with AI agents in a single
          interface.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>
            <span className="cmd">owl</span> terminal{" "}
            <span className="flag">--wallet</span> main
          </code>
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
              <td>
                <code className="text-text-muted">main</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Interface
        </h2>
        <div className="code-block text-xs">
          <code>
            {
              "+------------------------------------------------------------------+\n"
            }
            {
              "|  OWL Terminal  |  wallet: main  |  agent: claude  |  $5,248      |\n"
            }
            {
              "+------------------------------------------------------------------+\n"
            }
            {
              "|  Portfolio                                                        |\n"
            }
            {
              "|    SOL         12.4                                    $2,108     |\n"
            }
            {
              "|    ETH          0.8                                    $2,640     |\n"
            }
            {
              "|    USDC       500.0                                      $500     |\n"
            }
            {
              "+------------------------------------------------------------------+\n"
            }
            {
              "|  Activity                                                         |\n"
            }
            {"|  "}
            <span className="string">14:32:01</span>
            {" ["}
            <span className="keyword">ALERT</span>
            {"]  BONK +18.2% in 47min                       |\n"}
            {"|  "}
            <span className="string">14:31:45</span>
            {" ["}
            <span className="flag">TUNNEL</span>
            {"] Agent-B proposed: swap 50 USDC              |\n"}
            {"|  "}
            <span className="string">14:30:12</span>
            {" ["}
            <span className="cmd">AGENT</span>
            {"]  Connected: claude-sonnet-4                  |\n"}
            {
              "+------------------------------------------------------------------+\n"
            }
            {"|  > _                                                              |\n"}
            {"+------------------------------------------------------------------+"}
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="agent-setup-wizard" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Agent Setup Wizard
        </h2>
        <p className="text-sm text-text-secondary">
          On first launch, an interactive wizard prompts for AI agent
          configuration. Config persists to{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
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
              <td>openrouter, anthropic, openai, ollama</td>
            </tr>
            <tr>
              <td>Model</td>
              <td>
                Any model the provider supports (e.g. claude-sonnet-4)
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
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
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
              title: "Portfolio View",
              desc: "Live token balances with USD values from your MoonPay wallet",
            },
            {
              title: "Activity Feed",
              desc: "Real-time stream of alerts, tunnel proposals, and agent actions",
            },
            {
              title: "Command Input",
              desc: "Type commands directly to interact with the terminal",
            },
            {
              title: "Agent Integration",
              desc: "Connect any AI provider and chat with your agent inline",
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
