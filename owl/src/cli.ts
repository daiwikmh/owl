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

const ledger = program
  .command("ledger")
  .description("Activity ledger for agent operations");

ledger
  .command("list")
  .description("Show recent ledger entries")
  .option("-n, --limit <n>", "Number of entries", "20")
  .option("-t, --tool <tool>", "Filter by tool name")
  .option("-w, --wallet <wallet>", "Filter by wallet")
  .option("-c, --chain <chain>", "Filter by chain")
  .option("-s, --since <date>", "Show entries since date (ISO format)")
  .option("--status <status>", "Filter by status (ok or error)")
  .action(async (opts) => {
    const { queryLedger } = await import("./ledger/store.js");
    const entries = queryLedger({
      limit: parseInt(opts.limit),
      tool: opts.tool,
      wallet: opts.wallet,
      chain: opts.chain,
      since: opts.since,
      status: opts.status,
    });
    if (entries.length === 0) {
      console.log("No ledger entries found");
      return;
    }
    for (const e of entries) {
      console.log(`${e.timestamp}  ${e.status === "error" ? "ERR" : " OK"}  ${e.tool}  ${e.wallet || "-"}  ${e.chain || "-"}`);
    }
  });

ledger
  .command("stats")
  .description("Show ledger statistics")
  .option("-s, --since <date>", "Stats since date")
  .action(async (opts) => {
    const { ledgerStats } = await import("./ledger/store.js");
    const stats = ledgerStats(opts.since);
    console.log(`Total: ${stats.total}  Errors: ${stats.errors}`);
    if (Object.keys(stats.by_tool).length) {
      console.log("By tool:");
      for (const [t, c] of Object.entries(stats.by_tool)) console.log(`  ${t}: ${c}`);
    }
    if (Object.keys(stats.by_chain).length) {
      console.log("By chain:");
      for (const [ch, c] of Object.entries(stats.by_chain)) console.log(`  ${ch}: ${c}`);
    }
  });

ledger
  .command("export")
  .description("Export ledger to JSON or CSV")
  .requiredOption("-f, --format <format>", "Export format (json or csv)")
  .option("-n, --limit <n>", "Max entries", "1000")
  .option("-s, --since <date>", "Export entries since date")
  .action(async (opts) => {
    const { exportLedger } = await import("./ledger/store.js");
    console.log(exportLedger({ format: opts.format, limit: parseInt(opts.limit), since: opts.since }));
  });

ledger
  .command("clear")
  .description("Clear ledger entries")
  .option("--before <date>", "Clear entries before date (clears all if omitted)")
  .action(async (opts) => {
    const { clearLedger } = await import("./ledger/store.js");
    clearLedger(opts.before);
    console.log(opts.before ? `Cleared entries before ${opts.before}` : "Ledger cleared");
  });

const report = program
  .command("report")
  .description("Spending reports and portfolio snapshots");

report
  .command("daily")
  .description("Today's activity report")
  .option("-w, --wallet <wallet>", "Filter by wallet")
  .action(async (opts) => {
    const { generateReport } = await import("./reports/engine.js");
    const r = await generateReport({ period: "daily", wallet: opts.wallet });
    printReport(r);
  });

report
  .command("weekly")
  .description("Last 7 days activity report")
  .option("-w, --wallet <wallet>", "Filter by wallet")
  .action(async (opts) => {
    const { generateReport } = await import("./reports/engine.js");
    const r = await generateReport({ period: "weekly", wallet: opts.wallet });
    printReport(r);
  });

report
  .command("monthly")
  .description("Last 30 days activity report")
  .option("-w, --wallet <wallet>", "Filter by wallet")
  .action(async (opts) => {
    const { generateReport } = await import("./reports/engine.js");
    const r = await generateReport({ period: "monthly", wallet: opts.wallet });
    printReport(r);
  });

report
  .command("portfolio")
  .description("All wallets, all chains, unified view")
  .action(async () => {
    const { portfolioAll } = await import("./reports/engine.js");
    const r = await portfolioAll();
    if (r.error) { console.log(r.error); return; }
    if (!r.wallets.length) { console.log("No wallets with balances found"); return; }
    for (const w of r.wallets) {
      console.log(`\n  ${w.name}`);
      for (const h of w.holdings) {
        console.log(`    [${h.chain}]`);
        for (const line of h.raw.split("\n")) console.log(`      ${line}`);
      }
    }
  });

