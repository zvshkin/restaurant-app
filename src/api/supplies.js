import { supabase } from './supabaseClient';

export const addSupply = async (supply) => {
  const { data, error } = await supabase
    .from('supplies')
    .insert(supply)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getSupplies = async (productId = null) => {
  let query = supabase
    .from('supplies')
    .select('*, products(name, unit)')
    .order('arrived_at', { ascending: false });

  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getSupplyHistory = async () => {
  const { data, error } = await supabase
    .from('supplies')
    .select(`
      *,
      products:product_id ( id, name, unit ),
      author:created_by ( id, full_name, email )
    `)
    .order('arrived_at', { ascending: false });

  if (error) throw error;
  return data;
};