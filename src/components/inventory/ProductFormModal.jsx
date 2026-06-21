import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
  Stack, Tabs, Tab, Box,
} from '@mui/material';
import { createProduct, updateProduct } from '../../api/products';
import { useNotification }              from '../../contexts/NotificationContext';

const UNITS = ['кг', 'л', 'шт', 'г', 'мл'];

const CATEGORIES = [
  'мясо', 'рыба', 'молочное', 'овощи',
  'фрукты', 'крупы', 'специи', 'напитки', 'прочее',
];

const emptyForm = {
  name:               '',
  description:        '',
  unit:               'кг',
  min_stock:          0,
  category:           'прочее',
  storage_conditions: '',
  shelf_life_days:    '',
  manufacturer:       '',
};

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 0.5 }}>{children}</Box>;
}

export default function ProductFormModal({ open, onClose, onSuccess, product }) {
  const notify    = useNotification();
  const isEditing = Boolean(product);

  const [tab,        setTab]        = useState(0);
  const [form,       setForm]       = useState(emptyForm);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (open) {
      setTab(0);
      setForm(
        isEditing
          ? {
              name:               product.name               ?? '',
              description:        product.description         ?? '',
              unit:               product.unit                ?? 'кг',
              min_stock:          product.min_stock            ?? 0,
              category:           product.category             ?? 'прочее',
              storage_conditions: product.storage_conditions   ?? '',
              shelf_life_days:    product.shelf_life_days      ?? '',
              manufacturer:       product.manufacturer         ?? '',
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
    if (form.shelf_life_days !== '' && Number(form.shelf_life_days) <= 0)
      next.shelf_life_days = 'Срок годности должен быть больше 0';
    return next;
  };

  const DETAILS_FIELDS = ['shelf_life_days'];

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const hasDetailsError = Object.keys(validationErrors).some(
        key => DETAILS_FIELDS.includes(key)
      );
      if (hasDetailsError && tab === 0) setTab(1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:               form.name.trim(),
        description:        form.description.trim()        || null,
        unit:                form.unit,
        min_stock:           Number(form.min_stock),
        category:            form.category,
        storage_conditions:  form.storage_conditions.trim() || null,
        shelf_life_days:     form.shelf_life_days !== '' ? Number(form.shelf_life_days) : null,
        manufacturer:        form.manufacturer.trim()       || null,
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

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Основное" />
        <Tab label="Детали" />
      </Tabs>

      <DialogContent>
        <TabPanel value={tab} index={0}>
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                select
                name="category"
                label="Категория"
                value={form.category}
                onChange={handleChange}
                fullWidth
              >
                {CATEGORIES.map(c => (
                  <MenuItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

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
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="manufacturer"
              label="Производитель / бренд"
              value={form.manufacturer}
              onChange={handleChange}
              fullWidth
              placeholder="Например: Простоквашино"
            />

            <TextField
              name="storage_conditions"
              label="Условия хранения"
              value={form.storage_conditions}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={2}
              maxRows={3}
              placeholder="Например: хранить при t° 0-4°C"
            />

            <TextField
              name="shelf_life_days"
              label="Срок годности (дней)"
              type="number"
              value={form.shelf_life_days}
              onChange={handleChange}
              error={!!errors.shelf_life_days}
              helperText={
                errors.shelf_life_days ||
                'Срок годности с момента поставки. Оставьте пустым, если не ограничен'
              }
              fullWidth
              slotProps={{
                htmlInput: { min: 1, step: 1 },
              }}
            />
          </Stack>
        </TabPanel>
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