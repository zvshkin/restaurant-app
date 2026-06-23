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

export const reviewSupplyRequest = async (id, status, metadata = {}) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Недопустимый статус заявки');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const updatePayload = {
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  const { data, error: requestError } = await supabase
    .from('supply_requests')
    .update(updatePayload)
    .eq('id', id)
    .select('*, products:product_id ( name, unit )');

  if (requestError) throw requestError;

  if (!data || data.length === 0) {
    throw new Error(`Не удалось обновить статус заявки. Проверьте права доступа RLS.`);
  }

  const request = data[0];

  if (status === 'approved') {
    if (metadata.price_per_unit == null || !metadata.supplier) {
      throw new Error('Для одобрения заявки укажите цену и поставщика');
    }

    const { error: supplyError } = await supabase
      .from('supplies')
      .insert({
        product_id:     request.product_id,
        quantity:       request.quantity,
        price_per_unit: Number(metadata.price_per_unit),
        supplier:       metadata.supplier,
        arrived_at:     new Date().toISOString().split('T')[0],
        created_by:     user.id,
      });

    if (supplyError) {
      throw new Error('Статус заявки изменен, но не удалось добавить товар на склад: ' + supplyError.message);
    }
  }

  return request;
};