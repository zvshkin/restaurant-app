#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRestaurantMcpServer } from './createServer.js';

async function main(): Promise<void> {
  const server = createRestaurantMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Restaurant MCP Server запущен (stdio)');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
