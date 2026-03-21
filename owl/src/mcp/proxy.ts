import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listMpTools, callMpTool } from "../mp.js";
import { z } from "zod";

// Convert JSON Schema properties to a zod-compatible shape for McpServer.tool()
function jsonSchemaToZodShape(
  properties: Record<string, any>,
  required: string[] = []
): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let zodType: z.ZodTypeAny;

    switch (prop.type) {
      case "string":
        zodType = z.string();
        break;
      case "number":
      case "integer":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "array":
        zodType = z.array(z.any());
        break;
      default:
        zodType = z.any();
    }

    if (prop.description) {
      zodType = zodType.describe(prop.description);
    }

    if (!required.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return shape;
}

export async function setupProxy(server: McpServer) {
  let tools;
  try {
    tools = await listMpTools();
  } catch (err) {
    // mp not installed or mcp not available, skip proxy
    console.error("Could not connect to mp mcp, skipping proxy:", (err as Error).message);
    return;
  }

  for (const tool of tools) {
    const toolName = tool.name;
    const description = tool.description || `Proxied mp tool: ${toolName}`;
    const schema = tool.inputSchema;

    if (schema?.properties && Object.keys(schema.properties).length > 0) {
      const zodShape = jsonSchemaToZodShape(
        schema.properties as Record<string, any>,
        (schema.required as string[]) || []
      );

      server.tool(toolName, description, zodShape, async (args) => {
        const result = await callMpTool(toolName, args as Record<string, unknown>);
        return result as any;
      });
    } else {
      server.tool(toolName, description, async () => {
        const result = await callMpTool(toolName, {});
        return result as any;
      });
    }
  }
}
