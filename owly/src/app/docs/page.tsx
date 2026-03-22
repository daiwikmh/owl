export default function DocsPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          Getting Started
        </h1>
        <p className="text-text-secondary leading-relaxed">
          OWL is a partner extension for MoonPay&apos;s Open Wallet Standard. It
          adds six infrastructure primitives on top of the MoonPay CLI that
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
          <code>{`# install MoonPay CLI
npm install -g @moonpay/cli

# authenticate
mp login --email you@example.com
mp verify --email you@example.com --code 123456

# create a wallet
mp wallet create --name main`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Installation
        </h2>
        <div className="code-block">
          <code>{`# run directly with npx
npx moonpay-owl

# or install globally
npm install -g moonpay-owl`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Quick Start
        </h2>
        <div className="code-block">
          <code>{`# launch the terminal dashboard
owl terminal --wallet main

# start MCP server for AI agents
owl mcp

# open the web dashboard
owl web

# add a price alert
owl alert add -t So11... -c solana --condition price_above:200 --channel telegram

# create a sharing tunnel
owl tunnel create -w main -n my-tunnel`}</code>
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
              <td>owl web</td>
              <td>Start local read-only web dashboard</td>
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
            <tr>
              <td>owl ledger list</td>
              <td>Show recent ledger entries</td>
            </tr>
            <tr>
              <td>owl ledger stats</td>
              <td>Show ledger statistics</td>
            </tr>
            <tr>
              <td>owl ledger export</td>
              <td>Export ledger (JSON/CSV)</td>
            </tr>
            <tr>
              <td>owl ledger clear</td>
              <td>Clear ledger entries</td>
            </tr>
            <tr>
              <td>owl report daily</td>
              <td>Today's spending report</td>
            </tr>
            <tr>
              <td>owl report weekly</td>
              <td>Last 7 days report</td>
            </tr>
            <tr>
              <td>owl report portfolio</td>
              <td>All wallets, all chains view</td>
            </tr>
            <tr>
              <td>owl dryrun swap</td>
              <td>Simulate a swap</td>
            </tr>
            <tr>
              <td>owl dryrun transfer</td>
              <td>Simulate a transfer</td>
            </tr>
            <tr>
              <td>owl dryrun bridge</td>
              <td>Simulate a bridge</td>
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
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
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
            <tr>
              <td>ledger.db</td>
              <td>SQLite database for activity ledger (audit trail)</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
