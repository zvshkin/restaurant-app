import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { addSupply } from '../../api/supplies';
import { useAuth } from '../../contexts/AuthContext';

export default function AddSupplyModal({ open, onClose, products, defaultProduct, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    product_id: '', quantity: '', price_per_unit: '',
    supplier: '', arrived_at: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (defaultProduct) setForm(f => ({ ...f, product_id: defaultProduct.id }));
  }, [defaultProduct]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.product_id || !form.quantity || !form.price_per_unit) {
      setError('Заполните обязательные поля'); return;
    }
    setLoading(true);
    setError('');
    try {
      await addSupply({
        product_id: form.product_id,
        quantity: form.quantity,
        price_per_unit: form.price_per_unit,
        supplier: form.supplier,
        arrived_at: form.arrived_at,
        created_by: user.id,
      });
      onSuccess?.();
      onClose();
      setForm({ product_id: '', quantity: '', price_per_unit: '',
                supplier: '', arrived_at: new Date().toISOString().split('T')[0] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить поставку</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField select name="product_id" label="Продукт *"
          value={form.product_id} onChange={handleChange}>
          {products.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name} ({p.unit})</MenuItem>
          ))}
        </TextField>

        <TextField name="quantity" label="Количество *" type="number"
          value={form.quantity} onChange={handleChange}
          slotProps={{ htmlInput: { min: 0, step: 0.1 } }} />

        <TextField name="price_per_unit" label="Цена за единицу (₽) *" type="number"
          value={form.price_per_unit} onChange={handleChange}
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />

        <TextField name="supplier" label="Поставщик"
          value={form.supplier} onChange={handleChange} />

        <TextField name="arrived_at" label="Дата поставки" type="date"
          value={form.arrived_at} onChange={handleChange}
          slotProps={{ inputLabel: { shrink: true } }} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}