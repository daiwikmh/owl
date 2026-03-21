---
name: owl-tunnel
description: >
  Use when the user wants to share wallet access across multiple agents or machines without
  exposing private keys. Tunnels enable multi-agent wallet coordination with policy-based
  access control, transaction proposals, and approval workflows built on MoonPay CLI.
tags: [tunnel, wallet-sharing, multi-agent, policy, security, moonpay]
---

# OWL Tunnel

## Overview

OWL Tunnel enables multi-agent wallet sharing without key exposure. A wallet owner (host) creates a tunnel, and remote agents (peers) connect via Unix socket (local) or WebSocket (remote). Peers authenticate by signing a challenge with `mp message sign`. All transactions go through a policy engine with spending limits, token whitelists, and auto-approve rules.

## Prerequisites

- MoonPay CLI installed (`npm i -g @moonpay/cli`)
- Authenticated (`mp login` then `mp verify`)
- OWL CLI installed (`npm i -g owl`)
- A wallet created (`mp wallet create --name main`)

## Commands

```bash
# Host: create a tunnel
owl tunnel create --wallet main --name team-ops --port 9800

# Peer: connect to a tunnel (local Unix socket)
owl tunnel connect team-ops --wallet peer-wallet

# Peer: connect to a tunnel (remote WebSocket)
owl tunnel connect ws://host-ip:9800 --wallet peer-wallet

# List active tunnels
owl tunnel list
```

## Workflow

### Host side (wallet owner)

1. Create a tunnel: `owl tunnel create --wallet main --name team-ops`
2. The tunnel starts listening on both Unix socket and WebSocket
3. Share the tunnel name (local) or `ws://host:port` (remote) with peers
4. Set policies for each peer to control what they can do
5. Proposals from peers appear in the terminal or are auto-approved per policy

### Peer side (connecting agent)

1. Connect: `owl tunnel connect team-ops --wallet my-wallet`
2. The tunnel sends an auth challenge
3. OWL signs it with `mp message sign` using the peer's wallet
4. On success, the peer can propose transactions
5. Proposals are evaluated against the host's policies

### Setting policies

Policies control what each peer can do. Use the MCP tools or configure via JSON:

```json
{
  "tunnel_id": "abc123",
  "peer": "peer-wallet-address",
  "permissions": {
    "read_balance": true,
    "propose_tx": true,
    "auto_approve": {
      "max_amount_usd": 50,
      "allowed_tokens": ["USDC", "SOL"],
      "allowed_operations": ["swap", "transfer"]
    }
  },
  "daily_limit_usd": 100
}
```

### Authentication flow

```
1. Peer connects to host
2. Host sends random 32-byte nonce
3. Peer signs nonce: mp message sign --wallet <name> --chain solana --message <nonce>
4. Peer sends: { wallet_address, signature, chain }
5. Host verifies signature against wallet_address
6. Connection established with scoped permissions
```

## Examples

```bash
# Host creates tunnel and sets policy
owl tunnel create --wallet main --name ops --port 9800

# Peer connects
owl tunnel connect ops --wallet agent-wallet

# In OWL Terminal, host sees:
# [TUNNEL] Peer connected: 7xKp...
# [TUNNEL] Proposal: swap from 7xKp...
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `Authentication failed` | Invalid wallet signature | Check wallet name and ensure mp is authenticated |
| `No policy for this peer` | Host hasn't set a policy | Host must set policy via MCP tool or config |
| `Daily limit exceeded` | Peer hit spending cap | Wait for daily reset or ask host to increase limit |
| `Socket not found` | Tunnel not running | Ensure host has started the tunnel |

## Related Skills

- [moonpay-auth](../moonpay-auth/) - Authentication and wallet setup
- [owl-terminal](../owl-terminal/) - Interactive dashboard showing tunnel events
- [owl-alerts](../owl-alerts/) - Get notified about tunnel proposals
