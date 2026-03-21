import { z } from "zod";

// JSON-RPC message envelope
export const MessageSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.string().optional(),
  method: z.string(),
  params: z.record(z.any()).optional(),
  result: z.any().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.any().optional(),
    })
    .optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Challenge-response auth
export interface ChallengeMessage {
  method: "auth.challenge";
  params: { nonce: string };
}

export interface AuthResponse {
  method: "auth.verify";
  params: {
    wallet_address: string;
    signature: string;
    chain: string;
  };
}

// Transaction proposals
export interface ProposeMessage {
  method: "tx.propose";
  params: {
    proposal_id: string;
    operation: "swap" | "transfer" | "bridge";
    params: Record<string, unknown>;
  };
}

export interface ApproveMessage {
  method: "tx.approve";
  params: {
    proposal_id: string;
  };
}

export interface RejectMessage {
  method: "tx.reject";
  params: {
    proposal_id: string;
    reason?: string;
  };
}

export interface TxResultMessage {
  method: "tx.result";
  params: {
    proposal_id: string;
    success: boolean;
    data?: unknown;
    error?: string;
  };
}

// Peer status
export interface StatusMessage {
  method: "tunnel.status";
  params: {
    connected_peers: number;
    pending_proposals: number;
  };
}

export function createMessage(method: string, params?: Record<string, unknown>, id?: string): string {
  const msg: Message = {
    jsonrpc: "2.0",
    method,
    params,
    id,
  };
  return JSON.stringify(msg);
}

export function parseMessage(raw: string): Message {
  return MessageSchema.parse(JSON.parse(raw));
}
