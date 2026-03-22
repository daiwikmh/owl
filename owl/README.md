# OWL

Infrastructure extensions for MoonPay's Open Wallet Standard (OWS).

Six primitives that turn MoonPay's wallet layer into a multi-agent coordination platform: **Terminal**, **Tunnel**, **Alerts**, **Activity Ledger**, **Dry Run**, and **Reports**.

## Architecture

```
                         +---------------------+
                         |    AI Agents         |
                         |  (GPT, Nemotron, etc)|
                         +----------+----------+
                                    |
                              MCP (stdio)
                                    |
                         +----------v----------+
                         |     owl mcp          |
                         |  +---------------+   |
                         |  | owl tools     |   |
                         |  | (22 custom)   |   |
                         |  +-------+-------+   |
                         |          |           |
                         |  +-------v-------+   |
                         |  | mp mcp proxy  |   |
                         |  | (pass-through)|   |
                         |  +-------+-------+   |
                         +----------+-----------+
                                    |
                              MCP (stdio)
                                    |
                         +----------v----------+
                         |     mp mcp           |
                         |  (MoonPay CLI)       |
                         +----------+----------+
                                    |
                     +--------------+--------------+
                     |              |              |
                  Solana        Ethereum        Bitcoin
                  Base          Polygon         TRON
                  Arbitrum      Optimism        Avalanche
                  BNB
```

Agents connect to `owl mcp` which acts as a single gateway. All MoonPay tools are proxied transparently. OWL adds 22 tools on top for tunnel, alert, terminal, ledger, report, and dry-run operations.

## Terminal

A persistent TUI dashboard that wraps MoonPay CLI.

```
+------------------------------------------------------------------+
|  OWL Terminal  |  wallet: main  |  agent: openrouter/nemotron  |  $5,248  |
+------------------------------------------------------------------+
|  Portfolio                                                        |
|    SOL         12.4                                    $2,108     |
|    ETH          0.8                                    $2,640     |
|    USDC       500.0                                      $500     |
+------------------------------------------------------------------+
|  Activity                                                         |
|    14:32:01 [ALERT]  BONK +18.2% in 47min                       |
|    14:31:45 [TUNNEL] Agent-B proposed: swap 50 USDC              |
|    14:30:12 [AGENT]  Connected: openrouter/nemotron-3-super-120b  |
|    14:30:00 [INFO]   > show portfolio                            |
+------------------------------------------------------------------+
|  > _                                                              |
+------------------------------------------------------------------+
```

On first launch, an interactive wizard prompts for AI agent configuration:

```
  Provider:  openrouter / openai / ollama
  Model:     nvidia/nemotron-3-super-120b-a12b:free (or any model the provider supports)
  API Key:   sk-...
```

Config persists to `~/.config/owl/agent.json`. Reconfigure anytime with `agent setup`.

## Tunnel

Multi-agent wallet sharing without key exposure.

```
  Machine A (Host)                        Machine B (Peer)
  +------------------+                    +------------------+
  |  owl tunnel      |                    |  owl tunnel      |
  |  create          |                    |  connect         |
  |                  |                    |                  |
  |  Wallet Keys     |   Unix / WebSocket |  No Keys         |
  |  [encrypted]     | <===============> |  [auth only]     |
  |                  |                    |                  |
  |  Policy Engine   |                    |  Propose TX      |
  |  Sign + Broadcast|                    |  Wait for result |
  +------------------+                    +------------------+
```

### Authentication Flow

```
  Peer                              Host
    |                                 |
    |  -------- connect ---------->   |
    |                                 |
    |  <-- auth.challenge (nonce) --  |
    |                                 |
    |  mp message sign --message nonce|
    |                                 |
    |  -- auth.verify (sig, addr) ->  |
    |                                 |
    |  verify signature on-chain      |
    |                                 |
    |  <---- auth.success ----------  |
```

Keys never leave the host. Peers prove wallet ownership via `mp message sign` challenge-response.

### Policy Engine

```
  Incoming Proposal
        |
        v
  +-----+------+
  | Has policy? |--No--> REJECT
  +-----+------+
        | Yes
        v
  +-----+------+
  | Daily limit |--Exceeded--> REJECT
  | check       |
  +-----+------+
        | OK
        v
  +-----+------+
  | Auto-approve|--Yes--> EXECUTE via mp
  | rules match?|
  +-----+------+
        | No
        v
  Queue for manual approval
  (shows in Terminal + Alerts)
```

