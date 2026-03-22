# OWL: Infrastructure Extensions for MoonPay OWS

OWL turns MoonPay's wallet layer into a multi-agent coordination platform. It adds tunnels, alerts, an activity ledger, dry-run simulation, spending reports, and a TUI terminal on top of MoonPay's Open Wallet Standard.

**Package:** `moonpay-owl` (npm)
**CLI binary:** `owl`
**MCP server:** `owl mcp` (stdio)
**Requires:** `@moonpay/cli` (`mp`) authenticated and a wallet created

---

## Prerequisites

OWL depends on the MoonPay CLI. Set it up first:

```bash
npm install -g @moonpay/cli
mp login --email you@example.com
mp verify --email you@example.com --code <code_from_email>
mp consent check
mp consent accept
mp wallet create --name main
```

Verify everything works:

```bash
mp wallet list
mp token balance list --wallet main --chain solana
```

Then install OWL:

```bash
npm install -g moonpay-owl
```

---

## MCP Configuration

To connect OWL to any MCP-compatible agent (Claude Code, Cursor, Windsurf, etc.), add this to your MCP config:

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

OWL's MCP server proxies all MoonPay tools transparently AND exposes 22 additional OWL tools. You do NOT need a separate `mp mcp` entry.

---

## Authentication

OWL itself has no auth layer. It relies on the MoonPay CLI session (`mp login`). If `mp wallet list` works, OWL works.

The OWL terminal has its own agent config (LLM provider + API key) stored at `~/.config/owl/agent.json`. This is configured on first launch or via `agent setup` in the terminal.

---

## Supported Chains

Inherited from MoonPay: Solana, Ethereum, Base, Polygon, Arbitrum, Optimism, BNB, Avalanche, TRON, Bitcoin.

All chains are available for wallets, balances, swaps, bridges, and transfers. Market data coverage varies by chain.

---

## Tools Reference

### MoonPay Tools (proxied through OWL MCP)

These are the MoonPay CLI tools available through OWL's MCP server. They map directly to `mp` CLI commands.

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mp_token_balance` | Token balances for a wallet | `wallet`, `chain` | |
| `mp_token_swap` | Swap tokens on a chain | `wallet`, `chain`, `from_token`, `from_amount`, `to_token` | |
| `mp_token_transfer` | Transfer tokens | `wallet`, `chain`, `token`, `amount`, `to` | |
| `mp_token_search` | Search tokens by name/symbol/address | `query`, `chain` | `limit` |
| `mp_token_trending` | Trending tokens on a chain | `chain` | `limit`, `page` |
| `mp_token_bridge` | Bridge tokens cross-chain | `from_wallet`, `from_chain`, `from_token`, `from_amount`, `to_chain`, `to_token` | |
| `mp_token_retrieve` | Token price and metadata | `token`, `chain` | |
| `mp_transaction_list` | Transaction history | | `wallet` |
| `mp_wallet_list` | List all wallets | | |
| `mp_wallet_create` | Create a new HD wallet | `name` | |
| `mp_message_sign` | Sign a message | `wallet`, `chain`, `message` | |
| `mp_buy` | Buy crypto with fiat | `token`, `amount`, `wallet` | |
| `mp_deposit_create` | Create deposit address | `wallet` | `name` |

### OWL Alert Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `owl_alert_add` | Add a price alert | `token`, `chain`, `condition_type`, `condition_value`, `channels` | `webhook_url` |
| `owl_alert_list` | List active alerts | | |
| `owl_alert_remove` | Remove an alert | `id` | |
| `owl_alert_channels_set` | Configure Telegram or webhook | | `telegram_token`, `telegram_chat_id`, `webhook_url` |
| `owl_alert_history` | View triggered alerts | | `limit` |

**Condition types:** `price_above`, `price_below`, `percent_change`, `balance_below`
**Channels:** `telegram`, `webhook`

Channels must be configured before creating alerts. Use `owl_alert_channels_set` first:

```
owl_alert_channels_set({ telegram_token: "bot123:ABC", telegram_chat_id: "456789" })
owl_alert_add({ token: "So111...", chain: "solana", condition_type: "price_above", condition_value: 200, channels: ["telegram"] })
```

### OWL Tunnel Tools

Tunnels let agents share wallet access without exposing private keys. The host holds the keys, peers propose transactions, the host signs and broadcasts.

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `owl_tunnel_create` | Create a tunnel (host side) | `wallet`, `name` | `port` |
| `owl_tunnel_connect` | Connect to tunnel (peer side) | `uri`, `wallet` | |
| `owl_tunnel_list` | List active tunnels | | |
| `owl_tunnel_propose` | Propose TX through tunnel | `tunnel`, `operation`, `params` | |
| `owl_tunnel_approve` | Approve pending proposal | `proposal_id` | |
| `owl_tunnel_reject` | Reject pending proposal | `proposal_id` | `reason` |
| `owl_tunnel_policy_set` | Set spending/access policies | `tunnel`, `peer` | `daily_limit_usd`, `allowed_tokens`, `allowed_operations`, `auto_approve_max_usd` |
| `owl_tunnel_policy_get` | Get tunnel policies | `tunnel` | `peer` |

**Operations:** `swap`, `transfer`, `bridge`

Authentication uses challenge-response: the peer signs a nonce with `mp message sign`, the host verifies wallet ownership on-chain. Keys never leave the host.

### OWL Ledger Tools

Every tool call (owl_* and mp_*) is automatically logged to a local SQLite database.

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `owl_ledger_query` | Query past actions | | `limit`, `tool`, `wallet`, `chain`, `since`, `status` |
| `owl_ledger_stats` | Aggregate statistics | | `since` |
| `owl_ledger_export` | Export as JSON or CSV | `format` | `limit`, `since` |
| `owl_ledger_clear` | Clear entries | | `before` |

### OWL Report Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `owl_report_generate` | Spending report | `period` | `wallet` |
| `owl_portfolio_all` | All wallets, all chains | | |

**Periods:** `daily`, `weekly`, `monthly`

### OWL Terminal and Simulation Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `owl_terminal_start` | Launch TUI (returns CLI command) | | `wallet` |
| `owl_terminal_status` | Current session state | | |
| `owl_dryrun` | Simulate without broadcasting | `operation`, `wallet`, `chain`, `params` | |

**Dry run params by operation:**
- **swap:** `from_token`, `from_amount`, `to_token`
- **transfer:** `token`, `amount`, `to`
- **bridge:** `from_token`, `from_amount`, `to_chain`, `to_token`

---

## CLI Commands

```bash
owl terminal [--wallet <name>]       # TUI dashboard with AI agent
owl mcp                              # Start MCP server (stdio)
owl web [--port <port>]              # Local read-only dashboard (default 3131)
owl reset [--all] [--yes]            # Remove agent credentials (--all for everything)

