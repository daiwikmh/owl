import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const POLICIES_PATH = join(CONFIG_DIR, "tunnel-policies.json");

export interface TunnelPolicy {
  tunnel_id: string;
  peer: string;
  permissions: {
    read_balance: boolean;
    propose_tx: boolean;
    auto_approve: {
      max_amount_usd: number;
      allowed_tokens: string[];
      allowed_operations: string[];
    } | null;
  };
  daily_limit_usd: number;
  spent_today_usd: number;
  last_reset: string;
}

function loadPolicies(): Record<string, TunnelPolicy[]> {
  try {
    return JSON.parse(readFileSync(POLICIES_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function savePolicies(policies: Record<string, TunnelPolicy[]>) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(POLICIES_PATH, JSON.stringify(policies, null, 2));
}

export function getPolicy(tunnelId: string, peer: string): TunnelPolicy | null {
  const policies = loadPolicies();
  const tunnelPolicies = policies[tunnelId] ?? [];
  return tunnelPolicies.find((p) => p.peer === peer) ?? null;
}

export function getPoliciesForTunnel(tunnelId: string): TunnelPolicy[] {
  const policies = loadPolicies();
  return policies[tunnelId] ?? [];
}

export function setPolicy(policy: TunnelPolicy) {
  const policies = loadPolicies();
  if (!policies[policy.tunnel_id]) {
    policies[policy.tunnel_id] = [];
  }

  const existing = policies[policy.tunnel_id].findIndex((p) => p.peer === policy.peer);
  if (existing >= 0) {
    policies[policy.tunnel_id][existing] = policy;
  } else {
    policies[policy.tunnel_id].push(policy);
  }

  savePolicies(policies);
}

export function evaluatePolicy(
  policy: TunnelPolicy | null,
  operation: string,
  amountUsd: number
): { allowed: boolean; autoApprove: boolean; reason?: string } {
  if (!policy) {
    return { allowed: false, autoApprove: false, reason: "No policy for this peer" };
  }

  if (!policy.permissions.propose_tx) {
    return { allowed: false, autoApprove: false, reason: "Peer cannot propose transactions" };
  }

  // Check daily limit
  const today = new Date().toISOString().split("T")[0];
  if (policy.last_reset !== today) {
    policy.spent_today_usd = 0;
    policy.last_reset = today;
  }

  if (policy.spent_today_usd + amountUsd > policy.daily_limit_usd) {
    return {
      allowed: false,
      autoApprove: false,
      reason: `Daily limit exceeded: $${policy.spent_today_usd}/$${policy.daily_limit_usd}`,
    };
  }

  // Check auto-approve
  const auto = policy.permissions.auto_approve;
  if (auto && amountUsd <= auto.max_amount_usd) {
    if (auto.allowed_operations.includes(operation)) {
      return { allowed: true, autoApprove: true };
    }
  }

  // Allowed but requires manual approval
  return { allowed: true, autoApprove: false };
}

// MCP handlers

export async function setPolicyFromMcp(args: {
  tunnel: string;
  peer: string;
  daily_limit_usd?: number;
  allowed_tokens?: string[];
  allowed_operations?: string[];
  auto_approve_max_usd?: number;
}) {
  const existing = getPolicy(args.tunnel, args.peer);

  const policy: TunnelPolicy = {
    tunnel_id: args.tunnel,
    peer: args.peer,
    permissions: {
      read_balance: true,
      propose_tx: true,
      auto_approve:
        args.auto_approve_max_usd != null
          ? {
              max_amount_usd: args.auto_approve_max_usd,
              allowed_tokens: args.allowed_tokens ?? [],
              allowed_operations: args.allowed_operations ?? ["swap", "transfer"],
            }
          : existing?.permissions.auto_approve ?? null,
    },
    daily_limit_usd: args.daily_limit_usd ?? existing?.daily_limit_usd ?? 100,
    spent_today_usd: existing?.spent_today_usd ?? 0,
    last_reset: existing?.last_reset ?? new Date().toISOString().split("T")[0],
  };

  setPolicy(policy);

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ status: "set", policy }) }],
  };
}

export async function getPolicyFromMcp(tunnel: string, peer?: string) {
  if (peer) {
    const policy = getPolicy(tunnel, peer);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(policy ?? { error: "No policy found" }) }],
    };
  }

  const policies = getPoliciesForTunnel(tunnel);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(policies) }],
  };
}
