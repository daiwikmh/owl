# OWL

Infrastructure extensions that push the Open Wallet Standard (OWS) from a single-agent wallet into a multi-agent coordination layer.

## What OWS Gives You

OWS is MoonPay's CC0-licensed standard for local-first, chain-agnostic wallet management. It handles key generation, signing enclave isolation, and multi-chain HD derivation. One vault, one interface, every chain. Keys never leave the signing enclave.

## What OWL Adds

OWS solves wallet infrastructure for a single agent. OWL solves what happens when multiple agents need to coordinate around those wallets.

```
  What OWS provides              What OWL extends it with
  +--------------------------+   +---------------------------------+
  | Key generation           |   | Delegated access (Tunnels)      |
  | Signing enclave          |   | Per-peer policy enforcement     |
  | Multi-chain derivation   |   | Cross-agent audit trail         |
  | Local-first storage      |   | Pre-execution simulation        |
  | Policy engine (basic)    |   | Programmable spending policies  |
  | MCP tool interface       |   | Alert/notification layer        |
  | CLI + REST + SDK         |   | Agent-native TUI + Dashboard    |
  +--------------------------+   +---------------------------------+
```

OWL does not fork or replace OWS. Every operation goes through the MoonPay CLI (`mp`). OWL wraps it, extends it, and adds the coordination primitives that autonomous agents need.

## How OWL Pushes OWS Forward

### 1. Delegated Wallet Access Without Key Exposure

OWS proves that keys can stay in a local signing enclave. OWL proves that this model scales to multiple agents. Tunnels let Agent B propose transactions on Agent A's wallet without Agent A ever sharing keys. The host signs, the peer proposes, and the policy engine decides what gets through.

This is the missing piece for autonomous agent teams: shared wallet access with zero trust assumptions.

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

The auth flow uses OWS's own `signMessage` to prove wallet ownership. No external auth system, no API keys between agents. Just cryptographic proof using the same primitives OWS already provides.

### 2. Policy Engine Extensions

OWS defines a policy engine with spending limits, allowlists, and simulation gates. OWL extends this with per-peer policies scoped to tunnel connections:

- Daily USD spending limits per peer agent
- Token whitelists (only USDC and SOL, not memecoins)
- Operation whitelists (read-only peers vs. full trading peers)
- Auto-approve thresholds (under $10 goes through, over $10 queues for review)

This demonstrates that OWS's policy model is composable. Third parties can layer domain-specific policies on top of the base standard without modifying OWS itself.

### 3. Audit Trail as Infrastructure

Every tool call through OWL is logged to a local SQLite ledger: tool name, arguments, result, wallet, chain, status, timestamp. This turns OWS from a signing primitive into an auditable signing primitive.

```
  Agent calls any tool
        |
        v
  +-------------+
  | OWS signs   |
  +------+------+
         |
  +------v------+
  | OWL logs    |  tool, args, result, wallet, chain, status, timestamp
  +------+------+
         |
    query / stats / export (JSON, CSV)
```

Agents can review their own history, generate compliance reports, and detect anomalies. This is foundational for any production deployment where agents manage real funds.

### 4. Pre-Execution Simulation

OWL adds a dry-run layer that simulates swaps, transfers, and bridges before broadcasting. The agent sees expected output, fees, and price impact before committing. This extends OWS's `simulate()` concept into a full pre-execution review workflow that agents can use autonomously.

### 5. Reactive Monitoring

The alert system polls OWS wallet data and dispatches notifications when conditions are met. This turns OWS from a pull-based system (agent asks for balance) into a push-based system (agent gets notified when balance changes). Supports Telegram and webhooks for cross-device delivery.

### 6. Agent-Native Interface

The terminal provides a natural-language interface over OWS. Instead of agents needing to know CLI flags, they get 35 MCP tools they can call directly. The terminal agent handles error recovery automatically: if a channel isn't configured, it asks for credentials and sets them up. If a wallet is missing, it creates one.

This demonstrates OWS as a foundational primitive: agents don't need to understand wallet internals, they just use OWS through OWL's tool layer.

## How OWL Implements the OWS Standard

OWS is MoonPay's open-source, CC0-licensed wallet infrastructure standard for local-first, chain-agnostic wallet management. The standard invites projects to implement it, extend it with new chain plugins or policy types, and build agents that use OWS as their wallet layer. OWL does all three.

### Implementing the Standard

OWL does not reimplement wallet operations. Every swap, transfer, bridge, balance check, and signing operation goes through MoonPay's OWS implementation (`mp` CLI). OWL's MCP server wraps `mp mcp` as a transparent proxy, meaning every MoonPay tool works exactly as the standard defines. This is a deliberate choice: OWL validates that a third-party project can build a full coordination layer on top of OWS without touching wallet internals.

