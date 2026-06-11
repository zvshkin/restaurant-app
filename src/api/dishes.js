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