import { supabase } from './supabaseClient';

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

export const createProduct = async (product) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
};