#!/usr/bin/env node
/**
 * Вариант агента с удалённым MCP (Streamable HTTP).
 * Запустите `npm run mcp:http` и укажите MCP_HTTP_URL в .env.
 */
import 'dotenv/config';
import { Agent, MCPServerStreamableHttp } from '@openai/agents';
import {
  MCP_SERVER_LABEL,
  RESTAURANT_AGENT_MODEL,
  RESTAURANT_AGENT_NAME,
  RESTAURANT_SYSTEM_INSTRUCTIONS,
} from './config.js';

export async function createHostedRestaurantAgent(): Promise<{
  agent: Agent;
  mcpServer: MCPServerStreamableHttp;
}> {
  const url = process.env.MCP_HTTP_URL ?? `http://localhost:${process.env.MCP_HTTP_PORT ?? 3001}/mcp`;

  const mcpServer = new MCPServerStreamableHttp({
    url,
    name: MCP_SERVER_LABEL,
    cacheToolsList: true,
  });

  await mcpServer.connect();

  const agent = new Agent({
    name: RESTAURANT_AGENT_NAME,
    model: RESTAURANT_AGENT_MODEL,
    instructions: RESTAURANT_SYSTEM_INSTRUCTIONS,
    mcpServers: [mcpServer],
    mcpConfig: { convertSchemasToStrict: true },
  });

  return { agent, mcpServer };
}