owl tunnel create --wallet <w> --name <n> [--port <p>]
owl tunnel connect <uri> --wallet <w>
owl tunnel list

owl alert add -t <token> -c <chain> --condition <type:value> --channel <ch>
owl alert list
owl alert remove <id>
owl alert daemon                     # Start polling (10s interval)
owl alert channels --telegram-token <t> --telegram-chat <id>
owl alert channels --webhook-url <url>

owl ledger list [-n <limit>] [-t <tool>] [-w <wallet>] [-c <chain>] [-s <since>] [--status <ok|error>]
owl ledger stats [-s <since>]
owl ledger export -f <json|csv> [-n <limit>] [-s <since>]
owl ledger clear [--before <date>]

owl report daily [-w <wallet>]
owl report weekly [-w <wallet>]
owl report monthly [-w <wallet>]
owl report portfolio

owl dryrun swap -w <wallet> -c <chain> --from <token> --amount <n> --to <token>
owl dryrun transfer -w <wallet> -c <chain> --token <token> --amount <n> --to <addr>
owl dryrun bridge -w <wallet> --from-chain <c> --from-token <t> --amount <n> --to-chain <c> --to-token <t>
```

---

## Data Storage

All OWL data lives in `~/.config/owl/`:

| File | Contents |
|------|----------|
| `agent.json` | LLM provider, model, API key |
| `channels.json` | Telegram bot token/chat ID, webhook URL |
| `terminal-state.json` | Terminal session state |
| `alerts.db` | Alert rules and trigger history (SQLite) |
| `ledger.db` | Activity ledger (SQLite) |
| `tunnels.json` | Tunnel records and proposals |
| `tunnel-policies.json` | Per-peer spending policies |

`owl reset` removes only `agent.json` and `channels.json`. Use `owl reset --all` to wipe everything.

---

## Architecture

```
AI Agents (any LLM)
       |
   MCP (stdio)
       |
   owl mcp
   +------------------+
   | 22 owl_* tools   |
   | (alerts, tunnel, |
   |  ledger, reports,|
   |  dryrun, terminal)|
   +--------+---------+
            |
   +--------v---------+
   | mp mcp proxy     |
   | (13 mp_* tools)  |
   +--------+---------+
            |
        mp mcp
            |
   Solana, Ethereum, Base,
   Polygon, Arbitrum, Bitcoin,
   Optimism, BNB, Avalanche, TRON
```

---

## Agent Integration Patterns

### Pattern 1: MCP Server (recommended)

Any agent that speaks MCP can connect to OWL and get all 35 tools (13 mp + 22 owl). No custom code needed.

### Pattern 2: OWL Terminal

The built-in terminal runs an AI agent loop with tool calling. On first launch it prompts for provider config:

```
Provider:  openrouter / openai / ollama
Model:     nvidia/nemotron-3-super-120b-a12b:free (default)
API Key:   sk-...
```

The agent can then handle natural language: "swap 10 USDC to SOL", "set alert for SOL above 200", "show my weekly report".

### Pattern 3: CLI Scripting

All operations are available as CLI commands for shell scripts and CI/CD pipelines.

---

## Common Token Addresses

| Token | Chain | Address |
|-------|-------|---------|
| SOL (native) | solana | `So11111111111111111111111111111111111111111` |
| USDC | solana | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| ETH (native) | ethereum/base/arbitrum | `0x0000000000000000000000000000000000000000` |
| USDC | ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| USDC | base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| USDC | polygon | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |

When a user provides a token name instead of an address, resolve it first with `mp_token_search`.

---

## Safety

- Always `owl_dryrun` before executing swaps, transfers, or bridges when the user asks for simulation
- Check balances with `mp_token_balance` before transactions
- Tunnel policies enforce spending limits and token whitelists
- The activity ledger records every tool call for audit
- `owl reset` only removes agent credentials, not transaction history
- The web dashboard is read-only, localhost-only, with API keys redacted

---

## Quick Start for Agents

1. Ensure MoonPay CLI is authenticated: `mp wallet list` should return wallets
2. Install OWL: `npm install -g moonpay-owl`
3. Connect via MCP: add `owl mcp` to your agent's MCP config
4. All 35 tools are now available
5. To use alerts, configure channels first: `owl_alert_channels_set`
6. To use the terminal: `owl terminal --wallet main`

---

## Links

- **npm:** https://www.npmjs.com/package/moonpay-owl
- **MoonPay CLI docs:** https://agents.moonpay.com/skill.md
- **MoonPay Agents:** https://www.moonpay.com/agents
- **OWS:** https://openwallet.sh/
- **MoonPay Skills repo:** https://github.com/moonpay/skills
