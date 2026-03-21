import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupProxy } from "./proxy.js";
import { registerOwlTools } from "./tools.js";

export async function startMcpServer() {
  const server = new McpServer({
    name: "owl",
    version: "0.1.0",
  });

  await setupProxy(server);
  registerOwlTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
