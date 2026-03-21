export default function DocsPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          Getting Started
        </h1>
        <p className="text-text-secondary leading-relaxed">
          OWL is a partner extension for MoonPay&apos;s Open Wallet Standard. It
          adds three infrastructure primitives on top of the MoonPay CLI that
          turn wallet operations into a multi-agent coordination platform.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Prerequisites
        </h2>
        <p className="text-sm text-text-secondary">
          You need the MoonPay CLI installed and authenticated.
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
            <span className="flag">--name</span> main
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Installation
        </h2>
        <div className="code-block">
          <code>
            <span className="comment"># run directly with npx</span>
            {"\n"}
            <span className="cmd">npx</span>{" "}
            <span className="string">@moonpay/owl</span>
            {"\n\n"}
            <span className="comment"># or install globally</span>
            {"\n"}
            <span className="cmd">npm</span> install{" "}
            <span className="flag">-g</span>{" "}
            <span className="string">@moonpay/owl</span>
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Quick Start
        </h2>
        <div className="code-block">
          <code>
            <span className="comment"># launch the terminal dashboard</span>
            {"\n"}
            <span className="cmd">owl</span> terminal{" "}
            <span className="flag">--wallet</span> main{"\n\n"}
            <span className="comment"># start MCP server for AI agents</span>
            {"\n"}
            <span className="cmd">owl</span> mcp{"\n\n"}
            <span className="comment"># add a price alert</span>
            {"\n"}
            <span className="cmd">owl</span> alert add{" "}
            <span className="flag">-t</span> So11...{" "}
            <span className="flag">-c</span> solana{" "}
            <span className="flag">--condition</span> price_above:200{" "}
            <span className="flag">--channel</span> telegram{"\n\n"}
            <span className="comment"># create a sharing tunnel</span>
            {"\n"}
            <span className="cmd">owl</span> tunnel create{" "}
            <span className="flag">-w</span> main{" "}
            <span className="flag">-n</span> my-tunnel
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Commands
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>owl terminal</td>
              <td>Start TUI dashboard</td>
            </tr>
            <tr>
              <td>owl mcp</td>
              <td>Start MCP server (stdio)</td>
            </tr>
            <tr>
              <td>owl tunnel create</td>
              <td>Create a wallet sharing tunnel</td>
            </tr>
            <tr>
              <td>owl tunnel connect</td>
              <td>Connect to a tunnel as peer</td>
            </tr>
            <tr>
              <td>owl tunnel list</td>
              <td>List active tunnels</td>
            </tr>
            <tr>
              <td>owl alert add</td>
              <td>Add a price alert</td>
            </tr>
            <tr>
              <td>owl alert list</td>
              <td>List active alerts</td>
            </tr>
            <tr>
              <td>owl alert remove</td>
              <td>Remove an alert</td>
            </tr>
            <tr>
              <td>owl alert daemon</td>
              <td>Start alert monitoring</td>
            </tr>
            <tr>
              <td>owl alert channels</td>
              <td>Configure Telegram / webhook</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Configuration
        </h2>
        <p className="text-sm text-text-secondary">
          OWL stores all config at{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            ~/.config/owl/
          </code>
        </p>
        <table className="param-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>agent.json</td>
              <td>AI agent provider, model, and API key</td>
            </tr>
            <tr>
              <td>channels.json</td>
              <td>Telegram bot token + chat ID, webhook URL</td>
            </tr>
            <tr>
              <td>tunnel-policies.json</td>
              <td>Per-peer tunnel policies and spending limits</td>
            </tr>
            <tr>
              <td>alerts.db</td>
              <td>SQLite database for alert rules and history</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
