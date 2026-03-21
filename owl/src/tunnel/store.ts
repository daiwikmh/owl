import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "owl");
const TUNNELS_PATH = join(CONFIG_DIR, "tunnels.json");

export interface TunnelRecord {
  id: string;
  name: string;
  wallet: string;
  port: number;
  created_at: string;
  peers: string[];
}

export interface Proposal {
  id: string;
  tunnel_id: string;
  peer: string;
  operation: string;
  params: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "executed";
  created_at: string;
  resolved_at?: string;
  reason?: string;
}

interface TunnelState {
  tunnels: TunnelRecord[];
  proposals: Proposal[];
}

function load(): TunnelState {
  try {
    return JSON.parse(readFileSync(TUNNELS_PATH, "utf-8"));
  } catch {
    return { tunnels: [], proposals: [] };
  }
}

function save(state: TunnelState) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(TUNNELS_PATH, JSON.stringify(state, null, 2));
}

export const tunnelStore = {
  addTunnel(tunnel: TunnelRecord) {
    const state = load();
    state.tunnels.push(tunnel);
    save(state);
  },

  getTunnel(nameOrId: string): TunnelRecord | undefined {
    const state = load();
    return state.tunnels.find((t) => t.name === nameOrId || t.id === nameOrId);
  },

  listTunnels(): TunnelRecord[] {
    return load().tunnels;
  },

  removeTunnel(nameOrId: string) {
    const state = load();
    state.tunnels = state.tunnels.filter((t) => t.name !== nameOrId && t.id !== nameOrId);
    save(state);
  },

  addPeer(tunnelId: string, peer: string) {
    const state = load();
    const tunnel = state.tunnels.find((t) => t.id === tunnelId);
    if (tunnel && !tunnel.peers.includes(peer)) {
      tunnel.peers.push(peer);
      save(state);
    }
  },

  addProposal(proposal: Proposal) {
    const state = load();
    state.proposals.push(proposal);
    save(state);
  },

  getProposal(id: string): Proposal | undefined {
    return load().proposals.find((p) => p.id === id);
  },

  listProposals(tunnelId?: string): Proposal[] {
    const state = load();
    if (tunnelId) {
      return state.proposals.filter((p) => p.tunnel_id === tunnelId);
    }
    return state.proposals;
  },

  updateProposal(id: string, update: Partial<Proposal>) {
    const state = load();
    const proposal = state.proposals.find((p) => p.id === id);
    if (proposal) {
      Object.assign(proposal, update);
      save(state);
    }
  },
};
