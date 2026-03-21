export default function TunnelPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-magenta glow-magenta">
            {"<>"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Tunnel
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Multi-agent wallet sharing without key exposure. A host shares wallet
          access through a tunnel, and peers propose transactions that go through
          a policy engine before execution.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="cli-commands" className="text-xl font-semibold text-neon-magenta glow-magenta">
          CLI Commands
        </h2>

        <h3 className="text-sm font-semibold text-text-primary mt-2">
          Create a Tunnel (Host)
        </h3>
        <div className="code-block">
          <code>
            <span className="cmd">owl</span> tunnel create{" "}
            <span className="flag">-w</span> main{" "}
            <span className="flag">-n</span> my-tunnel{" "}
            <span className="flag">-p</span> 9800
          </code>
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
              <td>Wallet to share</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>-n, --name</td>
              <td>Tunnel name</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>-p, --port</td>
              <td>WebSocket port for remote peers</td>
              <td>
                <span className="tag tag-optional">default: 9800</span>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-sm font-semibold text-text-primary mt-4">
          Connect to a Tunnel (Peer)
        </h3>
        <div className="code-block">
          <code>
            <span className="cmd">owl</span> tunnel connect{" "}
            <span className="string">ws://host:9800/my-tunnel</span>{" "}
            <span className="flag">-w</span> my-wallet
          </code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Arg / Flag</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>uri</td>
              <td>Tunnel URI to connect to</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>-w, --wallet</td>
              <td>Local wallet for signing auth challenges</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-sm font-semibold text-text-primary mt-4">
          List Tunnels
        </h3>
        <div className="code-block">
          <code>
            <span className="cmd">owl</span> tunnel list
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="authentication" className="text-xl font-semibold text-neon-magenta glow-magenta">
          Authentication
        </h2>
        <p className="text-sm text-text-secondary">
          Keys never leave the host. Peers prove wallet ownership via{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            mp message sign
          </code>{" "}
          challenge-response using the wallet&apos;s own keypair.
        </p>
        <div className="code-block text-xs">
          <code>
            {"  Peer                              Host\n"}
            {"    |                                 |\n"}
            {"    |  "}
            <span className="flag">-------- connect ----------&gt;</span>
            {"   |\n"}
            {"    |                                 |\n"}
            {"    |  "}
            <span className="keyword">
              &lt;-- auth.challenge (nonce) --
            </span>
            {"  |\n"}
            {"    |                                 |\n"}
            {"    |  "}
            <span className="string">mp message sign --message nonce</span>
            {"\n"}
            {"    |                                 |\n"}
            {"    |  "}
            <span className="flag">
              -- auth.verify (sig, addr) --&gt;
            </span>
            {"  |\n"}
            {"    |                                 |\n"}
            {"    |  "}
            <span className="string">verify signature on-chain</span>
            {"      |\n"}
            {"    |                                 |\n"}
            {"    |  "}
            <span className="keyword">
              &lt;---- auth.success ----------
            </span>
            {"  |"}
          </code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="policy-engine" className="text-xl font-semibold text-neon-magenta glow-magenta">
          Policy Engine
        </h2>
        <p className="text-sm text-text-secondary">
          Every incoming transaction proposal is evaluated against per-peer
          policies. Policies control what operations are allowed and whether they
          need manual approval.
        </p>
        <div className="code-block text-xs">
          <code>
            {"  Incoming Proposal\n"}
            {"        |\n"}
            {"  "}
            <span className="keyword">Has policy?</span>
            {" --No--> "}
            <span className="keyword">REJECT</span>
            {"\n"}
            {"        | Yes\n"}
            {"  "}
            <span className="flag">Daily limit OK?</span>
            {" --No--> "}
            <span className="keyword">REJECT</span>
            {"\n"}
            {"        | Yes\n"}
            {"  "}
            <span className="string">Auto-approve match?</span>
            {" --Yes--> "}
            <span className="string">EXECUTE</span>
            {"\n"}
            {"        | No\n"}
            {"  "}
            <span className="cmd">Queue for manual approval</span>
          </code>
        </div>

        <h3 className="text-sm font-semibold text-text-primary mt-2">
          Policy Options
        </h3>
        <table className="param-table">
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>daily_limit_usd</td>
              <td>number</td>
              <td>Max daily spending in USD (default: 100)</td>
            </tr>
            <tr>
              <td>allowed_tokens</td>
              <td>string[]</td>
              <td>Token symbols the peer can operate on</td>
            </tr>
            <tr>
              <td>allowed_operations</td>
              <td>string[]</td>
              <td>
                Allowed ops:{" "}
                <code className="text-neon-green text-xs">swap</code>,{" "}
                <code className="text-neon-green text-xs">transfer</code>,{" "}
                <code className="text-neon-green text-xs">bridge</code>
              </td>
            </tr>
            <tr>
              <td>auto_approve_max_usd</td>
              <td>number</td>
              <td>Auto-approve transactions under this amount</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-magenta glow-magenta">
          Transport
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Unix Socket
            </h4>
            <p className="text-xs text-text-secondary">
              Local machine communication. Fast, no network exposure.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              WebSocket
            </h4>
            <p className="text-xs text-text-secondary">
              Remote peer connections. Configurable port (default 9800).
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-magenta glow-magenta">
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
              <td>owl_tunnel_create</td>
              <td>Create a tunnel (host side)</td>
            </tr>
            <tr>
              <td>owl_tunnel_connect</td>
              <td>Connect as peer</td>
            </tr>
            <tr>
              <td>owl_tunnel_list</td>
              <td>List active tunnels</td>
            </tr>
            <tr>
              <td>owl_tunnel_propose</td>
              <td>Propose a transaction</td>
            </tr>
            <tr>
              <td>owl_tunnel_approve</td>
              <td>Approve a pending proposal</td>
            </tr>
            <tr>
              <td>owl_tunnel_reject</td>
              <td>Reject a pending proposal</td>
            </tr>
            <tr>
              <td>owl_tunnel_policy_set</td>
              <td>Set per-peer policies</td>
            </tr>
            <tr>
              <td>owl_tunnel_policy_get</td>
              <td>Get current policies</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
