export default function ActivityLedgerPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-yellow glow-yellow">
            {"[]"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Activity Ledger
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Append-only audit trail for every agent operation. Every tool call,
          swap, transfer, alert, and tunnel action is logged with timestamps,
          wallet, chain, and status. SQLite-backed, queryable, and exportable.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="why" className="text-xl font-semibold text-neon-yellow glow-yellow">
          Why
        </h2>
        <p className="text-text-secondary leading-relaxed">
          Autonomous agents need accountability. When an agent swaps tokens,
          sets alerts, or approves tunnel proposals, you need a record of what
          happened, when, and whether it succeeded. The ledger logs every tool
          invocation automatically and stores it locally at{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">
            ~/.config/owl/ledger.db
          </code>
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="cli-commands" className="text-xl font-semibold text-neon-yellow glow-yellow">
          CLI Commands
        </h2>
        <div className="code-block">
          <code>{`# show recent entries
owl ledger list

# filter by tool, wallet, or chain
owl ledger list -t mp_token_swap -w main

# show entries since a date
owl ledger list -s 2026-03-21

# show only errors
owl ledger list --status error`}</code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>-n, --limit</td>
              <td>Number of entries to show (default 20)</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
            <tr>
              <td>-t, --tool</td>
              <td>Filter by tool name</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
            <tr>
              <td>-w, --wallet</td>
              <td>Filter by wallet name</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
            <tr>
              <td>-c, --chain</td>
              <td>Filter by chain</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
            <tr>
              <td>-s, --since</td>
              <td>Show entries since date (ISO format)</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
            <tr>
              <td>--status</td>
              <td>Filter by status (ok or error)</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="stats" className="text-xl font-semibold text-neon-yellow glow-yellow">
          Statistics
        </h2>
        <div className="code-block">
          <code>{`# overall stats
owl ledger stats

# stats for today
owl ledger stats -s 2026-03-21`}</code>
        </div>
        <p className="text-sm text-text-muted">
          Returns total operations, error count, breakdown by tool and chain.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="export-formats" className="text-xl font-semibold text-neon-yellow glow-yellow">
          Export
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              JSON
            </h4>
            <p className="text-xs text-text-secondary mb-3">
              Full structured export with all fields.
            </p>
            <div className="code-block text-xs">
              <code>owl ledger export -f json</code>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              CSV
            </h4>
            <p className="text-xs text-text-secondary mb-3">
              Spreadsheet-friendly format for analysis.
            </p>
            <div className="code-block text-xs">
              <code>owl ledger export -f csv -s 2026-03-01</code>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="clear" className="text-xl font-semibold text-neon-yellow glow-yellow">
          Clear
        </h2>
        <div className="code-block">
          <code>{`# clear entries before a date
owl ledger clear --before 2026-03-01

# clear all entries
owl ledger clear`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="what-is-logged" className="text-xl font-semibold text-neon-yellow glow-yellow">
          What Gets Logged
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>timestamp</td>
              <td>ISO 8601 date and time of the operation</td>
            </tr>
            <tr>
              <td>tool</td>
              <td>Tool name (e.g. mp_token_swap, owl_alert_add)</td>
            </tr>
            <tr>
              <td>args</td>
              <td>JSON arguments passed to the tool</td>
            </tr>
            <tr>
              <td>result</td>
              <td>Tool output (truncated to 2000 chars)</td>
            </tr>
            <tr>
              <td>wallet</td>
              <td>Wallet used (if applicable)</td>
            </tr>
            <tr>
              <td>chain</td>
              <td>Chain used (if applicable)</td>
            </tr>
            <tr>
              <td>status</td>
              <td>ok or error</td>
            </tr>
            <tr>
              <td>agent</td>
              <td>Agent identifier (provider/model)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="mcp-tools" className="text-xl font-semibold text-neon-yellow glow-yellow">
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
              <td>owl_ledger_query</td>
              <td>Query ledger entries with filters</td>
            </tr>
            <tr>
              <td>owl_ledger_stats</td>
              <td>Get summary statistics</td>
            </tr>
            <tr>
              <td>owl_ledger_export</td>
              <td>Export as JSON or CSV</td>
            </tr>
            <tr>
              <td>owl_ledger_clear</td>
              <td>Clear entries</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
