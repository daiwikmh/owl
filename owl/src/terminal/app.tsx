import * as readline from "node:readline";
import { loadState, saveState } from "./state.js";
import { loadAgentConfig, saveAgentConfig, getProviderList, getDefaultModel, type AgentConfig } from "./agent-config.js";
import { runAgent, type ChatMessage } from "./agent.js";
import { execMp } from "../mp.js";

const R  = "\x1b[0m";
const B  = "\x1b[1m";
const D  = "\x1b[2m";
const CY = "\x1b[36m";
const GR = "\x1b[32m";
const YE = "\x1b[33m";
const BL = "\x1b[34m";
const RE = "\x1b[31m";
const MA = "\x1b[35m";

const OWL_ASCII = `
${CY}${B}  /$$$$$$  /$$      /$$ /$$           ${R}   ${YE}   ,___.   ${R}
${CY}${B} /$$__  $$| $$  /$ | $$| $$           ${R}   ${YE}  (o . o)  ${R}
${CY}${B}| $$  \\ $$| $$ /$$$| $$| $$           ${R}   ${YE}  /)   )   ${R}
${CY}${B}| $$  | $$| $$/$$ $$ $$| $$           ${R}   ${YE} --"-"--   ${R}
${CY}${B}| $$  | $$| $$$$_  $$$$| $$           ${R}
${CY}${B}| $$  | $$| $$$/ \\  $$$| $$           ${R}
${CY}${B}|  $$$$$$/| $$/   \\  $$| $$$$$$$$     ${R}
${CY}${B} \\______/ |__/     \\__/|________/     ${R}
${D}           powered by moonpay${R}
`;

function ln(text = "") { process.stdout.write(text + "\n"); }

function wrapText(text: string, width = 72, indent = "  "): string {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      if (line && (line.length + 1 + word.length) > width) {
        lines.push(indent + line);
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) lines.push(indent + line);
  }
  return lines.join("\n");
}

function printBanner(wallet: string, agentConfig: AgentConfig | null) {
  ln(OWL_ASCII);
  ln(`  ${D}wallet: ${GR}${wallet}${R}${D}  ·  ${agentConfig ? `${agentConfig.provider}/${agentConfig.model}` : "no agent"}${R}`);
  ln(`  ${D}type "exit" to quit  ·  "agent setup" to configure agent${R}`);
  ln(`  ${D}${"─".repeat(56)}${R}`);
  ln();
}

async function showPortfolio(wallet: string) {
  try {
    const out = await execMp(["token", "balance", "list", "--wallet", wallet, "--chain", "solana"]);
    const data = JSON.parse(out);
    if (Array.isArray(data) && data.length > 0) {
      ln(`${D}  portfolio:${R}`);
      for (const t of data) {
        ln(`${D}    ${t.symbol ?? "???"}: ${t.balance ?? 0}  $${parseFloat(t.valueUsd ?? t.value_usd ?? "0").toFixed(2)}${R}`);
      }
    } else {
      ln(`${D}  no balances found${R}`);
    }
  } catch {
    ln(`${D}  portfolio unavailable${R}`);
  }
  ln();
}

