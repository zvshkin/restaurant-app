#!/usr/bin/env node
/**
 * Интерактивный чат с агентом ресторана (демо / отладка).
 * Использование: npm run agent:chat -- "Расскажи о лёгких блюдах"
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { run } from '@openai/agents';
import { createRestaurantAgent, closeRestaurantAgent } from './createRestaurantAgent.js';

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY не задан');
  }

  const userMessage = process.argv.slice(2).join(' ').trim();
  const bundle = await createRestaurantAgent();

  try {
    if (userMessage) {
      const result = await run(bundle.agent, userMessage);
      console.log('\n🤖 Ассистент:\n');
      console.log(result.finalOutput ?? '(нет ответа)');
      return;
    }

    const rl = createInterface({ input, output });
    console.log('🍽️  Чат с ассистентом ресторана (exit — выход)\n');

    while (true) {
      const line = (await rl.question('Вы: ')).trim();
      if (!line || line.toLowerCase() === 'exit' || line.toLowerCase() === 'quit') break;

      const result = await run(bundle.agent, line);
      console.log(`\n🤖 Ассистент: ${result.finalOutput ?? '(нет ответа)'}\n`);
    }

    rl.close();
  } finally {
    await closeRestaurantAgent(bundle);
  }
}

main().catch((error) => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});
