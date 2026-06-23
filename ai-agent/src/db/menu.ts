import { getSupabase } from './supabase.js';
import type { Dish, MenuResourcePayload } from '../types/database.js';

const DISH_COLUMNS =
  'id, name, description, price, calories, proteins, fats, carbs, weight_grams, tags, is_active';

export async function fetchActiveDishes(): Promise<Dish[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('dishes')
    .select(DISH_COLUMNS)
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error(`Не удалось загрузить меню: ${error.message}`);
  }

  return (data ?? []) as Dish[];
}

export function buildMenuResourcePayload(dishes: Dish[]): MenuResourcePayload {
  return {
    updated_at: new Date().toISOString(),
    dishes_count: dishes.length,
    dishes: dishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: Number(dish.price),
      nutrition: {
        calories: dish.calories,
        proteins: dish.proteins,
        fats: dish.fats,
        carbs: dish.carbs,
        weight_grams: dish.weight_grams,
      },
      tags: dish.tags ?? [],
    })),
  };
}
