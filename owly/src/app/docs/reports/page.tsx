export default function ReportsPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-cyan glow-cyan">
            {"#="}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Reports
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Spending reports and portfolio snapshots. Aggregate raw ledger data
          into actionable summaries with operation breakdown, chain distribution,
          and error tracking.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="spending" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Spending Reports
        </h2>
        <div className="code-block">
          <code>{`# today's activity
owl report daily

# last 7 days, filtered by wallet
owl report weekly -w main

# last 30 days
owl report monthly`}</code>
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
              <td>-w, --wallet</td>
              <td>Filter by wallet name</td>
              <td><span className="tag tag-optional">optional</span></td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-text-secondary">
          Reports include total operations, write vs read breakdown, error count,
          swap/transfer/bridge counts, chain distribution, and the 10 most
          recent write operations.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="portfolio" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Portfolio View
        </h2>
        <div className="code-block">
          <code>owl report portfolio</code>
        </div>
        <p className="text-sm text-text-secondary">
          Queries all wallets across all supported chains (Solana, Ethereum,
          Base, Polygon, Arbitrum, Optimism, BNB, Avalanche) and returns a
          unified view. One command to answer &quot;what do I have?&quot;
        </p>
        <div className="code-block text-xs">
          <code>{`  main
    [solana]
      SOL: 12.4  USDC: 500.0
    [ethereum]
      ETH: 0.8  USDC: 200.0
    [base]
      ETH: 0.1

  trading
    [solana]
      SOL: 2.0  BONK: 10000000`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Agent Usage
        </h2>
        <p className="text-sm text-text-secondary">
          In the terminal agent, ask naturally:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Spending
            </h4>
            <p className="text-xs text-text-secondary">
              &quot;Show my weekly report&quot; or &quot;how many swaps did I do today?&quot;
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Portfolio
            </h4>
            <p className="text-xs text-text-secondary">
              &quot;What&apos;s my total across all wallets?&quot; or &quot;show all my balances&quot;
            </p>
          </div>
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
              <td>owl_report_generate</td>
              <td>Generate a spending report (daily, weekly, monthly)</td>
            </tr>
            <tr>
              <td>owl_portfolio_all</td>
              <td>Unified portfolio across all wallets and chains</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
