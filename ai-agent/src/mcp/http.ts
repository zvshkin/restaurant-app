#!/usr/bin/env node
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createRestaurantMcpServer } from './createServer.js';

const PORT = Number(process.env.MCP_HTTP_PORT ?? 3001);

async function main(): Promise<void> {
  const mcpServer = createRestaurantMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  const httpServer = createHttpServer(async (req, res) => {
    if (req.url !== '/mcp') {
      res.writeHead(404).end('Not Found');
      return;
    }
    await transport.handleRequest(req, res);
  });

  httpServer.listen(PORT, () => {
    console.error(`Restaurant MCP Server (Streamable HTTP) → http://localhost:${PORT}/mcp`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
