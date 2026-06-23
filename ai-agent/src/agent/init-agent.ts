#!/usr/bin/env node
/**
 * Скрипт инициализации OpenAI-агента ресторана.
 * Подключает локальный MCP-сервер (stdio), проверяет tools/resources и сохраняет конфигурацию.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRestaurantAgent, closeRestaurantAgent } from './createRestaurantAgent.js';
import {
  MCP_SERVER_LABEL,
  MENU_RESOURCE_URI,
  RESTAURANT_AGENT_MODEL,
  RESTAURANT_AGENT_NAME,
  RESTAURANT_SYSTEM_INSTRUCTIONS,
} from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../agent.config.json');

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY не задан. Добавьте ключ в ai-agent/.env');
  }

  console.log('🔧 Инициализация агента ресторана...\n');

  const bundle = await createRestaurantAgent();

  try {
    const tools = await bundle.mcpServer.listTools();
    const resourcesResult = await bundle.mcpServer.listResources();
    const resources = Array.isArray(resourcesResult)
      ? resourcesResult
      : ((resourcesResult as { resources?: Array<Record<string, unknown>> }).resources ?? []);
    const menuResource = await bundle.mcpServer.readResource(MENU_RESOURCE_URI);

    const config = {
      agent: {
        name: RESTAURANT_AGENT_NAME,
        model: RESTAURANT_AGENT_MODEL,
        instructions: RESTAURANT_SYSTEM_INSTRUCTIONS,
      },
      mcp: {
        transport: 'stdio',
        serverLabel: MCP_SERVER_LABEL,
        menuResourceUri: MENU_RESOURCE_URI,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
        })),
        resources: resources.map((resource: Record<string, unknown>) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      },
      verifiedAt: new Date().toISOString(),
    };

    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

    console.log('✅ Агент создан и MCP-сервер подключён\n');
    console.log(`   Имя:     ${RESTAURANT_AGENT_NAME}`);
    console.log(`   Модель:  ${RESTAURANT_AGENT_MODEL}`);
    console.log(`   Tools:   ${tools.map((t) => t.name).join(', ')}`);
    console.log(
      `   Resources: ${resources.map((r: Record<string, unknown>) => String(r.uri ?? '')).join(', ')}`,
    );
    console.log(`\n📄 Конфигурация сохранена: ${CONFIG_PATH}`);

    const preview = menuResource.contents[0];
    if (preview && 'text' in preview && typeof preview.text === 'string') {
      const menu = JSON.parse(preview.text) as { dishes_count: number };
      console.log(`\n🍽️  В меню ${menu.dishes_count} активных блюд`);
    }
  } finally {
    await closeRestaurantAgent(bundle);
  }
}

main().catch((error) => {
  console.error('❌ Ошибка инициализации:', error);
  process.exit(1);
});
