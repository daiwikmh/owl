export default function WebDashboardPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-cyan glow-cyan">
            {"//"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Web Dashboard
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Local read-only web dashboard. View portfolio, activity, alerts,
          tunnels, reports, and configuration from your browser. No write
          operations. Binds to localhost only.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>{`# start on default port 3131
owl web

# custom port
owl web --port 8080`}</code>
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
              <td>-p, --port</td>
              <td>HTTP port to listen on</td>
              <td>3131</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-text-secondary">
          Opens at <span className="text-neon-cyan">http://127.0.0.1:3131</span>.
          Bound to localhost for security. Press Ctrl+C to stop.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="panels" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Panels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Portfolio
            </h4>
            <p className="text-xs text-text-secondary">
              All wallets with chain addresses and token balances. Auto-refreshes
              every 30 seconds.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Activity
            </h4>
            <p className="text-xs text-text-secondary">
              Ledger feed with filters for tool, wallet, chain, and status. Stats
              summary with total operations and error count.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Alerts
            </h4>
            <p className="text-xs text-text-secondary">
              Active alert rules and trigger history. Shows condition type, value,
              notification channel, and trigger timestamps.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Tunnels
            </h4>
            <p className="text-xs text-text-secondary">
              Active tunnels with connected peers and transaction proposals with
              status badges (pending, approved, rejected, executed).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Reports
            </h4>
            <p className="text-xs text-text-secondary">
              Daily, weekly, and monthly spending summaries. Operation breakdown,
              chain distribution, and recent write operations.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Config
            </h4>
            <p className="text-xs text-text-secondary">
              Agent provider and model configuration. Notification channel setup
              (Telegram and webhook). API keys are redacted.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="api" className="text-xl font-semibold text-neon-cyan glow-cyan">
          API Endpoints
        </h2>
        <p className="text-sm text-text-secondary">
          All endpoints are GET-only. No write operations. JSON responses with
          CORS headers.
        </p>
        <table className="param-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>/api/wallets</td>
              <td>All wallets with chain addresses</td>
            </tr>
            <tr>
              <td>/api/portfolio</td>
              <td>Balances across all wallets and chains</td>
            </tr>
            <tr>
              <td>/api/ledger</td>
              <td>Ledger entries (supports limit, tool, wallet, chain, since, status params)</td>
            </tr>
            <tr>
              <td>/api/ledger/stats</td>
              <td>Aggregated ledger statistics</td>
            </tr>
            <tr>
              <td>/api/alerts</td>
              <td>All alert rules</td>
            </tr>
            <tr>
              <td>/api/alerts/history</td>
              <td>Alert trigger history</td>
            </tr>
            <tr>
              <td>/api/tunnels</td>
              <td>Active tunnels and proposals</td>
            </tr>
            <tr>
              <td>/api/reports/daily</td>
              <td>Today&apos;s activity report</td>
            </tr>
            <tr>
              <td>/api/reports/weekly</td>
              <td>Last 7 days report</td>
            </tr>
            <tr>
              <td>/api/reports/monthly</td>
              <td>Last 30 days report</td>
            </tr>
            <tr>
              <td>/api/config</td>
              <td>Agent and channel configuration (secrets redacted)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Security
        </h2>
        <ul className="text-sm text-text-secondary space-y-2">
          <li>Binds to 127.0.0.1 only, not accessible from other machines</li>
          <li>All endpoints are read-only, no mutations possible</li>
          <li>API keys and bot tokens are redacted in /api/config responses</li>
          <li>No authentication required (localhost-only access is the boundary)</li>
        </ul>
      </section>
    </article>
  );
}
