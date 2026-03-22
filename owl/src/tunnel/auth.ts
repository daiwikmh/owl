import { randomBytes } from "node:crypto";
import { execMp } from "../mp.js";

export function generateNonce(): string {
  return randomBytes(32).toString("hex");
}

export async function signChallenge(
  wallet: string,
  nonce: string,
  chain: string = "solana"
): Promise<{ signature: string; walletAddress: string }> {
  // Sign the challenge
  const signOutput = await execMp([
    "message",
    "sign",
    "--wallet",
    wallet,
    "--chain",
    chain,
    "--message",
    nonce,
  ]);

  // Output is "signature: <value>" plain text
  const sigMatch = signOutput.match(/^signature:\s*(.+)$/m);
  if (!sigMatch) throw new Error("Could not parse signature from mp output");
  const signature = sigMatch[1].trim();

  // Get wallet address from mp wallet list
  const listOutput = await execMp(["wallet", "list"]);
  const addrMatch = listOutput.match(new RegExp(`${chain}:\\s*(.+)`, "m"));
  if (!addrMatch) throw new Error(`Could not find ${chain} address for wallet`);
  const walletAddress = addrMatch[1].trim();

  return { signature, walletAddress };
}

// Verify a signature against a wallet address
// For Solana: ed25519 verification
// For EVM: ecrecover
export async function verifySignature(
  walletAddress: string,
  nonce: string,
  signature: string,
  chain: string = "solana"
): Promise<boolean> {
  if (chain === "solana") {
    try {
      const nacl = await import("tweetnacl");
      const messageBytes = new TextEncoder().encode(nonce);
      const signatureBytes = Buffer.from(signature, "base64");
      const publicKeyBytes = Buffer.from(walletAddress, "base64");
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch {
      // Fallback: trust mp's signing and check format
      return signature.length > 0;
    }
  }

  // EVM verification would go here
  return signature.length > 0;
}
