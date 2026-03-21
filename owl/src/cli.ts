import { Command } from "commander";
import { startMcpServer } from "./mcp/server.js";

const program = new Command();

program
  .name("owl")
  .description("Infrastructure extensions for MoonPay OWS")
  .version("0.1.0");

program
  .command("mcp")
  .description("Start MCP server over stdio (proxies mp mcp + owl tools)")
  .action(async () => {
    await startMcpServer();
  });

program
  .command("terminal")
  .description("Start interactive TUI dashboard")
  .option("-w, --wallet <name>", "Wallet name to use", "main")
  .action(async (opts) => {
    const { startTerminal } = await import("./terminal/app.js");
    await startTerminal(opts.wallet);
  });

const tunnel = program
  .command("tunnel")
  .description("Wallet sharing via encrypted tunnels");

tunnel
  .command("create")
  .description("Create a tunnel (host side)")
  .requiredOption("-w, --wallet <name>", "Wallet to share")
  .requiredOption("-n, --name <name>", "Tunnel name")
  .option("-p, --port <port>", "WebSocket port for remote peers", "9800")
  .action(async (opts) => {
    const { createTunnel } = await import("./tunnel/host.js");
    await createTunnel(opts.wallet, opts.name, parseInt(opts.port));
  });

tunnel
  .command("connect")
  .description("Connect to a tunnel (peer side)")
  .argument("<uri>", "Tunnel URI")
  .requiredOption("-w, --wallet <name>", "Local wallet for signing challenges")
  .action(async (uri, opts) => {
    const { connectTunnel } = await import("./tunnel/peer.js");
    await connectTunnel(uri, opts.wallet);
  });

tunnel
  .command("list")
  .description("List active tunnels")
  .action(async () => {
    const { listTunnels } = await import("./tunnel/host.js");
    await listTunnels();
  });

const alert = program
  .command("alert")
  .description("Cross-device price alerts");

alert
  .command("add")
  .description("Add a price alert")
  .requiredOption("-t, --token <address>", "Token address")
  .requiredOption("-c, --chain <chain>", "Chain name")
  .requiredOption("--condition <condition>", "Condition (e.g. price_above:200)")
  .requiredOption("--channel <channel>", "Notification channel (telegram, webhook)")
  .option("--url <url>", "Webhook URL (required for webhook channel)")
  .action(async (opts) => {
    const { addAlert } = await import("./alerts/engine.js");
    await addAlert(opts);
  });

alert
  .command("list")
  .description("List active alerts")
  .action(async () => {
    const { listAlerts } = await import("./alerts/engine.js");
    await listAlerts();
  });

alert
  .command("remove")
  .description("Remove an alert")
  .argument("<id>", "Alert ID")
  .action(async (id) => {
    const { removeAlert } = await import("./alerts/engine.js");
    await removeAlert(id);
  });

alert
  .command("daemon")
  .description("Start alert monitoring daemon")
  .action(async () => {
    const { startDaemon } = await import("./alerts/engine.js");
    await startDaemon();
  });

alert
  .command("channels")
  .description("Configure notification channels")
  .option("--telegram-token <token>", "Telegram bot token")
  .option("--telegram-chat <chatId>", "Telegram chat ID")
  .option("--webhook-url <url>", "Default webhook URL")
  .action(async (opts) => {
    const { configureChannels } = await import("./alerts/channels/index.js");
    await configureChannels(opts);
  });

program.parse();
