import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { sendTelegram } from "./telegram.js";
import { sendWebhook } from "./webhook.js";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const CHANNELS_PATH = join(CONFIG_DIR, "channels.json");

interface ChannelConfig {
  telegram?: {
    token: string;
    chatId: string;
  };
  webhook?: {
    url: string;
  };
}

function loadConfig(): ChannelConfig {
  try {
    return JSON.parse(readFileSync(CHANNELS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config: ChannelConfig) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CHANNELS_PATH, JSON.stringify(config, null, 2));
}

export async function dispatch(
  channels: string[],
  message: string,
  webhookUrl?: string
) {
  const config = loadConfig();

  for (const channel of channels) {
    switch (channel) {
      case "telegram":
        await sendTelegram(message);
        break;
      case "webhook": {
        const url = webhookUrl ?? config.webhook?.url;
        if (url) {
          await sendWebhook(url, message);
        } else {
          console.error("No webhook URL configured");
        }
        break;
      }
    }
  }
}

// CLI command
interface ChannelOpts {
  telegramToken?: string;
  telegramChat?: string;
  webhookUrl?: string;
}

export async function configureChannels(opts: ChannelOpts) {
  const config = loadConfig();

  if (opts.telegramToken || opts.telegramChat) {
    config.telegram = {
      token: opts.telegramToken ?? config.telegram?.token ?? "",
      chatId: opts.telegramChat ?? config.telegram?.chatId ?? "",
    };
  }

  if (opts.webhookUrl) {
    config.webhook = { url: opts.webhookUrl };
  }

  saveConfig(config);
  console.log("Channels configured:", JSON.stringify(config, null, 2));
}

// MCP handler
export async function configureChannelsFromMcp(args: {
  telegram_token?: string;
  telegram_chat_id?: string;
  webhook_url?: string;
}) {
  const config = loadConfig();

  if (args.telegram_token || args.telegram_chat_id) {
    config.telegram = {
      token: args.telegram_token ?? config.telegram?.token ?? "",
      chatId: args.telegram_chat_id ?? config.telegram?.chatId ?? "",
    };
  }

  if (args.webhook_url) {
    config.webhook = { url: args.webhook_url };
  }

  saveConfig(config);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ status: "configured", config }),
      },
    ],
  };
}
