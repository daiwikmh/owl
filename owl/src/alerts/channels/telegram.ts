import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface TelegramConfig {
  token: string;
  chatId: string;
}

function getConfig(): TelegramConfig | null {
  try {
    const configPath = join(homedir(), ".config", "owl", "channels.json");
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw);
    if (config.telegram?.token && config.telegram?.chatId) {
      return {
        token: config.telegram.token,
        chatId: config.telegram.chatId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function sendTelegram(message: string): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    console.error("Telegram not configured. Run: owl alert channels --telegram-token <token> --telegram-chat <chatId>");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Telegram send failed:", (err as Error).message);
    return false;
  }
}
