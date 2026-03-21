import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "node:events";

export class WsHost extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  constructor(private port: number) {
    super();
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({ port: this.port }, () => resolve());

      this.wss.on("connection", (ws) => {
        const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.clients.set(clientId, ws);

        ws.on("message", (data) => {
          const msg = data.toString().trim();
          if (msg) {
            this.emit("message", clientId, msg);
          }
        });

        ws.on("close", () => {
          this.clients.delete(clientId);
          this.emit("disconnect", clientId);
        });

        ws.on("error", () => {
          this.clients.delete(clientId);
        });

        this.emit("connect", clientId);
      });
    });
  }

  send(clientId: string, message: string) {
    const ws = this.clients.get(clientId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }

  broadcast(message: string) {
    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  stop() {
    for (const ws of this.clients.values()) {
      ws.close();
    }
    this.clients.clear();
    this.wss?.close();
  }
}

export class WsPeer extends EventEmitter {
  private ws: WebSocket | null = null;

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on("open", () => resolve());
      this.ws.on("error", reject);

      this.ws.on("message", (data) => {
        const msg = data.toString().trim();
        if (msg) {
          this.emit("message", msg);
        }
      });

      this.ws.on("close", () => this.emit("disconnect"));
    });
  }

  send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  disconnect() {
    this.ws?.close();
  }
}