### Extending with New Policy Types

OWS defines a policy engine that evaluates constraints before signing: spending limits, allowlists, denylists, chain restrictions, simulation requirements. OWL extends this with an entirely new policy category that OWS did not originally cover: **inter-agent delegation policies**.

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

This proves the OWS policy model is extensible. OWL adds policies that scope not just what operations are allowed, but who is allowed to request them, through which tunnel, and up to what value. These are new policy types layered on top of OWS, not modifications to it.

### Building Agents on OWS as Their Wallet Layer

OWL's terminal agent treats OWS as a black-box wallet primitive. The agent calls `mp_token_swap`, `mp_wallet_create`, `mp_message_sign` through MCP. It never constructs transactions, manages keys, or talks to RPCs directly. OWS handles all of that.

This is the pattern OWS was designed for: agents use OWS as their wallet layer, and OWL proves it works. The agent:

- Creates wallets via OWS (`mp_wallet_create`)
- Signs messages via OWS (`mp_message_sign`) for tunnel authentication
- Reads balances via OWS (`mp_token_balance`)
- Executes trades via OWS (`mp_token_swap`, `mp_token_bridge`, `mp_token_transfer`)
- Simulates before committing via OWL's dry-run layer (which itself calls OWS)
- Audits every operation through the ledger
- Coordinates with other agents through tunnels (which use OWS signing for auth)

The entire OWL stack is a demonstration that OWS works as a foundational primitive for autonomous agents. Not a toy demo, but infrastructure that handles delegation, governance, audit, and multi-agent coordination while OWS handles the hard part: secure, local-first, chain-agnostic wallet operations.

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

### Terminal

TUI dashboard with integrated AI agent. Auto-prompts for LLM provider setup on first launch (OpenRouter, OpenAI, Ollama). The agent has all 35 tools and handles error recovery autonomously.

```
+------------------------------------------------------------------+
|  OWL Terminal  |  wallet: main  |  openrouter/nemotron  |  $5,248 |
+------------------------------------------------------------------+
|  > swap 10 USDC to SOL on solana                                  |
|  owl > Swapped 10 USDC for 0.067 SOL on solana.                  |
+------------------------------------------------------------------+
```

### Tunnel

Multi-agent wallet sharing. Host creates tunnel, peer connects via Unix socket or WebSocket. Auth via challenge-response using OWS `signMessage`. Policy engine controls what peers can do. Keys never leave the host.

### Alerts

Price monitoring daemon. Polls every 10 seconds, dispatches to Telegram or webhook when conditions trigger. Channel credentials validated before alert creation.

### Activity Ledger

SQLite audit trail. Every tool call logged automatically. Query by tool, wallet, chain, date, status. Export to JSON or CSV.

### Dry Run

Simulate swap, transfer, or bridge without broadcasting. Returns expected output for agent review before committing real funds.

### Reports

Spending summaries (daily, weekly, monthly) and unified portfolio view across all wallets and chains. Built from ledger data.

### Web Dashboard

Local read-only dashboard at `127.0.0.1:3131`. Six tabs for portfolio, activity, alerts, tunnels, reports, and config. Serves `/skill.md` for agent discovery. API keys redacted.

## Quick Start

```bash
npm install -g @moonpay/cli
mp login --email you@example.com
mp verify --email you@example.com --code 123456
mp wallet create --name main

npm install -g moonpay-owl
owl terminal --wallet main
```

## MCP Configuration

```json
{
  "mcpServers": {
    "owl": {
      "command": "owl",
      "args": ["mcp"]
    }
  }
}
```

All 35 tools (22 owl + 13 mp) available through a single MCP server.

## Commands

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

## MCP Tools (22)

| Tool | What it extends in OWS |
|------|----------------------|
| `owl_tunnel_create` | Delegated wallet access |
| `owl_tunnel_connect` | Agent-to-agent auth via signMessage |
| `owl_tunnel_list` | Tunnel state management |
| `owl_tunnel_propose` | Transaction delegation |
| `owl_tunnel_approve/reject` | Multi-agent governance |
| `owl_tunnel_policy_set/get` | Extended policy engine |
| `owl_alert_add/list/remove` | Reactive monitoring over OWS data |
| `owl_alert_channels_set` | Cross-device notification |
| `owl_alert_history` | Alert audit trail |
| `owl_ledger_query/stats/export/clear` | Signing audit infrastructure |
| `owl_report_generate` | Spending analytics |
| `owl_portfolio_all` | Cross-wallet, cross-chain aggregation |
| `owl_terminal_start/status` | Agent-native UX |
| `owl_dryrun` | Pre-execution simulation |

## License

CC0
