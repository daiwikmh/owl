import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { execMp } from "../mp.js";
import { loadState, saveState, addActivity, type TerminalState } from "./state.js";
import { executeCommand } from "./commands.js";
import { tunnelEvents } from "../tunnel/host.js";
import {
  loadAgentConfig,
  saveAgentConfig,
  getProviderList,
  getDefaultModel,
  type AgentConfig,
} from "./agent-config.js";

const OWL_ASCII = `
    ,___,
    (o,o)
    /)  )
  --"-"--
   O W L
`;

interface PortfolioEntry {
  symbol: string;
  balance: string;
  value: string;
}

// Agent setup wizard
type SetupStep = "provider" | "model" | "apikey" | "confirm";

function AgentSetup({
  onComplete,
  onSkip,
}: {
  onComplete: (config: AgentConfig) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("provider");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [input, setInput] = useState("");
  const providers = getProviderList();

  useInput((_ch, key) => {
    if (key.escape) {
      onSkip();
    }
  });

  const handleSubmit = (value: string) => {
    const v = value.trim();
    setInput("");

    if (step === "provider") {
      const idx = parseInt(v);
      if (idx >= 1 && idx <= providers.length) {
        const selected = providers[idx - 1];
        setProvider(selected);
        setModel(getDefaultModel(selected));
        setStep("model");
      } else if (providers.includes(v.toLowerCase())) {
        setProvider(v.toLowerCase());
        setModel(getDefaultModel(v.toLowerCase()));
        setStep("model");
      }
      return;
    }

    if (step === "model") {
      if (v) setModel(v);
      setStep("apikey");
      return;
    }

    if (step === "apikey") {
      if (v) setApiKey(v);
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      if (v.toLowerCase() === "y" || v.toLowerCase() === "yes" || v === "") {
        const config: AgentConfig = {
          provider: provider as AgentConfig["provider"],
          model,
          apiKey,
        };
        saveAgentConfig(config);
        onComplete(config);
      } else {
        setStep("provider");
        setProvider("");
        setModel("");
        setApiKey("");
      }
    }
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color="cyan">{OWL_ASCII}</Text>
      <Text bold color="cyan">
        Agent Setup
      </Text>
      <Text dimColor>Connect an AI agent to your terminal (ESC to skip)</Text>
      <Text> </Text>

      {step === "provider" && (
        <Box flexDirection="column">
          <Text bold>Select a provider:</Text>
          {providers.map((p, i) => (
            <Text key={p}>
              {"  "}
              <Text color="yellow">{i + 1}</Text>. {p}
            </Text>
          ))}
          <Text> </Text>
          <Box>
            <Text color="green">{">"} </Text>
            <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
          </Box>
        </Box>
      )}

      {step === "model" && (
        <Box flexDirection="column">
          <Text>
            Provider: <Text color="green">{provider}</Text>
          </Text>
          <Text>
            Model (enter for default: <Text color="yellow">{model}</Text>):
          </Text>
          <Text> </Text>
          <Box>
            <Text color="green">{">"} </Text>
            <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
          </Box>
        </Box>
      )}

      {step === "apikey" && (
        <Box flexDirection="column">
          <Text>
            Provider: <Text color="green">{provider}</Text>
          </Text>
          <Text>
            Model: <Text color="green">{model}</Text>
          </Text>
          <Text>Enter API key:</Text>
          <Text> </Text>
          <Box>
            <Text color="green">{">"} </Text>
            <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
          </Box>
        </Box>
      )}

      {step === "confirm" && (
        <Box flexDirection="column">
          <Text bold>Confirm agent config:</Text>
          <Text>
            {"  "}Provider: <Text color="green">{provider}</Text>
          </Text>
          <Text>
            {"  "}Model: <Text color="green">{model}</Text>
          </Text>
          <Text>
            {"  "}API Key: <Text color="green">{apiKey ? apiKey.slice(0, 8) + "..." : "(none)"}</Text>
          </Text>
          <Text> </Text>
          <Text>Save? (Y/n)</Text>
          <Box>
            <Text color="green">{">"} </Text>
            <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

function Header({
  wallet,
  totalValue,
  agentConfig,
}: {
  wallet: string;
  totalValue: string;
  agentConfig: AgentConfig | null;
}) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          OWL Terminal
        </Text>
        <Text>
          wallet: <Text color="green">{wallet}</Text>
        </Text>
        {agentConfig && (
          <Text>
            agent: <Text color="magenta">{agentConfig.provider}/{agentConfig.model}</Text>
          </Text>
        )}
        <Text>
          total: <Text color="yellow" bold>${totalValue}</Text>
        </Text>
      </Box>
    </Box>
  );
}

function Portfolio({ entries }: { entries: PortfolioEntry[] }) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" paddingX={1} minHeight={5}>
      <Text bold color="blue">
        Portfolio
      </Text>
      {entries.length === 0 ? (
        <Text dimColor>Loading balances...</Text>
      ) : (
        entries.map((e, i) => (
          <Box key={i} justifyContent="space-between" width="100%">
            <Text>{e.symbol}</Text>
            <Text>{e.balance}</Text>
            <Text color="green">${e.value}</Text>
          </Box>
        ))
      )}
    </Box>
  );
}

function ActivityFeed({
  items,
}: {
  items: Array<{ type: string; message: string; timestamp: string }>;
}) {
  const typeColors: Record<string, string> = {
    ALERT: "yellow",
    TUNNEL: "magenta",
    POLICY: "cyan",
    TX: "green",
    ERROR: "red",
    INFO: "white",
    AGENT: "blue",
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" paddingX={1} minHeight={6}>
      <Text bold color="yellow">
        Activity
      </Text>
      {items.length === 0 ? (
        <Text dimColor>No activity yet</Text>
      ) : (
        items.slice(0, 8).map((item, i) => (
          <Text key={i}>
            <Text dimColor>{item.timestamp.split("T")[1]?.slice(0, 8) ?? ""}</Text>{" "}
            <Text color={typeColors[item.type] ?? "white"}>[{item.type}]</Text> {item.message}
          </Text>
        ))
      )}
    </Box>
  );
}

function Splash() {
  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Text color="cyan">{OWL_ASCII}</Text>
      <Text dimColor>Infrastructure extensions for MoonPay OWS</Text>
      <Text dimColor>Type "help" for commands</Text>
    </Box>
  );
}

