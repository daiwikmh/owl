export default function AlertsPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-green glow-green">
            {"!!"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Alerts
          </h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Cross-device price monitoring via Telegram and webhooks. A background
          daemon polls MoonPay&apos;s token API every 10 seconds and dispatches
          notifications when conditions are met.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="add-an-alert" className="text-xl font-semibold text-neon-green glow-green">
          Add an Alert
        </h2>
        <div className="code-block">
          <code>
            <span className="cmd">owl</span> alert add \{"\n"}
            {"  "}
            <span className="flag">-t</span> So11111111111111111111111111111111{" "}
            \{"\n"}
            {"  "}
            <span className="flag">-c</span> solana \{"\n"}
            {"  "}
            <span className="flag">--condition</span> price_above:200 \{"\n"}
            {"  "}
            <span className="flag">--channel</span> telegram
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
              <td>-t, --token</td>
              <td>Token address</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>-c, --chain</td>
              <td>Chain name (solana, ethereum, base, etc.)</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>--condition</td>
              <td>
                Condition in{" "}
                <code className="text-neon-green text-xs">type:value</code>{" "}
                format
              </td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>--channel</td>
              <td>Notification channel</td>
              <td>
                <span className="tag tag-required">required</span>
              </td>
            </tr>
            <tr>
              <td>--url</td>
              <td>Webhook URL (required for webhook channel)</td>
              <td>
                <span className="tag tag-optional">optional</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="condition-types" className="text-xl font-semibold text-neon-green glow-green">
          Condition Types
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Triggers When</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>price_above</td>
              <td>Price &gt;= threshold</td>
              <td>
                <code className="text-text-secondary text-xs">
                  price_above:200
                </code>
              </td>
            </tr>
            <tr>
              <td>price_below</td>
              <td>Price &lt;= threshold</td>
              <td>
                <code className="text-text-secondary text-xs">
                  price_below:100
                </code>
              </td>
            </tr>
            <tr>
              <td>percent_change</td>
              <td>% move in time window</td>
              <td>
                <code className="text-text-secondary text-xs">
                  percent_change:15
                </code>
              </td>
            </tr>
            <tr>
              <td>balance_below</td>
              <td>Wallet balance drops below threshold</td>
              <td>
                <code className="text-text-secondary text-xs">
                  balance_below:50
                </code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="manage-alerts" className="text-xl font-semibold text-neon-green glow-green">
          Manage Alerts
        </h2>
        <div className="code-block">
          <code>
            <span className="comment"># list all alerts</span>
            {"\n"}
            <span className="cmd">owl</span> alert list{"\n\n"}
            <span className="comment"># remove by ID</span>
            {"\n"}
            <span className="cmd">owl</span> alert remove{" "}
            <span className="string">abc123</span>
            {"\n\n"}
            <span className="comment"># start the monitoring daemon</span>
            {"\n"}
            <span className="cmd">owl</span> alert daemon
          </code>
        </div>
        <p className="text-sm text-text-muted">
          The daemon polls{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            mp token retrieve
          </code>{" "}
          every 10 seconds. Alerts fire once and are marked as triggered.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="notification-channels" className="text-xl font-semibold text-neon-green glow-green">
          Notification Channels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Telegram
            </h4>
            <p className="text-xs text-text-secondary mb-3">
              Send alerts to a Telegram chat via the Bot API.
            </p>
            <div className="code-block text-xs">
              <code>
                <span className="cmd">owl</span> alert channels \{"\n"}
                {"  "}
                <span className="flag">--telegram-token</span> BOT_TOKEN \
                {"\n"}
                {"  "}
                <span className="flag">--telegram-chat</span> CHAT_ID
              </code>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-bg-card border border-border-dim">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Webhook
            </h4>
            <p className="text-xs text-text-secondary mb-3">
              HTTP POST to any URL. Works with Slack, Discord, or custom
              servers.
            </p>
            <div className="code-block text-xs">
              <code>
                <span className="cmd">owl</span> alert channels \{"\n"}
                {"  "}
                <span className="flag">--webhook-url</span>{" "}
                <span className="string">https://hooks.slack.com/...</span>
              </code>
            </div>
          </div>
        </div>
        <p className="text-sm text-text-muted">
          Channel config is stored at{" "}
          <code className="text-neon-green text-xs bg-bg-secondary px-1.5 py-0.5 rounded">
            ~/.config/owl/channels.json
          </code>
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-green glow-green">
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
              <td>owl_alert_add</td>
              <td>Add a price alert rule</td>
            </tr>
            <tr>
              <td>owl_alert_list</td>
              <td>List all active alerts</td>
            </tr>
            <tr>
              <td>owl_alert_remove</td>
              <td>Remove an alert by ID</td>
            </tr>
            <tr>
              <td>owl_alert_channels_set</td>
              <td>Configure notification channels</td>
            </tr>
            <tr>
              <td>owl_alert_history</td>
              <td>View past triggered alerts</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