Policies are per-peer and support:
- Daily USD spending limits
- Token whitelists
- Operation whitelists (swap, transfer, bridge)
- Auto-approve thresholds

## Alerts

Cross-device price monitoring via Telegram and webhooks.

```
  +----------------+       +-----------------+
  |  owl alert     |       |  mp token       |
  |  daemon        +------>|  retrieve       |
  |  (polling 10s) |       |  (price data)   |
  +-------+--------+       +-----------------+
          |
          | condition met?
          |
    +-----v------+
    |  Dispatcher |
    +-----+------+
          |
     +----+----+
     |         |
     v         v
  Telegram   Webhook
  Bot API    HTTP POST
     |         |
     v         v
  Phone     Slack / Discord /
             Custom server
```

### Condition Types

| Type | Triggers when |
|------|--------------|
| `price_above` | Price >= threshold |
| `price_below` | Price <= threshold |
| `percent_change` | % move in time window |
| `balance_below` | Wallet balance drops |

## Activity Ledger

SQLite-backed audit trail of every tool call made by any agent.

```
  Agent calls tool
        |
        v
  +-----+------+
  | Log entry  |  tool, args, result, wallet, chain, status, timestamp
  +-----+------+
        |
        v
  ~/.config/owl/ledger.db
        |
  +-----+------+-----+------+
  |            |             |
  query      stats        export
  (filter)   (summary)   (JSON/CSV)
```

Every tool invocation (owl_* and mp_*) is recorded automatically. Query, aggregate, or export for compliance and debugging.

## Terminal Agent Tools

The terminal agent has access to all 22 OWL tools plus 13 MoonPay tools via the configured LLM:

| MoonPay Tool | Description |
|-------------|-------------|
| `mp_token_balance` | Check token balances |
| `mp_token_swap` | Swap tokens |
| `mp_token_transfer` | Transfer tokens |
| `mp_token_search` | Search for tokens |
| `mp_token_trending` | Get trending tokens |
| `mp_token_bridge` | Bridge tokens cross-chain |
| `mp_token_retrieve` | Get token price/details |
| `mp_transaction_list` | List transactions |
| `mp_wallet_list` | List wallets |
| `mp_wallet_create` | Create a new wallet |
| `mp_message_sign` | Sign a message |
| `mp_buy` | Buy crypto with fiat |
| `mp_deposit_create` | Create a deposit address |

All tool calls are logged to the Activity Ledger automatically.

## Dry Run Environment

Simulate any write operation before broadcasting. Uses MoonPay CLI's `--simulation true` flag under the hood.

```
  User: "dry run swap 10 USDC to SOL"
        |
        v
  +-----+------+
  | owl dryrun |  --simulation true
  +-----+------+
        |
        v
  +-----+------+
  | mp token   |  builds tx, gets quote
  | swap       |  does NOT broadcast
  +-----+------+
        |
        v
  Returns: quote, fees, expected output
```

Supports swap, transfer, and bridge operations. The agent can show the user what would happen before they commit.

```bash
npx moonpay-owl dryrun swap -w main -c solana --from USDC --amount 10 --to SOL
```

## Spending Reports

Aggregate ledger data into actionable summaries.

```bash
npx moonpay-owl report daily            # today's swaps, transfers, errors
npx moonpay-owl report weekly -w main   # last 7 days for a wallet
npx moonpay-owl report portfolio        # all wallets, all chains, unified view
```

Reports include operation breakdown (swaps, transfers, bridges), chain distribution, error rate, and recent write operations. The agent can generate these on demand: "show me my weekly report."

## Web Dashboard

Local read-only dashboard served at `http://127.0.0.1:3131`.

```bash
npx moonpay-owl web                # default port 3131
npx moonpay-owl web --port 8080    # custom port
```

```
+------------------------------------------------------------------+
|  OWL  | Portfolio | Activity | Alerts | Tunnels | Reports | Config |
+------------------------------------------------------------------+
|                                                                    |
|  main (hd wallet)                                                  |
|    solana      577FKh...miM                              --        |
|    ethereum    0x2806...cf2c                              --        |
|    base        0x2806...cf2c                              --        |
|    bitcoin     bc1qa5...5xt                               --        |
|                                                                    |
+------------------------------------------------------------------+
```

Six tabs: Portfolio (wallet balances across all chains), Activity (ledger feed with filters), Alerts (active rules and trigger history), Tunnels (peers and proposals), Reports (daily/weekly/monthly summaries), Config (agent and channel settings).

Binds to localhost only. No write operations. API key redacted in config view. Auto-refreshes portfolio every 30s and activity every 10s.

