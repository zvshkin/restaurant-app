import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
  Stack,
} from '@mui/material';
import { createProduct, updateProduct } from '../../api/products';
import { useNotification }              from '../../contexts/NotificationContext';

const UNITS = ['кг', 'л', 'шт', 'г', 'мл'];

const emptyForm = {
  name:        '',
  description: '',
  unit:        'кг',
  min_stock:   0,
};

export default function ProductFormModal({ open, onClose, onSuccess, product }) {
  const notify    = useNotification();
  const isEditing = Boolean(product);

  const [form,       setForm]       = useState(emptyForm);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        isEditing
          ? {
              name:        product.name        ?? '',
              description: product.description ?? '',
              unit:        product.unit        ?? 'кг',
              min_stock:   product.min_stock   ?? 0,
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, isEditing, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim())
      next.name = 'Введите название продукта';
    if (form.min_stock === '' || Number(form.min_stock) < 0)
      next.min_stock = 'Минимальный остаток не может быть отрицательным';
    return next;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        unit:        form.unit,
        min_stock:   Number(form.min_stock),
      };

      if (isEditing) {
        await updateProduct(product.id, payload);
        notify.success(`Продукт «${payload.name}» обновлён`);
      } else {
        await createProduct(payload);
        notify.success(`Продукт «${payload.name}» добавлен на склад`);
      }

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
      <DialogTitle>
        {isEditing ? 'Редактировать продукт' : 'Добавить продукт'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            name="name"
            label="Название *"
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            autoFocus
          />

          <TextField
            name="description"
            label="Описание"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
          />

          <TextField
            select
            name="unit"
            label="Единица измерения *"
            value={form.unit}
            onChange={handleChange}
            fullWidth
          >
            {UNITS.map(u => (
              <MenuItem key={u} value={u}>{u}</MenuItem>
            ))}
          </TextField>

          <TextField
            name="min_stock"
            label="Минимальный остаток"
            type="number"
            value={form.min_stock}
            onChange={handleChange}
            error={!!errors.min_stock}
            helperText={
              errors.min_stock ||
              'При достижении этого значения продукт помечается как «Мало»'
            }
            fullWidth
            slotProps={{
              htmlInput: { min: 0, step: 0.1 },
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minWidth: 130 }}
        >
          {loading
            ? <CircularProgress size={20} color="inherit" />
            : isEditing ? 'Сохранить' : 'Добавить'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}