import { supabase } from './supabaseClient';

export const getFavorites = async () => {
  const { data, error } = await supabase
    .from('favorites')
    .select('dish_id');

  if (error) throw error;
  return new Set(data.map(f => f.dish_id));
};

export const addFavorite = async (dish_id) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, dish_id });

  if (error && error.code !== '23505') throw error;
};

export const removeFavorite = async (dish_id) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('dish_id', dish_id);

  if (error) throw error;
};