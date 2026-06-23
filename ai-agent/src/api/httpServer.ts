import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { run, user } from '@openai/agents';
import type { AgentInputItem } from '@openai/agents';
import { createClient } from '@supabase/supabase-js';
import {
  createRestaurantAgent,
  closeRestaurantAgent,
  type RestaurantAgentBundle,
} from '../agent/createRestaurantAgent.js';

const PORT = Number(process.env.AGENT_API_PORT ?? 3002);

interface ThreadSession {
  userId: string;
  bundle: RestaurantAgentBundle;
  history: AgentInputItem[] | undefined;
}

const threads = new Map<string, ThreadSession>();

function getSupabaseAuth() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны для API агента');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function authenticateRequest(req: express.Request): Promise<string> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Требуется авторизация'), { status: 401 });
  }

  const token = header.slice('Bearer '.length);
  const supabase = getSupabaseAuth();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw Object.assign(new Error('Недействительный токен'), { status: 401 });
  }

  if (data.user.is_anonymous) {
    throw Object.assign(new Error('Гостевой доступ к ИИ-помощнику запрещён'), { status: 403 });
  }

  return data.user.id;
}

function detectOrderCreated(result: { newItems: readonly { type: string; rawItem?: unknown; output?: unknown }[] }): { orderCreated: boolean; orderId?: string } {
  for (const item of result.newItems) {
    if (item.type !== 'tool_call_output_item') continue;

    const rawOutput = (item as { output?: unknown }).output
      ?? (item.rawItem as { output?: unknown } | undefined)?.output;
    const candidates: string[] = [];

    if (typeof rawOutput === 'string') {
      candidates.push(rawOutput);
    } else if (Array.isArray(rawOutput)) {
      for (const part of rawOutput) {
        if (typeof part === 'object' && part && 'text' in part && typeof part.text === 'string') {
          candidates.push(part.text);
        }
      }
    }

    for (const text of candidates) {
      try {
        const parsed = JSON.parse(text) as { order_id?: string; status?: string };
        if (parsed.order_id && parsed.status) {
          return { orderCreated: true, orderId: parsed.order_id };
        }
      } catch {
        if (text.includes('order_id')) {
          const match = text.match(/"order_id"\s*:\s*"([^"]+)"/);
          if (match) return { orderCreated: true, orderId: match[1] };
        }
      }
    }
  }

  return { orderCreated: false };
}

async function main(): Promise<void> {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/agent/threads', async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      const threadId = randomUUID();
      const bundle = await createRestaurantAgent(userId);

      threads.set(threadId, { userId, bundle, history: undefined });
      res.status(201).json({ threadId });
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      const message = error instanceof Error ? error.message : 'Ошибка сервера';
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/agent/threads/:threadId/messages', async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      const { threadId } = req.params;
      const { message } = req.body as { message?: string; userId?: string };

      if (!message?.trim()) {
        res.status(400).json({ error: 'Сообщение не может быть пустым' });
        return;
      }

      const session = threads.get(threadId);
      if (!session) {
        res.status(404).json({ error: 'Сессия чата не найдена. Создайте новый тред.' });
        return;
      }

      if (session.userId !== userId) {
        res.status(403).json({ error: 'Доступ к этой сессии запрещён' });
        return;
      }

      if (req.body.userId && req.body.userId !== userId) {
        res.status(400).json({ error: 'userId не совпадает с авторизованным пользователем' });
        return;
      }

      const input = session.history
        ? [...session.history, user(message.trim())]
        : message.trim();

      const result = await run(session.bundle.agent, input);
      session.history = result.history;

      const { orderCreated, orderId } = detectOrderCreated(result);

      res.json({
        reply: result.finalOutput ?? 'Извините, не удалось сформировать ответ.',
        orderCreated,
        orderId: orderId ?? null,
      });
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      const message = error instanceof Error ? error.message : 'Ошибка сервера';
      res.status(status).json({ error: message });
    }
  });

  app.delete('/api/agent/threads/:threadId', async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      const session = threads.get(req.params.threadId);

      if (!session) {
        res.status(404).json({ error: 'Сессия не найдена' });
        return;
      }

      if (session.userId !== userId) {
        res.status(403).json({ error: 'Доступ запрещён' });
        return;
      }

      await closeRestaurantAgent(session.bundle);
      threads.delete(req.params.threadId);
      res.status(204).end();
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      const message = error instanceof Error ? error.message : 'Ошибка сервера';
      res.status(status).json({ error: message });
    }
  });

  app.listen(PORT, () => {
    console.error(`Restaurant Agent API → http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
