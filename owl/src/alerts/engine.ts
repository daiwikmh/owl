import { getStore } from "./store.js";
import { dispatch, isChannelConfigured } from "./channels/index.js";
import { execMp } from "../mp.js";
import { randomUUID } from "node:crypto";

export interface AlertRule {
  id: string;
  token: string;
  chain: string;
  condition_type: "price_above" | "price_below" | "percent_change" | "balance_below";
  condition_value: number;
  channels: string[];
  webhook_url?: string;
  created_at: string;
  triggered_at: string | null;
}

// CLI commands

interface AlertOpts {
  token: string;
  chain: string;
  condition: string;
  channel: string;
  url?: string;
}

export async function addAlert(opts: AlertOpts) {
  const [type, value] = opts.condition.split(":");
  if (!type || !value) {
    console.error("Invalid condition format. Use type:value (e.g. price_above:200)");
    return;
  }

  if (!isChannelConfigured(opts.channel, opts.url)) {
    const hint = opts.channel === "telegram"
      ? "Run: owl alert channels --telegram-token <token> --telegram-chat <chatId>"
      : "Provide --url or run: owl alert channels --webhook-url <url>";
    console.error(`Channel "${opts.channel}" is not configured. ${hint}`);
    return;
  }

  const store = getStore();
  const rule: AlertRule = {
    id: randomUUID(),
    token: opts.token,
    chain: opts.chain,
    condition_type: type as AlertRule["condition_type"],
    condition_value: parseFloat(value),
    channels: [opts.channel],
    webhook_url: opts.url,
    created_at: new Date().toISOString(),
    triggered_at: null,
  };

  store.addRule(rule);
  console.log(`Alert added: ${rule.id}`);
  console.log(`  ${rule.condition_type} ${rule.condition_value} on ${rule.token} (${rule.chain})`);
  console.log(`  Channel: ${opts.channel}`);
}

export async function listAlerts() {
  const store = getStore();
  const rules = store.listRules();

  if (rules.length === 0) {
    console.log("No active alerts");
    return;
  }

  for (const rule of rules) {
    const status = rule.triggered_at ? `triggered ${rule.triggered_at}` : "active";
    console.log(`[${rule.id.slice(0, 8)}] ${rule.condition_type} ${rule.condition_value} on ${rule.token} (${rule.chain}) [${status}]`);
  }
}

export async function removeAlert(id: string) {
  const store = getStore();
  store.removeRule(id);
  console.log(`Removed alert ${id}`);
}

export async function startDaemon() {
  console.log("Alert daemon starting...");
  const store = getStore();

  const poll = async () => {
    const rules = store.listRules().filter((r) => !r.triggered_at);

    for (const rule of rules) {
      try {
        const output = await execMp([
          "--json",
          "token",
          "search",
          "--query",
          rule.token,
          "--chain",
          rule.chain,
          "--limit",
          "1",
        ]);

        const data = JSON.parse(output);
        const price = data.items?.[0]?.marketData?.price ?? 0;
        const triggered = evaluateCondition(rule, price);

        if (triggered) {
          store.markTriggered(rule.id);
          const message = `Alert: ${rule.condition_type} ${rule.condition_value} hit on ${rule.chain}. Current price: $${price}`;
          console.log(message);
          await dispatch(rule.channels, message, rule.webhook_url);
        }
      } catch (err) {
        // Token fetch failed, skip this cycle
      }
    }
  };

  // Poll every 10 seconds
  setInterval(poll, 10_000);
  await poll();

  // Keep process alive
  await new Promise(() => {});
}

function evaluateCondition(rule: AlertRule, price: number): boolean {
  switch (rule.condition_type) {
    case "price_above":
      return price >= rule.condition_value;
    case "price_below":
      return price <= rule.condition_value;
    case "percent_change":
      // Requires historical price tracking, simplified for now
      return false;
    case "balance_below":
      return price <= rule.condition_value;
    default:
      return false;
  }
}

// MCP tool handlers

export async function addAlertFromMcp(args: {
  token: string;
  chain: string;
  condition_type: AlertRule["condition_type"];
  condition_value: number;
  channels: string[];
  webhook_url?: string;
}) {
  const missing = args.channels.filter((ch) => !isChannelConfigured(ch, args.webhook_url));
  if (missing.length) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: `Channel(s) not configured: ${missing.join(", ")}` }) }],
    };
  }

  const store = getStore();
  const rule: AlertRule = {
    id: randomUUID(),
    token: args.token,
    chain: args.chain,
    condition_type: args.condition_type,
    condition_value: args.condition_value,
    channels: args.channels,
    webhook_url: args.webhook_url,
    created_at: new Date().toISOString(),
    triggered_at: null,
  };

  store.addRule(rule);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ...rule, status: "created" }),
      },
    ],
  };
}

export async function listAlertsFromMcp() {
  const store = getStore();
  const rules = store.listRules();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(rules),
      },
    ],
  };
}

export async function removeAlertFromMcp(id: string) {
  const store = getStore();
  store.removeRule(id);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ id, status: "removed" }),
      },
    ],
  };
}

export async function alertHistoryFromMcp(limit: number) {
  const store = getStore();
  const history = store.getHistory(limit);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(history),
      },
    ],
  };
}
