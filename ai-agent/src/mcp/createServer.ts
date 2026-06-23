import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { fetchActiveDishes, buildMenuResourcePayload } from '../db/menu.js';
import { createRestaurantOrder } from '../db/orders.js';

export const MENU_RESOURCE_URI = 'restaurant://menu/active-dishes';

export function createRestaurantMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'restaurant-mcp-server',
      version: '1.0.0',
    },
    {
      instructions:
        'Перед консультацией по меню прочитай ресурс restaurant://menu/active-dishes. ' +
        'Для оформления заказа используй инструмент create_restaurant_order. ' +
        'Цены всегда берутся из базы данных на стороне сервера.',
    },
  );

  server.registerResource(
    'active-dishes-menu',
    MENU_RESOURCE_URI,
    {
      title: 'Активное меню ресторана',
      description:
        'Список доступных блюд с ценами, КБЖУ (калории, белки, жиры, углеводы), весом порции и тегами',
      mimeType: 'application/json',
    },
    async (uri) => {
      const dishes = await fetchActiveDishes();
      const payload = buildMenuResourcePayload(dishes);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'create_restaurant_order',
    {
      title: 'Создать заказ в ресторане',
      description:
        'Создаёт заказ в базе данных ресторана. Цены блюд запрашиваются из таблицы dishes ' +
        'на стороне сервера (защита от подмены). Все операции выполняются в одной транзакции.',
      inputSchema: {
        user_id: z.string().uuid().describe('UUID пользователя (auth.users / profiles.id)'),
        notes: z
          .string()
          .optional()
          .describe('Комментарий к заказу (аллергии, пожелания по подаче и т.д.)'),
        items: z
          .array(
            z.object({
              dish_id: z.string().uuid().describe('UUID блюда из меню'),
              quantity: z.number().int().min(1).describe('Количество порций'),
            }),
          )
          .min(1)
          .describe('Позиции заказа'),
      },
      outputSchema: {
        order_id: z.string().uuid(),
        status: z.string(),
        total_price: z.number(),
      },
    },
    async ({ user_id, notes, items }) => {
      try {
        const result = await createRestaurantOrder(user_id, items, notes);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Ошибка создания заказа: ${message}` }],
        };
      }
    },
  );

  return server;
}
