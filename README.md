# OWL

Multi-agent coordination layer for the Open Wallet Standard.

OWL extends MoonPay's OWS from a single-agent wallet into infrastructure where multiple AI agents coordinate around shared wallets. Keys never leave the host. Every operation goes through OWS. OWL adds delegation, policy enforcement, audit, simulation, alerts, and an agent-native interface on top.

[![Live](https://img.shields.io/badge/Live-owl--moonpay.vercel.app-00C389?logo=vercel)](https://owl-moonpay.vercel.app)
[![Docs](https://img.shields.io/badge/Docs-owl--moonpay.vercel.app%2Fdocs-00C389?logo=readthedocs)](https://owl-moonpay.vercel.app/docs)
[![npm](https://img.shields.io/badge/npm-moonpay--owl-CB3837?logo=npm)](https://www.npmjs.com/package/moonpay-owl)
[![GitHub](https://img.shields.io/badge/GitHub-daiwikmh%2Fowl-181717?logo=github)](https://github.com/daiwikmh/owl)
[![License](https://img.shields.io/badge/License-CC0-blue)](https://creativecommons.org/publicdomain/zero/1.0/)

## What OWS Provides vs What OWL Adds

```
  OWS (MoonPay)                    OWL (this project)
  +--------------------------+     +---------------------------------+
  | Key generation           |     | Delegated access (Tunnels)      |
  | Signing enclave          |     | Per-peer policy enforcement     |
  | Multi-chain derivation   |     | Cross-agent audit trail         |
  | Local-first storage      |     | Pre-execution simulation        |
  | Policy engine (basic)    |     | Programmable spending policies  |
  | MCP tool interface       |     | Alert/notification layer        |
  | CLI + REST + SDK         |     | Agent-native TUI + Dashboard    |
  +--------------------------+     +---------------------------------+
```

OWL does not fork or replace OWS. It wraps, extends, and adds coordination primitives.

## Quick Start

```bash
npm install -g @moonpay/cli
mp login --email you@example.com
mp verify --email you@example.com --code <code>
mp wallet create --name main

npm install -g moonpay-owl
owl terminal --wallet main
```

## Architecture

```
AI Agents (any LLM via MCP)
       |
   MCP (stdio)
       |
   owl mcp
   +-----------------------------+
   | 22 owl_* tools              |
   | (tunnels, alerts, ledger,   |
   |  reports, dryrun, terminal) |
   +-------------+---------------+
                 |
   +-------------v---------------+
   | mp mcp proxy                |
   | (13 mp_* tools, passthrough)|
   +-------------+---------------+
                 |
             mp mcp
                 |
   +-------------v---------------+
   | OWS Signing Enclave         |
   | (local keys, never exposed) |
   +-----------------------------+
                 |
    Solana  Ethereum  Base  Polygon
    Arbitrum  Optimism  BNB  Avalanche
    Bitcoin  TRON
```

## Seven Primitives

### 1. Terminal

TUI dashboard with integrated AI agent. Auto-prompts for LLM provider on first launch (OpenRouter, OpenAI, Ollama). All 35 tools available. Handles error recovery autonomously.

```
+------------------------------------------------------------------+
|  OWL Terminal  |  wallet: main  |  openrouter/nemotron  |  $5,248 |
+------------------------------------------------------------------+
|  > swap 10 USDC to SOL on solana                                  |
|  owl > Swapped 10 USDC for 0.067 SOL on solana.                  |
+------------------------------------------------------------------+
```

### 2. Tunnel

Multi-agent wallet sharing without key exposure. Host creates tunnel, peer connects via Unix socket or WebSocket. Auth uses OWS `signMessage` for challenge-response. Policy engine controls what each peer can do.

```
  Host (has keys)                    Peer (no keys)
  +------------------+              +------------------+
  |  OWS Signing     |              |  Propose TX      |
  |  Enclave         |  challenge   |  via tunnel      |
  |  [keys locked]   | <==========> |  [auth only]     |
  |  Policy Engine   |  response    |  Wait for result |
  |  Sign + Broadcast|              |                  |
  +------------------+              +------------------+
```

### 3. Alerts

Price monitoring daemon. Polls every 10 seconds, dispatches to Telegram or webhook. Condition types: `price_above`, `price_below`, `percent_change`, `balance_below`. Channel credentials validated before alert creation.

### 4. Activity Ledger

SQLite audit trail. Every tool call (owl and mp) logged automatically with tool name, arguments, result, wallet, chain, status, timestamp. Query, aggregate, export (JSON/CSV).

### 5. Dry Run

Simulate swaps, transfers, and bridges before broadcasting. Agent sees expected output, fees, and price impact before committing real funds.

### 6. Reports

Spending summaries (daily, weekly, monthly) and unified portfolio view across all wallets and chains. Built from ledger data.

### 7. Web Dashboard

Local read-only dashboard at `127.0.0.1:3131`. Tabs for portfolio, activity, alerts, tunnels, reports, and config. Serves `/skill.md` for agent discovery. API keys redacted.

## How OWL Implements OWS

**Implements the standard:** Every wallet operation goes through MoonPay's `mp` CLI. OWL never touches keys or constructs transactions. This validates that a full coordination layer can be built on OWS without modifying wallet internals.

**Extends with new policy types:** OWL adds inter-agent delegation policies on top of OWS's policy engine:

```
  OWS Policy Engine               OWL Policy Extensions
  +-------------------------+     +----------------------------------+
  | Spending limits         |     | Per-peer daily USD limits        |
  | Token allowlists        |     | Per-peer token whitelists        |
  | Chain restrictions      |     | Per-peer operation whitelists    |
  | Simulation gates        |     | Auto-approve thresholds          |
  | Time-based rules        |     | Tunnel-scoped policy binding     |
  +-------------------------+     +----------------------------------+
       applies to: owner              applies to: delegated peers
```

**Builds agents on OWS:** The terminal agent uses OWS as a black-box wallet primitive. Creates wallets, signs messages for tunnel auth, reads balances, executes trades, simulates, audits, and coordinates with other agents. All through OWS.

## CLI Commands

| Command | Description |
|---------|-------------|
| `owl terminal` | TUI dashboard with AI agent |
| `owl mcp` | Start MCP server (stdio) |
| `owl web` | Local read-only dashboard |
| `owl reset` | Remove agent credentials (`--all` for everything) |
| `owl tunnel create/connect/list` | Multi-agent wallet sharing |
| `owl alert add/list/remove/daemon/channels` | Price monitoring |
| `owl ledger list/stats/export/clear` | Audit trail |
| `owl report daily/weekly/monthly/portfolio` | Spending reports |
| `owl dryrun swap/transfer/bridge` | Pre-execution simulation |

## MCP Tools

### OWL Tools (22)

| Tool | Purpose |
|------|---------|
| `owl_tunnel_create` | Delegated wallet access |
| `owl_tunnel_connect` | Agent-to-agent auth via signMessage |
| `owl_tunnel_list` | Tunnel state management |
| `owl_tunnel_propose` | Transaction delegation |
| `owl_tunnel_approve/reject` | Multi-agent governance |
| `owl_tunnel_policy_set/get` | Extended policy engine |
| `owl_alert_add/list/remove` | Reactive monitoring |
| `owl_alert_channels_set` | Telegram/webhook config |
| `owl_alert_history` | Alert audit trail |
| `owl_ledger_query/stats/export/clear` | Signing audit |
| `owl_report_generate` | Spending analytics |
| `owl_portfolio_all` | Cross-wallet, cross-chain view |
| `owl_terminal_start/status` | Agent-native UX |
| `owl_dryrun` | Pre-execution simulation |

### MoonPay Tools (13, proxied)

| Tool | Description |
|------|-------------|
| `mp_token_balance` | Token balances |
| `mp_token_swap` | Swap tokens |
| `mp_token_transfer` | Send tokens |
| `mp_token_search` | Search by name/symbol |
| `mp_token_trending` | Trending tokens |
| `mp_token_bridge` | Cross-chain bridge |
| `mp_token_retrieve` | Price and metadata |
| `mp_transaction_list` | TX history |
| `mp_wallet_list` | List wallets |
| `mp_wallet_create` | Create HD wallet |
| `mp_message_sign` | Sign messages |
| `mp_buy` | Fiat on-ramp |
| `mp_deposit_create` | Deposit address |

## Supported Chains

Solana, Ethereum, Base, Polygon, Arbitrum, Optimism, BNB, Avalanche, TRON, Bitcoin.

## Data Storage

All data lives in `~/.config/owl/`:

| File | Contents |
|------|----------|
| `agent.json` | LLM provider, model, API key |
| `channels.json` | Telegram bot token/chat ID, webhook URL |
| `terminal-state.json` | Terminal session state |
| `alerts.db` | Alert rules and trigger history (SQLite) |
| `ledger.db` | Activity ledger (SQLite) |
| `tunnels.json` | Tunnel records and proposals |
| `tunnel-policies.json` | Per-peer spending policies |

## Links

- [Live site](https://owl-moonpay.vercel.app)
- [Documentation](https://owl-moonpay.vercel.app/docs)
- [npm package](https://www.npmjs.com/package/moonpay-owl)
- [MoonPay Agents](https://www.moonpay.com/agents)
- [OWS Standard](https://openwallet.sh/)
- [MoonPay Skills](https://github.com/moonpay/skills)
- [MoonPay CLI skill.md](https://agents.moonpay.com/skill.md)

## License

CC0
