import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { UnixHost } from "./transport/unix.js";
import { WsHost } from "./transport/ws.js";
import { generateNonce, verifySignature } from "./auth.js";
import { evaluatePolicy, getPolicy } from "./policy.js";
import { tunnelStore, type Proposal } from "./store.js";
import { createMessage, parseMessage } from "./protocol.js";
import { callMpTool } from "../mp.js";

// Maps clientId -> wallet address (after auth)
const authenticatedPeers = new Map<string, string>();
// Maps clientId -> pending nonce
const pendingChallenges = new Map<string, string>();
// Pending proposals awaiting manual approval
const pendingProposals = new Map<string, { proposal: Proposal; clientId: string }>();

// Event bus for terminal integration
export const tunnelEvents = new EventEmitter();

export async function createTunnel(wallet: string, name: string, port: number) {
  const tunnelId = randomUUID();

  tunnelStore.addTunnel({
    id: tunnelId,
    name,
    wallet,
    port,
    created_at: new Date().toISOString(),
    peers: [],
  });

  // Start both transports
  const unix = new UnixHost(name);
  const ws = new WsHost(port);

  const handleConnect = (transport: UnixHost | WsHost) => (clientId: string) => {
    const nonce = generateNonce();
    pendingChallenges.set(clientId, nonce);
    transport.send(clientId, createMessage("auth.challenge", { nonce }));
  };

  const handleMessage = (transport: UnixHost | WsHost) => async (clientId: string, raw: string) => {
    try {
      const msg = parseMessage(raw);

      if (msg.method === "auth.verify") {
        const nonce = pendingChallenges.get(clientId);
        if (!nonce) return;

        const { wallet_address, signature, chain } = msg.params as any;
        const valid = await verifySignature(wallet_address, nonce, signature, chain);

        if (valid) {
          authenticatedPeers.set(clientId, wallet_address);
          pendingChallenges.delete(clientId);
          tunnelStore.addPeer(tunnelId, wallet_address);
          transport.send(clientId, createMessage("auth.success", { wallet_address }));
          console.log(`Peer authenticated: ${wallet_address}`);
          tunnelEvents.emit("peer_connected", wallet_address);
        } else {
          transport.send(clientId, createMessage("auth.failed", { reason: "Invalid signature" }));
        }
        return;
      }

      // All other messages require auth
      const peerAddress = authenticatedPeers.get(clientId);
      if (!peerAddress) {
        transport.send(clientId, createMessage("error", { message: "Not authenticated" }));
        return;
      }

      if (msg.method === "tx.propose") {
        const { proposal_id, operation, params } = msg.params as any;
        const proposal: Proposal = {
          id: proposal_id,
          tunnel_id: tunnelId,
          peer: peerAddress,
          operation,
          params,
          status: "pending",
          created_at: new Date().toISOString(),
        };

        tunnelStore.addProposal(proposal);

        const policy = getPolicy(tunnelId, peerAddress);
        const evaluation = evaluatePolicy(policy, operation, (params as any).amount_usd ?? 0);

        if (!evaluation.allowed) {
          tunnelStore.updateProposal(proposal_id, { status: "rejected", reason: evaluation.reason });
          transport.send(
            clientId,
            createMessage("tx.result", { proposal_id, success: false, error: evaluation.reason })
          );
          return;
        }

        if (evaluation.autoApprove) {
          // Execute directly
          const result = await executeTx(wallet, operation, params);
          tunnelStore.updateProposal(proposal_id, {
            status: "executed",
            resolved_at: new Date().toISOString(),
          });
          transport.send(clientId, createMessage("tx.result", { proposal_id, ...result }));
          tunnelEvents.emit("tx_executed", { proposal, result });
        } else {
          // Queue for manual approval
          pendingProposals.set(proposal_id, { proposal, clientId });
          console.log(`\n[TUNNEL] Proposal from ${peerAddress}: ${operation}`);
          console.log(`  Params: ${JSON.stringify(params)}`);
          console.log(`  Approve: owl tunnel approve ${proposal_id}`);
          tunnelEvents.emit("proposal_pending", proposal);
        }
      }
    } catch (err) {
      // Malformed message, ignore
    }
  };

  const handleDisconnect = (clientId: string) => {
    const address = authenticatedPeers.get(clientId);
    authenticatedPeers.delete(clientId);
    pendingChallenges.delete(clientId);
    if (address) {
      console.log(`Peer disconnected: ${address}`);
      tunnelEvents.emit("peer_disconnected", address);
    }
  };

  unix.on("connect", handleConnect(unix));
  unix.on("message", handleMessage(unix));
  unix.on("disconnect", handleDisconnect);

  ws.on("connect", handleConnect(ws));
  ws.on("message", handleMessage(ws));
  ws.on("disconnect", handleDisconnect);

  await Promise.all([unix.start(), ws.start()]);

  console.log(`Tunnel "${name}" created`);
  console.log(`  ID: ${tunnelId}`);
  console.log(`  Wallet: ${wallet}`);
  console.log(`  Local: unix://${unix.getSocketPath()}`);
  console.log(`  Remote: ws://localhost:${port}`);
  console.log(`  Waiting for peers...`);

  // Keep alive
  await new Promise(() => {});
}