function App({ wallet }: { wallet: string }) {
  const { exit } = useApp();
  const [input, setInput] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [totalValue, setTotalValue] = useState("0.00");
  const [activity, setActivity] = useState<TerminalState["activity"]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [showAgentSetup, setShowAgentSetup] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);

  // Check for existing agent config on mount
  useEffect(() => {
    const existing = loadAgentConfig();
    if (existing) {
      setAgentConfig(existing);
    }

    const state = loadState();
    setActivity(state.activity);

    const timer = setTimeout(() => {
      setShowSplash(false);
      // If no agent config, prompt setup
      if (!existing) {
        setShowAgentSetup(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Poll balances
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const output = await execMp([
          "token", "balance", "list",
          "--wallet", wallet,
          "--chain", "solana",
          "-f", "compact",
        ]);

        const data = JSON.parse(output);
        if (Array.isArray(data)) {
          let total = 0;
          const entries: PortfolioEntry[] = data.map((t: any) => {
            const val = parseFloat(t.valueUsd ?? t.value_usd ?? "0");
            total += val;
            return {
              symbol: t.symbol ?? t.token ?? "???",
              balance: String(t.balance ?? t.amount ?? "0"),
              value: val.toFixed(2),
            };
          });
          setPortfolio(entries);
          setTotalValue(total.toFixed(2));
        }
      } catch {
        // mp not available
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30_000);
    return () => clearInterval(interval);
  }, [wallet]);

  // Listen for tunnel events
  useEffect(() => {
    const onPeer = (address: string) => {
      const entry = {
        type: "TUNNEL",
        message: `Peer connected: ${address}`,
        timestamp: new Date().toISOString(),
      };
      addActivity("TUNNEL", entry.message);
      setActivity((prev) => [entry, ...prev].slice(0, 100));
    };

    const onProposal = (proposal: any) => {
      const entry = {
        type: "TUNNEL",
        message: `Proposal: ${proposal.operation} from ${proposal.peer.slice(0, 8)}...`,
        timestamp: new Date().toISOString(),
      };
      addActivity("TUNNEL", entry.message);
      setActivity((prev) => [entry, ...prev].slice(0, 100));
    };

    tunnelEvents.on("peer_connected", onPeer);
    tunnelEvents.on("proposal_pending", onProposal);

    return () => {
      tunnelEvents.off("peer_connected", onPeer);
      tunnelEvents.off("proposal_pending", onProposal);
    };
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setInput("");

      if (!trimmed) return;

      if (trimmed === "exit" || trimmed === "quit") {
        exit();
        return;
      }

      if (trimmed === "clear") {
        setCommandOutput(null);
        return;
      }

      // Agent setup/reconfigure commands
      if (trimmed === "agent setup" || trimmed === "agent config") {
        setShowAgentSetup(true);
        return;
      }

      if (trimmed === "agent status") {
        if (agentConfig) {
          setCommandOutput(
            `Agent: ${agentConfig.provider}/${agentConfig.model}\nAPI Key: ${agentConfig.apiKey.slice(0, 8)}...`
          );
        } else {
          setCommandOutput('No agent configured. Type "agent setup" to configure.');
        }
        return;
      }

      if (trimmed === "agent disconnect") {
        setAgentConfig(null);
        setCommandOutput("Agent disconnected");
        return;
      }

      const entry = { type: "INFO", message: `> ${trimmed}`, timestamp: new Date().toISOString() };
      setActivity((prev) => [entry, ...prev].slice(0, 100));

      try {
        const result = await executeCommand(trimmed, wallet);
        if (result) {
          setCommandOutput(result);
        }
      } catch (err) {
        const errEntry = {
          type: "ERROR",
          message: (err as Error).message,
          timestamp: new Date().toISOString(),
        };
        setActivity((prev) => [errEntry, ...prev].slice(0, 100));
      }
    },
    [wallet, exit, agentConfig]
  );

  useInput((ch, key) => {
    if (key.ctrl && ch === "c") {
      exit();
    }
  });

  if (showSplash) {
    return <Splash />;
  }

  if (showAgentSetup) {
    return (
      <AgentSetup
        onComplete={(config) => {
          setAgentConfig(config);
          setShowAgentSetup(false);
          const entry = {
            type: "AGENT",
            message: `Connected: ${config.provider}/${config.model}`,
            timestamp: new Date().toISOString(),
          };
          addActivity("AGENT", entry.message);
          setActivity((prev) => [entry, ...prev].slice(0, 100));
        }}
        onSkip={() => setShowAgentSetup(false)}
      />
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      <Header wallet={wallet} totalValue={totalValue} agentConfig={agentConfig} />
      <Portfolio entries={portfolio} />
      <ActivityFeed items={activity} />

      {commandOutput && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
          <Text>{commandOutput}</Text>
        </Box>
      )}

      <Box borderStyle="single" borderColor="green" paddingX={1}>
        <Text color="green" bold>
          {">"}{" "}
        </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}

export async function startTerminal(wallet: string) {
  const state = loadState();
  state.wallet = wallet;
  saveState(state);

  render(<App wallet={wallet} />);
}
