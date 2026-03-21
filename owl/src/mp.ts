import { spawn, type ChildProcess } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let client: Client | null = null;
let transport: StdioClientTransport | null = null;

export async function getMpClient(): Promise<Client> {
  if (client) return client;

  transport = new StdioClientTransport({
    command: "mp",
    args: ["mcp"],
  });

  client = new Client({ name: "owl", version: "0.1.0" });
  await client.connect(transport);

  return client;
}

export async function listMpTools() {
  const mp = await getMpClient();
  const result = await mp.listTools();
  return result.tools;
}

export async function callMpTool(name: string, args: Record<string, unknown>) {
  const mp = await getMpClient();
  const result = await mp.callTool({ name, arguments: args });
  return result;
}

export async function closeMpClient() {
  if (transport) {
    await transport.close();
    transport = null;
    client = null;
  }
}

// Shell out to mp for commands that need direct CLI output
export function execMp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("mp", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`mp ${args.join(" ")} failed: ${stderr || stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn mp: ${err.message}`));
    });
  });
}
