import { supabase } from './supabaseClient';

export const getSupplyRequests = async (status = null) => {
  let query = supabase
    .from('supply_requests')
    .select(`
      *,
      products:product_id ( id, name, unit ),
      requester:requested_by ( id, full_name, email ),
      reviewer:reviewed_by ( id, full_name, email )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSupplyRequest = async ({ product_id, quantity, comment }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const { data, error } = await supabase
    .from('supply_requests')
    .insert({
      product_id,
      quantity,
      comment: comment || null,
      requested_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const reviewSupplyRequest = async (id, status, { price_per_unit, supplier } = {}) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Недопустимый статус заявки');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const { data: request, error: requestError } = await supabase
    .from('supply_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, products:product_id ( name, unit )')
    .single();

  if (requestError) throw requestError;

  if (status === 'approved') {
    if (price_per_unit == null || !supplier) {
      throw new Error('Для одобрения заявки укажите цену и поставщика');
    }

    const { error: supplyError } = await supabase
      .from('supplies')
      .insert({
        product_id:     request.product_id,
        quantity:       request.quantity,
        price_per_unit,
        supplier,
        arrived_at:     new Date().toISOString().split('T')[0],
        created_by:     user.id,
      });

    if (supplyError) throw supplyError;
  }

  return request;
};