async function agentSetup(rl: readline.Interface): Promise<AgentConfig | null> {
  const providers = getProviderList();

  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  ln();
  ln(`${CY}${B}  Agent Setup${R}`);
  ln(`${D}  ${"─".repeat(40)}${R}`);
  ln(`  Providers:`);
  providers.forEach((p, i) => ln(`    ${YE}${i + 1}${R}. ${p}`));
  ln();

  const provInput = (await ask(`${B}${BL}provider${R} › `)).trim();
  const idx = parseInt(provInput);
  let provider: string;
  if (idx >= 1 && idx <= providers.length) {
    provider = providers[idx - 1];
  } else if (providers.includes(provInput.toLowerCase())) {
    provider = provInput.toLowerCase();
  } else {
    ln(`${RE}  Invalid provider${R}`);
    return null;
  }

  const defaultModel = getDefaultModel(provider);
  const modelInput = (await ask(`${B}${BL}model${R} › [${defaultModel}] `)).trim();
  const model = modelInput || defaultModel;

  const apiKey = await new Promise<string>((resolve) => {
    let buf = "";
    rl.pause();
    process.stdin.setRawMode?.(true);
    process.stdout.write(`${B}${BL}api key${R} › `);
    const onData = (ch: Buffer) => {
      const c = ch.toString();
      if (c === "\n" || c === "\r") {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode?.(false);
        process.stdout.write("\n");
        rl.resume();
        resolve(buf.trim());
        return;
      }
      if (c === "\x7f" || c === "\b") {
        if (buf.length) { buf = buf.slice(0, -1); process.stdout.write("\b \b"); }
        return;
      }
      if (c === "\x03") { process.exit(0); }
      buf += c;
      process.stdout.write("*");
    };
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
  if (!apiKey) { ln(`${RE}  API key required${R}`); return null; }

  ln();
  ln(`  ${D}provider: ${GR}${provider}${R}`);
  ln(`  ${D}model:    ${GR}${model}${R}`);
  ln(`  ${D}api key:  ${GR}${"*".repeat(apiKey.length)}${R}`);
  ln();

  const confirm = (await ask(`${B}${BL}save?${R} › [Y/n] `)).trim().toLowerCase();
  if (confirm === "n" || confirm === "no") return null;

  const config: AgentConfig = { provider: provider as AgentConfig["provider"], model, apiKey };
  saveAgentConfig(config);
  return config;
}

export async function startTerminal(wallet: string) {
  const state = loadState();
  state.wallet = wallet;
  saveState(state);

  let agentConfig = loadAgentConfig();

  let rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const prompt = () =>
    new Promise<string>((resolve, reject) => {
      rl.question(`${B}${BL}you${R} › `, resolve);
      rl.once("close", () => reject(new Error("closed")));
    });

  printBanner(wallet, agentConfig);
  await showPortfolio(wallet);

  if (!agentConfig) {
    ln(`${YE}  No agent configured. Starting setup...${R}`);
    ln();
    const config = await agentSetup(rl);
    if (config) {
      agentConfig = config;
      ln(`${GR}  Agent configured: ${config.provider}/${config.model}${R}`);
      ln();
    } else {
      ln(`${YE}  Skipped. You can run "agent setup" later.${R}`);
      ln();
    }
    // Recreate readline after raw mode password input
    rl.close();
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  const history: ChatMessage[] = [];

  while (true) {
    let input: string;
    try {
      input = (await prompt()).trim();
    } catch {
      break;
    }

    if (!input) continue;

    if (input === "exit" || input === "quit") {
      ln(`${D}Goodbye.${R}`);
      rl.close();
      process.exit(0);
    }

    if (input === "clear") {
      process.stdout.write("\x1b[2J\x1b[H");
      printBanner(wallet, agentConfig);
      continue;
    }

    if (input === "agent setup" || input === "agent config") {
      const config = await agentSetup(rl);
      if (config) {
        agentConfig = config;
        history.length = 0;
        ln(`${GR}  Agent configured: ${config.provider}/${config.model}${R}`);
        ln();
      }
      rl.close();
      rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      continue;
    }

    if (input === "agent status") {
      if (agentConfig) {
        ln(`${D}  ${agentConfig.provider}/${agentConfig.model}${R}`);
      } else {
        ln(`${D}  no agent configured${R}`);
      }
      ln();
      continue;
    }

    if (input === "agent disconnect") {
      agentConfig = null;
      history.length = 0;
      ln(`${D}  agent disconnected${R}`);
      ln();
      continue;
    }

    if (input === "portfolio") {
      await showPortfolio(wallet);
      continue;
    }

    if (input === "help") {
      ln(`${D}  Just chat naturally. Examples:${R}`);
      ln(`${D}    "show my portfolio"${R}`);
      ln(`${D}    "swap 10 USDC to SOL"${R}`);
      ln(`${D}    "set an alert for SOL above $200"${R}`);
      ln(`${D}    "what are trending tokens on base?"${R}`);
      ln();
      ln(`${D}  Meta-commands:${R}`);
      ln(`${D}    agent setup      configure AI agent${R}`);
      ln(`${D}    agent status     show agent config${R}`);
      ln(`${D}    agent disconnect disconnect agent${R}`);
      ln(`${D}    portfolio        refresh portfolio${R}`);
      ln(`${D}    clear            clear screen${R}`);
      ln(`${D}    exit / quit      exit${R}`);
      ln();
      continue;
    }

    if (!agentConfig) {
      ln(`${RE}  No agent configured. Type "agent setup" to connect one.${R}`);
      ln();
      continue;
    }

    try {
      await runAgent(
        agentConfig,
        input,
        history,
        () => process.stdout.write(`${D}  thinking...${R}\n`),
        (name, args) => process.stdout.write(`${D}  ↳  ${MA}${name}${R}${D} ${JSON.stringify(args)}${R}\n`),
        (_name, result) => process.stdout.write(`${D}     ${result.slice(0, 300)}${result.length > 300 ? "…" : ""}${R}\n`),
        (text) => { ln(); ln(`${B}${GR}owl${R} ›`); ln(wrapText(text)); ln(); },
        () => {},
        (err) => { ln(`${RE}  Error: ${err}${R}`); ln(); },
      );
    } catch (err) {
      ln(`${RE}  Error: ${(err as Error).message}${R}`);
      ln();
    }
  }

  rl.close();
}
