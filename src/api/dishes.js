import { supabase } from './supabaseClient';

export const getDishes = async () => {
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      *,
      dish_ingredients (
        quantity,
        products ( id, name, unit )
      )
    `)
    .order('name');
  if (error) throw error;
  return data;
};

export const createDish = async (dish, ingredients = []) => {
  const { data: created, error: dishError } = await supabase
    .from('dishes')
    .insert(dish)
    .select()
    .single();

  if (dishError) throw dishError;

  if (ingredients.length > 0) {
    const rows = ingredients.map(ing => ({
      dish_id:    created.id,
      product_id: ing.product_id,
      quantity:   ing.quantity,
    }));

    const { error: ingError } = await supabase
      .from('dish_ingredients')
      .insert(rows);

    if (ingError) {
      await supabase.from('dishes').delete().eq('id', created.id);
      throw ingError;
    }
  }

  return created;
};

export const updateDish = async (id, dish, ingredients = []) => {
  const { data: updated, error: dishError } = await supabase
    .from('dishes')
    .update(dish)
    .eq('id', id)
    .select()
    .single();

  if (dishError) throw dishError;

  const { error: deleteError } = await supabase
    .from('dish_ingredients')
    .delete()
    .eq('dish_id', id);

  if (deleteError) throw deleteError;

  if (ingredients.length > 0) {
    const rows = ingredients.map(ing => ({
      dish_id:    id,
      product_id: ing.product_id,
      quantity:   ing.quantity,
    }));

    const { error: ingError } = await supabase
      .from('dish_ingredients')
      .insert(rows);

    if (ingError) throw ingError;
  }

  return updated;
};

export const deleteDish = async (id) => {
  const { error } = await supabase
    .from('dishes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};