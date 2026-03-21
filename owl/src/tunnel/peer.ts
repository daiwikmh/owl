import { randomUUID } from "node:crypto";
import { UnixPeer } from "./transport/unix.js";
import { WsPeer } from "./transport/ws.js";
import { signChallenge } from "./auth.js";
import { createMessage, parseMessage } from "./protocol.js";

type Transport = UnixPeer | WsPeer;

let activeTransport: Transport | null = null;
let authenticated = false;

function parseUri(uri: string): { type: "unix" | "ws"; target: string } {
  if (uri.startsWith("unix://")) {
    return { type: "unix", target: uri.slice(7) };
  }
  if (uri.startsWith("ws://") || uri.startsWith("wss://")) {
    return { type: "ws", target: uri };
  }
  // Assume it's a tunnel name for local unix connection
  return { type: "unix", target: uri };
}

export async function connectTunnel(uri: string, wallet: string) {
  const { type, target } = parseUri(uri);

  let transport: Transport;

  if (type === "unix") {
    transport = new UnixPeer(target);
    await transport.connect();
  } else {
    transport = new WsPeer();
    await (transport as WsPeer).connect(target);
  }

  activeTransport = transport;

  transport.on("message", async (raw: string) => {
    try {
      const msg = parseMessage(raw);

      if (msg.method === "auth.challenge") {
        const { nonce } = msg.params as { nonce: string };
        console.log("Received auth challenge, signing...");

        try {
          const { signature, walletAddress } = await signChallenge(wallet, nonce);
          transport.send(
            createMessage("auth.verify", {
              wallet_address: walletAddress,
              signature,
              chain: "solana",
            })
          );
        } catch (err) {
          console.error("Failed to sign challenge:", (err as Error).message);
        }
      }

      if (msg.method === "auth.success") {
        authenticated = true;
        console.log("Authenticated to tunnel");
        console.log(`  Wallet: ${(msg.params as any).wallet_address}`);
      }

      if (msg.method === "auth.failed") {
        console.error("Authentication failed:", (msg.params as any).reason);
        transport.disconnect();
      }

      if (msg.method === "tx.result") {
        const { proposal_id, success, data, error } = msg.params as any;
        if (success) {
          console.log(`Proposal ${proposal_id} executed successfully`);
          if (data) console.log(JSON.stringify(data, null, 2));
        } else {
          console.error(`Proposal ${proposal_id} failed: ${error}`);
        }
      }
    } catch {
      // Malformed message
    }
  });

  transport.on("disconnect", () => {
    console.log("Disconnected from tunnel");
    authenticated = false;
  });

  console.log(`Connected to tunnel: ${uri}`);
  console.log("Authenticating...");

  // Keep alive
  await new Promise(() => {});
}

export function proposeTx(
  operation: string,
  params: Record<string, unknown>
): string | null {
  if (!activeTransport || !authenticated) {
    console.error("Not connected or not authenticated");
    return null;
  }

  const proposalId = randomUUID();
  activeTransport.send(
    createMessage("tx.propose", {
      proposal_id: proposalId,
      operation,
      params,
    })
  );

  console.log(`Proposed: ${operation} (${proposalId})`);
  return proposalId;
}

// MCP handlers

export async function connectTunnelFromMcp(uri: string, wallet: string) {
  // For MCP, we return connection info rather than blocking
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          status: "use_cli",
          message: `Run: owl tunnel connect ${uri} --wallet ${wallet}`,
          uri,
          wallet,
        }),
      },
    ],
  };
}

export async function proposeTxFromMcp(
  tunnel: string,
  operation: string,
  params: Record<string, unknown>
) {
  const proposalId = proposeTx(operation, params);

  if (!proposalId) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: "Not connected to tunnel. Run: owl tunnel connect" }),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ proposal_id: proposalId, status: "proposed", operation, params }),
      },
    ],
  };
}
