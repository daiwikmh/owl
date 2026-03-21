# OWL

Infrastructure extensions for MoonPay's Open Wallet Standard (OWS).

Three primitives that turn MoonPay's wallet layer into a multi-agent coordination platform: **Terminal**, **Tunnel**, and **Alerts**.

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
                         |  | (15 custom)   |   |
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

Agents connect to `owl mcp` which acts as a single gateway. All MoonPay tools are proxied transparently. OWL adds 15 tools on top for tunnel, alert, and terminal operations.

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
  |  owl-alerts                               |
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
| `npx moonpay-owl mcp` | Start MCP server (stdio) |
| `npx moonpay-owl tunnel create` | Create a wallet sharing tunnel |
| `npx moonpay-owl tunnel connect` | Connect to a tunnel as peer |
| `npx moonpay-owl tunnel list` | List active tunnels |
| `npx moonpay-owl alert add` | Add a price alert |
| `npx moonpay-owl alert list` | List active alerts |
| `npx moonpay-owl alert remove` | Remove an alert |
| `npx moonpay-owl alert daemon` | Start alert monitoring |
| `npx moonpay-owl alert channels` | Configure Telegram / webhook |

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

## License

CC0