const dryrun = program
  .command("dryrun")
  .description("Simulate transactions without broadcasting");

dryrun
  .command("swap")
  .description("Dry run a token swap")
  .requiredOption("-w, --wallet <wallet>", "Wallet name")
  .requiredOption("-c, --chain <chain>", "Chain name")
  .requiredOption("--from <token>", "Token to sell")
  .requiredOption("--amount <amount>", "Amount to sell")
  .requiredOption("--to <token>", "Token to buy")
  .action(async (opts) => {
    const { dryRun } = await import("./reports/engine.js");
    const r = await dryRun({ operation: "swap", wallet: opts.wallet, chain: opts.chain, params: { from_token: opts.from, from_amount: opts.amount, to_token: opts.to } });
    printDryRun(r);
  });

dryrun
  .command("transfer")
  .description("Dry run a token transfer")
  .requiredOption("-w, --wallet <wallet>", "Wallet name")
  .requiredOption("-c, --chain <chain>", "Chain name")
  .requiredOption("--token <token>", "Token to send")
  .requiredOption("--amount <amount>", "Amount to send")
  .requiredOption("--to <address>", "Destination address")
  .action(async (opts) => {
    const { dryRun } = await import("./reports/engine.js");
    const r = await dryRun({ operation: "transfer", wallet: opts.wallet, chain: opts.chain, params: { token: opts.token, amount: opts.amount, to: opts.to } });
    printDryRun(r);
  });

dryrun
  .command("bridge")
  .description("Dry run a cross-chain bridge")
  .requiredOption("-w, --wallet <wallet>", "Source wallet")
  .requiredOption("--from-chain <chain>", "Source chain")
  .requiredOption("--from-token <token>", "Source token")
  .requiredOption("--amount <amount>", "Amount")
  .requiredOption("--to-chain <chain>", "Destination chain")
  .requiredOption("--to-token <token>", "Destination token")
  .action(async (opts) => {
    const { dryRun } = await import("./reports/engine.js");
    const r = await dryRun({ operation: "bridge", wallet: opts.wallet, chain: opts.fromChain, params: { from_token: opts.fromToken, from_amount: opts.amount, to_chain: opts.toChain, to_token: opts.toToken } });
    printDryRun(r);
  });

function printReport(r: any) {
  console.log(`\n  ${r.period.toUpperCase()} REPORT  (since ${r.since.slice(0, 10)})`);
  console.log(`  Operations: ${r.summary.total_operations}  Writes: ${r.summary.write_operations}  Reads: ${r.summary.read_operations}  Errors: ${r.summary.errors}`);
  const b = r.breakdown;
  if (b.swaps || b.transfers || b.bridges) console.log(`  Swaps: ${b.swaps}  Transfers: ${b.transfers}  Bridges: ${b.bridges}`);
  if (b.alerts_set) console.log(`  Alerts set: ${b.alerts_set}`);
  if (b.tunnel_operations) console.log(`  Tunnel ops: ${b.tunnel_operations}`);
  if (Object.keys(r.by_chain).length) {
    console.log("  Chains: " + Object.entries(r.by_chain).map(([c, n]) => `${c}(${n})`).join("  "));
  }
  if (r.recent_writes.length) {
    console.log("  Recent writes:");
    for (const w of r.recent_writes) console.log(`    ${w.timestamp.slice(11, 19)}  ${w.status === "error" ? "ERR" : " OK"}  ${w.tool}  ${w.chain || "-"}`);
  }
  console.log();
}

function printDryRun(r: any) {
  console.log(`\n  DRY RUN: ${r.operation}`);
  console.log(`  Wallet: ${r.wallet}  Chain: ${r.chain}  Simulation: ${r.simulation}`);
  console.log(`  Result: ${r.success ? "OK" : "FAILED"}`);
  console.log(`  Output:\n${r.output}\n`);
}

program.parse();
