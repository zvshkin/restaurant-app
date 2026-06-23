import { supabase } from './supabaseClient';

export const createOrder = async (items, notes = null) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:     user.id,
      total_price: totalPrice,
      notes:       notes || null,
      status:      'pending',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map(item => ({
    order_id:       order.id,
    dish_id:        item.dish_id,
    quantity:        item.quantity,
    price_at_order:  item.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    throw itemsError;
  }

  return order;
};

export const getMyOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        quantity,
        price_at_order,
        dishes:dish_id ( id, name, photo_url )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:user_id ( full_name, email ),
      order_items (
        quantity,
        price_at_order,
        dishes:dish_id ( id, name )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};