async function executeTx(
  wallet: string,
  operation: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const toolName = `token_${operation}`;
    const result = await callMpTool(toolName, { wallet, ...params });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// Manual approval (called from CLI or MCP)
export async function approveProposal(proposalId: string) {
  const pending = pendingProposals.get(proposalId);
  if (!pending) {
    console.log(`No pending proposal: ${proposalId}`);
    return;
  }

  const tunnel = tunnelStore.getTunnel(pending.proposal.tunnel_id);
  if (!tunnel) return;

  const result = await executeTx(tunnel.wallet, pending.proposal.operation, pending.proposal.params);
  tunnelStore.updateProposal(proposalId, {
    status: "executed",
    resolved_at: new Date().toISOString(),
  });

  pendingProposals.delete(proposalId);
  console.log(`Proposal ${proposalId} approved and executed`);
  tunnelEvents.emit("tx_executed", { proposal: pending.proposal, result });
}

export async function rejectProposal(proposalId: string, reason?: string) {
  const pending = pendingProposals.get(proposalId);
  if (!pending) {
    console.log(`No pending proposal: ${proposalId}`);
    return;
  }

  tunnelStore.updateProposal(proposalId, {
    status: "rejected",
    reason,
    resolved_at: new Date().toISOString(),
  });

  pendingProposals.delete(proposalId);
  console.log(`Proposal ${proposalId} rejected`);
}

export async function listTunnels() {
  const tunnels = tunnelStore.listTunnels();

  if (tunnels.length === 0) {
    console.log("No tunnels");
    return;
  }

  for (const t of tunnels) {
    console.log(`[${t.name}] wallet: ${t.wallet} | port: ${t.port} | peers: ${t.peers.length}`);
  }
}

// MCP handlers

export async function createTunnelFromMcp(wallet: string, name: string, port: number) {
  const tunnelId = randomUUID();

  tunnelStore.addTunnel({
    id: tunnelId,
    name,
    wallet,
    port,
    created_at: new Date().toISOString(),
    peers: [],
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          id: tunnelId,
          name,
          wallet,
          local_uri: `unix://${name}`,
          remote_uri: `ws://localhost:${port}`,
          status: "created",
        }),
      },
    ],
  };
}

export async function listTunnelsFromMcp() {
  const tunnels = tunnelStore.listTunnels();
  return {
    content: [{ type: "text" as const, text: JSON.stringify(tunnels) }],
  };
}

export async function approveProposalFromMcp(proposalId: string) {
  await approveProposal(proposalId);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ proposal_id: proposalId, status: "approved" }) }],
  };
}

export async function rejectProposalFromMcp(proposalId: string, reason?: string) {
  await rejectProposal(proposalId, reason);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ proposal_id: proposalId, status: "rejected", reason }),
      },
    ],
  };
}
