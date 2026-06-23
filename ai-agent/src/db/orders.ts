import pg from 'pg';
import type { CreateOrderResult, OrderItemInput } from '../types/database.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL обязателен для создания заказов (транзакции PostgreSQL). ' +
        'Возьмите URI в Supabase → Settings → Database.',
    );
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  return pool;
}

interface DishPriceRow {
  id: string;
  name: string;
  price: string;
  is_active: boolean;
}

export async function createRestaurantOrder(
  userId: string,
  items: OrderItemInput[],
  notes?: string,
): Promise<CreateOrderResult> {
  if (!items.length) {
    throw new Error('Заказ должен содержать хотя бы одну позицию');
  }

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Некорректное количество для блюда ${item.dish_id}: ${item.quantity}`);
    }
  }

  const uniqueDishIds = [...new Set(items.map((item) => item.dish_id))];
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const priceResult = await client.query<DishPriceRow>(
      `SELECT id, name, price, is_active
       FROM public.dishes
       WHERE id = ANY($1::uuid[])`,
      [uniqueDishIds],
    );

    const priceById = new Map(
      priceResult.rows.map((row) => [row.id, row]),
    );

    for (const dishId of uniqueDishIds) {
      const row = priceById.get(dishId);
      if (!row) {
        throw new Error(`Блюдо не найдено: ${dishId}`);
      }
      if (!row.is_active) {
        throw new Error(`Блюдо «${row.name}» недоступно для заказа`);
      }
    }

    let totalPrice = 0;
    const resolvedItems = items.map((item) => {
      const row = priceById.get(item.dish_id)!;
      const unitPrice = Number(row.price);
      totalPrice += unitPrice * item.quantity;
      return {
        dish_id: item.dish_id,
        quantity: item.quantity,
        price_at_order: unitPrice,
      };
    });

    totalPrice = Math.round(totalPrice * 100) / 100;

    const orderResult = await client.query<{ id: string; status: string; total_price: string }>(
      `INSERT INTO public.orders (user_id, status, total_price, notes)
       VALUES ($1, 'pending', $2, $3)
       RETURNING id, status, total_price`,
      [userId, totalPrice, notes ?? null],
    );

    const order = orderResult.rows[0];
    if (!order) {
      throw new Error('Не удалось создать заказ');
    }

    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO public.order_items (order_id, dish_id, quantity, price_at_order)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.dish_id, item.quantity, item.price_at_order],
      );
    }

    await client.query('COMMIT');

    return {
      order_id: order.id,
      status: order.status,
      total_price: Number(order.total_price),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
