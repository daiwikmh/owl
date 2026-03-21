export default function DryRunPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-magenta glow-magenta">
            {"~>"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Dry Run
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Simulate any write operation before broadcasting. Uses MoonPay
          CLI&apos;s simulation mode under the hood. Returns quotes, fees, and
          expected output without committing to the blockchain.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-magenta glow-magenta">
          Why
        </h2>
        <p className="text-text-secondary leading-relaxed">
          Autonomous agents should never blindly execute transactions. Dry run
          lets the agent (or user) preview exactly what would happen before
          committing. The simulation builds the full transaction, gets quotes
          and fees, but does not sign or broadcast.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="swap" className="text-xl font-semibold text-neon-magenta glow-magenta">
          Swap
        </h2>
        <div className="code-block">
          <code>{`owl dryrun swap -w main -c solana --from USDC --amount 10 --to SOL`}</code>
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
              <td>Wallet name</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>-c, --chain</td>
              <td>Chain name</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--from</td>
              <td>Token to sell</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--amount</td>
              <td>Amount to sell</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--to</td>
              <td>Token to buy</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="transfer" className="text-xl font-semibold text-neon-magenta glow-magenta">
          Transfer
        </h2>
        <div className="code-block">
          <code>{`owl dryrun transfer -w main -c ethereum --token USDC --amount 50 --to 0xabc...`}</code>
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
              <td>Wallet name</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>-c, --chain</td>
              <td>Chain name</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--token</td>
              <td>Token to send</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--amount</td>
              <td>Amount to send</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--to</td>
              <td>Destination address</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="bridge" className="text-xl font-semibold text-neon-magenta glow-magenta">
          Bridge
        </h2>
        <div className="code-block">
          <code>{`owl dryrun bridge -w main --from-chain ethereum --from-token USDC \\
  --amount 100 --to-chain base --to-token USDC`}</code>
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
              <td>Source wallet</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--from-chain</td>
              <td>Source chain</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--from-token</td>
              <td>Source token</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--amount</td>
              <td>Amount to bridge</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--to-chain</td>
              <td>Destination chain</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--to-token</td>
              <td>Destination token</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-magenta glow-magenta">
          Agent Usage
        </h2>
        <p className="text-sm text-text-secondary">
          In the terminal agent, just ask naturally. The agent will call
          owl_dryrun before executing any real transaction.
        </p>
        <div className="code-block text-xs">
          <code>{`you: dry run swap 10 USDC to SOL on solana
owl: Simulating swap...
     -> owl_dryrun { operation: swap, wallet: main, chain: solana, ... }
     Quote: 10 USDC -> 0.058 SOL
     Fees: ~$0.002
     This is a simulation. Say "execute" to confirm.`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-magenta glow-magenta">
          MCP Tool
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
              <td>owl_dryrun</td>
              <td>Simulate swap, transfer, or bridge without broadcasting</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
