---
name: owl-terminal
description: >
  Use when the user wants an interactive crypto trading terminal, a persistent dashboard
  to monitor portfolio balances, execute swaps/transfers, track price alerts, and manage
  tunnel connections in a single TUI interface built on MoonPay CLI.
tags: [terminal, tui, dashboard, portfolio, trading, moonpay]
---

# OWL Terminal

## Overview

OWL Terminal is a persistent, interactive TUI dashboard that wraps MoonPay CLI. It provides a split-pane interface with live portfolio tracking, activity feed (alerts, tunnel events), and a command prompt for executing trades, searches, and wallet management.

## Prerequisites

- MoonPay CLI installed (`npm i -g @moonpay/cli`)
- Authenticated (`mp login` then `mp verify`)
- OWL CLI installed (`npm i -g owl`)
- A wallet created (`mp wallet create --name main`)

## Commands

```bash
# Start the terminal
owl terminal --wallet main
```

### Terminal commands (inside the TUI)

```bash
show portfolio                    # Balances across chains
show balances solana              # Balances for a specific chain
search BONK on solana             # Search tokens
trending solana                   # Trending tokens
swap 5 USDC to SOL               # Swap tokens
transfer 10 USDC to <address>    # Transfer tokens
tunnel status                     # Active tunnel connections
tunnel proposals                  # Pending tunnel proposals
alert list                        # Active price alerts
history                           # Recent transactions
help                              # Show all commands
exit                              # Exit terminal
```

## Workflow

1. Start the terminal: `owl terminal --wallet main`
2. A splash screen with OWL ASCII art appears briefly
3. The dashboard loads with three panes: Portfolio, Activity, and Command Input
4. Portfolio refreshes every 30 seconds automatically
5. Type commands in the input prompt at the bottom
6. Activity feed shows alerts, tunnel events, and command history in real-time
7. Press Ctrl+C or type `exit` to quit

## Examples

```bash
# Start terminal and check portfolio
owl terminal --wallet main
> show portfolio

# Search and swap tokens
> search SOL on solana
> swap 5 USDC to SOL

# Monitor activity
> trending solana
> alert list
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `mp not found` | MoonPay CLI not installed | Run `npm i -g @moonpay/cli` |
| `No balances found` | Wallet empty or not authenticated | Run `mp login` and fund wallet |
| `Unknown command` | Typo or unsupported command | Type `help` for available commands |

## Related Skills

- [moonpay-auth](../moonpay-auth/) - Authentication and wallet setup
- [moonpay-check-wallet](../moonpay-check-wallet/) - Balance checking
- [moonpay-swap-tokens](../moonpay-swap-tokens/) - Token swaps
- [owl-tunnel](../owl-tunnel/) - Wallet sharing tunnels
- [owl-alerts](../owl-alerts/) - Cross-device price alerts
