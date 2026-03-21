---
name: owl-alerts
description: >
  Use when the user wants cross-device price alerts for crypto tokens. Supports Telegram
  bot notifications and generic webhooks. Monitors prices via MoonPay CLI and fires alerts
  when conditions are met (price above/below, percent change, balance threshold).
tags: [alerts, notifications, telegram, webhook, price, monitoring, moonpay]
---

# OWL Alerts

## Overview

OWL Alerts provides cross-device price monitoring and notifications. Unlike MoonPay's built-in desktop-only alerts, OWL Alerts pushes notifications to Telegram and webhooks so you get alerted on any device. Runs as a background daemon polling MoonPay CLI for price data.

## Prerequisites

- MoonPay CLI installed (`npm i -g @moonpay/cli`)
- Authenticated (`mp login` then `mp verify`)
- OWL CLI installed (`npm i -g owl`)
- For Telegram: a bot token (from @BotFather) and chat ID
- For webhooks: a URL that accepts POST requests

## Commands

```bash
# Configure Telegram
owl alert channels --telegram-token "BOT_TOKEN" --telegram-chat "CHAT_ID"

# Configure webhook
owl alert channels --webhook-url "https://your-server.com/alerts"

# Add alerts
owl alert add --token SOL_ADDRESS --chain solana --condition "price_above:200" --channel telegram
owl alert add --token SOL_ADDRESS --chain solana --condition "price_below:150" --channel webhook --url "https://..."

# List active alerts
owl alert list

# Remove an alert
owl alert remove <alert-id>

# Start the monitoring daemon
owl alert daemon
```

## Workflow

1. Configure at least one notification channel (Telegram or webhook)
2. Add alert rules with conditions
3. Start the daemon: `owl alert daemon`
4. The daemon polls `mp token retrieve` every 10 seconds
5. When a condition is met, notifications fire to configured channels
6. Alert history is stored in SQLite at `~/.config/owl/alerts.db`

## Condition Types

| Type | Format | Example |
|------|--------|---------|
| Price above | `price_above:<value>` | `price_above:200` (fire when price >= $200) |
| Price below | `price_below:<value>` | `price_below:150` (fire when price <= $150) |
| Percent change | `percent_change:<value>` | `percent_change:15` (fire on 15% move) |
| Balance below | `balance_below:<value>` | `balance_below:100` (fire when balance < 100) |

## Examples

```bash
# Alert when SOL goes above $200 via Telegram
owl alert channels --telegram-token "123:ABC" --telegram-chat "456789"
owl alert add --token So11111111111111111111111111111111111111111 \
  --chain solana --condition "price_above:200" --channel telegram

# Alert via webhook when ETH drops below $3000
owl alert add --token 0x0000000000000000000000000000000000000000 \
  --chain ethereum --condition "price_below:3000" \
  --channel webhook --url "https://hooks.example.com/alerts"

# Start monitoring
owl alert daemon
```

## Webhook Payload

```json
{
  "text": "Alert: price_above 200 hit on solana. Current price: $205.50",
  "timestamp": "2026-03-21T14:32:00.000Z",
  "source": "owl-alerts"
}
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `Telegram not configured` | Missing bot token or chat ID | Run `owl alert channels --telegram-token ... --telegram-chat ...` |
| `No webhook URL configured` | Webhook channel used without URL | Add `--url` flag or configure default with `owl alert channels` |
| `mp token retrieve failed` | Token address invalid or mp not auth'd | Verify token address and run `mp login` |

## Related Skills

- [moonpay-auth](../moonpay-auth/) - Authentication
- [moonpay-price-alerts](../moonpay-price-alerts/) - MoonPay's desktop alerts
- [owl-terminal](../owl-terminal/) - Alerts appear in the terminal activity feed
- [owl-tunnel](../owl-tunnel/) - Get notified about tunnel proposals
