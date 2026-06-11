import { supabase } from './supabaseClient';

const roundNumber = (value, decimals) => {
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(num)) return NaN;
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
};

const formatNumeric = (value, decimals) => {
  const rounded = roundNumber(value, decimals);
  if (!Number.isFinite(rounded)) return null;
  return decimals > 0 ? rounded.toFixed(decimals) : String(rounded);
};

const toDbError = (error) => {
  const message = error?.message ?? '';
  if (message.includes('numeric field overflow')) {
    return new Error(
      'Слишком большое количество или цена для полей базы данных. ' +
      'Уменьшите значения или выполните SQL из supabase/fix_numeric_overflow.sql в Supabase.'
    );
  }
  return error;
};

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

export const addSupply = async (supply) => {
    const quantity = formatNumeric(supply.quantity, 3);
    const pricePerUnit = formatNumeric(supply.price_per_unit, 2);

    if (quantity === null || Number(quantity) <= 0) {
        throw new Error('Укажите корректное количество');
    }
    if (pricePerUnit === null || Number(pricePerUnit) <= 0) {
        throw new Error('Укажите корректную цену');
    }

    const payload = {
        product_id: supply.product_id,
        quantity,
        price_per_unit: pricePerUnit,
        supplier: supply.supplier?.trim() || null,
        arrived_at: supply.arrived_at,
        ...(supply.created_by ? { created_by: supply.created_by } : {}),
    };

    // 1) insert supply record
    const { data: supplyData, error: insertError } = await supabase
        .from('supplies')
        .insert(payload)
        .select()
        .single();

    if (insertError) throw toDbError(insertError);

    // 2) read current product quantity
    const { data: prod, error: prodError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', supply.product_id)
        .single();

    if (prodError) {
        await supabase.from('supplies').delete().eq('id', supplyData.id);
        throw prodError;
    }

    const newQty = roundNumber(prod?.quantity ?? 0, 3)
        + roundNumber(quantity, 3);

    // 3) update product quantity
    const { data: updatedProduct, error: updError } = await supabase
        .from('products')
        .update({ quantity: formatNumeric(newQty, 3) })
        .eq('id', supply.product_id)
        .select()
        .single();

    if (updError) {
        await supabase.from('supplies').delete().eq('id', supplyData.id);
        throw toDbError(updError);
    }

    return { supply: supplyData, product: updatedProduct };
};

export const getSupplies = async () => {
    const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .order('arrived_at', { ascending: false });
    if (error) throw error;
    return data;
};