import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const AGENT_CONFIG_PATH = join(CONFIG_DIR, "agent.json");

export interface AgentConfig {
  provider: "openrouter" | "openai" | "ollama" | "custom";
  model: string;
  apiKey: string;
  baseUrl?: string;
}

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b:free",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
  },
};

export function loadAgentConfig(): AgentConfig | null {
  try {
    const raw = readFileSync(AGENT_CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAgentConfig(config: AgentConfig) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(AGENT_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getBaseUrl(config: AgentConfig): string {
  if (config.baseUrl) return config.baseUrl;
  return PROVIDER_DEFAULTS[config.provider]?.baseUrl ?? "";
}

export function getDefaultModel(provider: string): string {
  return PROVIDER_DEFAULTS[provider]?.defaultModel ?? "";
}

export function getProviderList(): string[] {
  return Object.keys(PROVIDER_DEFAULTS);
}