## How It Builds on MoonPay

OWL is a partner extension, not a fork. It follows the same pattern as Messari, Polymarket, and Myriad in the MoonPay skills ecosystem.

```
  +------------------------------------------+
  |           MoonPay Skills Repo             |
  |                                           |
  |  moonpay-auth    moonpay-swap-tokens      |
  |  moonpay-deposit moonpay-trading-auto     |
  |  messari-x402    myriad-prediction        |
  |                                           |
  |  owl-terminal    owl-tunnel               |  <-- our skills
  |  owl-alerts      owl-ledger              |
  |  owl-reports     owl-dryrun              |
  +------------------------------------------+
              |
              | agents load skills
              v
  +------------------------------------------+
  |           CLIs                            |
  |                                           |
  |  mp (MoonPay)     owl (this project)      |
  |  pc (Polymarket)  messari-cli             |
  +------------------------------------------+
              |
              | tools execute via
              v
  +------------------------------------------+
  |           MCP Servers                     |
  |                                           |
  |  mp mcp  -->  owl mcp (wraps mp mcp)      |
  +------------------------------------------+
```

## Quick Start

```bash
# Install MoonPay CLI
npm install -g @moonpay/cli

# Authenticate with MoonPay
mp login --email you@example.com
mp verify --email you@example.com --code 123456

# Create a wallet
mp wallet create --name main

# Launch terminal
npx moonpay-owl terminal --wallet main
```

## Commands

| Command | Description |
|---------|-------------|
| `npx moonpay-owl terminal` | Start TUI dashboard |
| `npx moonpay-owl web` | Start local read-only web dashboard |
| `npx moonpay-owl mcp` | Start MCP server (stdio) |
| `npx moonpay-owl tunnel create` | Create a wallet sharing tunnel |
| `npx moonpay-owl tunnel connect` | Connect to a tunnel as peer |
| `npx moonpay-owl tunnel list` | List active tunnels |
| `npx moonpay-owl alert add` | Add a price alert |
| `npx moonpay-owl alert list` | List active alerts |
| `npx moonpay-owl alert remove` | Remove an alert |
| `npx moonpay-owl alert daemon` | Start alert monitoring |
| `npx moonpay-owl alert channels` | Configure Telegram / webhook |
| `npx moonpay-owl ledger list` | Show recent ledger entries |
| `npx moonpay-owl ledger stats` | Show ledger statistics |
| `npx moonpay-owl ledger export` | Export ledger (JSON/CSV) |
| `npx moonpay-owl ledger clear` | Clear ledger entries |
| `npx moonpay-owl report daily` | Today's spending report |
| `npx moonpay-owl report weekly` | Last 7 days report |
| `npx moonpay-owl report monthly` | Last 30 days report |
| `npx moonpay-owl report portfolio` | All wallets, all chains view |
| `npx moonpay-owl dryrun swap` | Simulate a swap |
| `npx moonpay-owl dryrun transfer` | Simulate a transfer |
| `npx moonpay-owl dryrun bridge` | Simulate a bridge |

## MCP Tools

All tools are prefixed `owl_` to avoid conflicts with MoonPay's tools.

| Tool | Description |
|------|-------------|
| `owl_tunnel_create` | Create a tunnel |
| `owl_tunnel_connect` | Connect to a tunnel |
| `owl_tunnel_list` | List tunnels |
| `owl_tunnel_propose` | Propose TX through tunnel |
| `owl_tunnel_approve` | Approve pending proposal |
| `owl_tunnel_reject` | Reject pending proposal |
| `owl_tunnel_policy_set` | Set tunnel policies |
| `owl_tunnel_policy_get` | Get tunnel policies |
| `owl_alert_add` | Add alert rule |
| `owl_alert_list` | List alerts |
| `owl_alert_remove` | Remove alert |
| `owl_alert_channels_set` | Configure channels |
| `owl_alert_history` | View triggered alerts |
| `owl_terminal_start` | Start terminal |
| `owl_terminal_status` | Get terminal state |
| `owl_ledger_query` | Query ledger entries |
| `owl_ledger_stats` | Get ledger statistics |
| `owl_ledger_export` | Export ledger (JSON/CSV) |
| `owl_ledger_clear` | Clear ledger entries |
| `owl_report_generate` | Generate spending report (daily/weekly/monthly) |
| `owl_portfolio_all` | Unified portfolio across all wallets and chains |
| `owl_dryrun` | Simulate swap/transfer/bridge without broadcasting |

## License

CC0
