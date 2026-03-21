import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const STATE_PATH = join(CONFIG_DIR, "terminal-state.json");

export interface TerminalState {
  wallet: string;
  watches: Array<{ token: string; chain: string }>;
  activity: Array<{ type: string; message: string; timestamp: string }>;
  portfolio: Record<string, { symbol: string; balance: number; value_usd: number }>;
}

export function loadState(): TerminalState {
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  } catch {
    return {
      wallet: "main",
      watches: [],
      activity: [],
      portfolio: {},
    };
  }
}

export function saveState(state: TerminalState) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function addActivity(type: string, message: string) {
  const state = loadState();
  state.activity.unshift({
    type,
    message,
    timestamp: new Date().toISOString(),
  });
  // Keep last 100 entries
  state.activity = state.activity.slice(0, 100);
  saveState(state);
}

// MCP handler
export async function getTerminalStatus() {
  const state = loadState();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(state),
      },
    ],
  };
}
