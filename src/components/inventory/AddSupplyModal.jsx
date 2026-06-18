import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
} from '@mui/material';
import { addSupply }          from '../../api/supplies';
import { useAuth }            from '../../contexts/AuthContext';
import { useNotification }    from '../../contexts/NotificationContext';

export default function AddSupplyModal({
  open,
  onClose,
  products,
  defaultProduct,
  onSuccess,
}) {
  const { user }  = useAuth();
  const notify    = useNotification();

  const emptyForm = {
    product_id:    '',
    quantity:      '',
    price_per_unit: '',
    supplier:      '',
    arrived_at:    new Date().toISOString().split('T')[0],
  };

  const [form,    setForm]    = useState(emptyForm);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && defaultProduct) {
      setForm(f => ({ ...f, product_id: defaultProduct.id }));
    }
    if (!open) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [open, defaultProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.product_id)                               newErrors.product_id    = 'Выберите продукт';
    if (!form.quantity || parseFloat(form.quantity) <= 0) newErrors.quantity    = 'Укажите количество больше 0';
    if (!form.price_per_unit || parseFloat(form.price_per_unit) < 0)
                                                        newErrors.price_per_unit = 'Укажите корректную цену';
    if (!form.arrived_at)                               newErrors.arrived_at   = 'Укажите дату';
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      notify.warning('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await addSupply({
        ...form,
        created_by:     user.id,
        quantity:       parseFloat(form.quantity),
        price_per_unit: parseFloat(form.price_per_unit),
      });

      notify.success('Поставка добавлена. Остаток обновлён.');
      onSuccess?.();
      onClose();
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить поставку</DialogTitle>

      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        <TextField
          select
          name="product_id"
          label="Продукт *"
          value={form.product_id}
          onChange={handleChange}
          error={!!errors.product_id}
          helperText={errors.product_id}
        >
          {products.map(p => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.unit})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          name="quantity"
          label="Количество *"
          type="number"
          value={form.quantity}
          onChange={handleChange}
          error={!!errors.quantity}
          helperText={errors.quantity}
          slotProps={{
            htmlInput: { min: 0, step: 0.1 }
          }}
        />

        <TextField
          name="price_per_unit"
          label="Цена за единицу (₽) *"
          type="number"
          value={form.price_per_unit}
          onChange={handleChange}
          error={!!errors.price_per_unit}
          helperText={errors.price_per_unit}
          slotProps={{
            htmlInput: { min: 0, step: 0.01 }
          }}
        />

        <TextField
          name="supplier"
          label="Поставщик"
          value={form.supplier}
          onChange={handleChange}
        />

        <TextField
          name="arrived_at"
          label="Дата поставки *"
          type="date"
          value={form.arrived_at}
          onChange={handleChange}
          error={!!errors.arrived_at}
          helperText={errors.arrived_at}
          slotProps={{
            inputLabel: { shrink: true }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minWidth: 110 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}