import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent, MCPServerStdio } from '@openai/agents';
import {
  MCP_SERVER_LABEL,
  RESTAURANT_AGENT_MODEL,
  RESTAURANT_AGENT_NAME,
  RESTAURANT_SYSTEM_INSTRUCTIONS,
} from './config.js';

const MCP_ENTRY = path.resolve(process.cwd(), 'src/mcp/index.ts');

export interface RestaurantAgentBundle {
  agent: Agent;
  mcpServer: MCPServerStdio;
}

export async function createRestaurantAgent(userId?: string): Promise<RestaurantAgentBundle> {
  const userHint = userId
    ? `\n\nID текущего авторизованного клиента (user_id для create_restaurant_order): ${userId}`
    : '';

  const mcpServer = new MCPServerStdio({
    name: MCP_SERVER_LABEL,
    command: 'npx',
    args: ['tsx', MCP_ENTRY], 
    env: {
      ...process.env,
      SUPABASE_URL: process.env.SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
    },
    cacheToolsList: true,
  });

  await mcpServer.connect();

  const agent = new Agent({
    name: RESTAURANT_AGENT_NAME,
    model: RESTAURANT_AGENT_MODEL,
    instructions: RESTAURANT_SYSTEM_INSTRUCTIONS + userHint,
    mcpServers: [mcpServer],
    mcpConfig: {
      convertSchemasToStrict: true,
    },
  });

  return { agent, mcpServer };
}

export async function closeRestaurantAgent(bundle: RestaurantAgentBundle): Promise<void> {
  await bundle.mcpServer.close();
}