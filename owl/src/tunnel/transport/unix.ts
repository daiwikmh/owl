import { createServer, connect, type Server, type Socket } from "node:net";
import { join } from "node:path";
import { homedir } from "node:os";
import { mkdirSync } from "node:fs";
import { EventEmitter } from "node:events";

const SOCKET_DIR = join(homedir(), ".config", "owl", "sockets");

export class UnixHost extends EventEmitter {
  private server: Server | null = null;
  private clients: Map<string, Socket> = new Map();

  constructor(private tunnelName: string) {
    super();
  }

  getSocketPath(): string {
    return join(SOCKET_DIR, `${this.tunnelName}.sock`);
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      mkdirSync(SOCKET_DIR, { recursive: true });

      const socketPath = this.getSocketPath();

      // Clean up stale socket
      try {
        const { unlinkSync } = require("node:fs");
        unlinkSync(socketPath);
      } catch {}

      this.server = createServer((socket) => {
        const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.clients.set(clientId, socket);

        let buffer = "";
        socket.on("data", (data) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.trim()) {
              this.emit("message", clientId, line.trim());
            }
          }
        });

        socket.on("close", () => {
          this.clients.delete(clientId);
          this.emit("disconnect", clientId);
        });

        socket.on("error", () => {
          this.clients.delete(clientId);
        });

        this.emit("connect", clientId);
      });

      this.server.listen(socketPath, () => resolve());
      this.server.on("error", reject);
    });
  }

  send(clientId: string, message: string) {
    const socket = this.clients.get(clientId);
    if (socket) {
      socket.write(message + "\n");
    }
  }

  broadcast(message: string) {
    for (const socket of this.clients.values()) {
      socket.write(message + "\n");
    }
  }

  stop() {
    for (const socket of this.clients.values()) {
      socket.destroy();
    }
    this.clients.clear();
    this.server?.close();
  }
}

export class UnixPeer extends EventEmitter {
  private socket: Socket | null = null;

  constructor(private tunnelName: string) {
    super();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socketPath = join(SOCKET_DIR, `${this.tunnelName}.sock`);
      this.socket = connect(socketPath, () => resolve());

      let buffer = "";
      this.socket.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) {
            this.emit("message", line.trim());
          }
        }
      });

      this.socket.on("close", () => this.emit("disconnect"));
      this.socket.on("error", reject);
    });
  }

  send(message: string) {
    this.socket?.write(message + "\n");
  }

  disconnect() {
    this.socket?.destroy();
  }
}
