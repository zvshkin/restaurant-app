import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
  Stack, Switch, FormControlLabel, Typography,
  Divider, IconButton, Box, Tooltip,
} from '@mui/material';
import { AddCircleOutlined, DeleteOutlined } from '@mui/icons-material';

import { createDish, updateDish } from '../../api/dishes';
import { getProducts }            from '../../api/products';
import { useNotification }        from '../../contexts/NotificationContext';

const CATEGORIES = ['завтрак', 'салаты', 'супы', 'основное', 'десерты', 'напитки'];

const emptyDishForm = {
  name:        '',
  description: '',
  price:       '',
  category:    'основное',
  is_active:   true,
};

const emptyIngredient = { product_id: '', quantity: '' };

export default function DishFormModal({ open, onClose, onSuccess, dish }) {
  const notify    = useNotification();
  const isEditing = Boolean(dish);

  const [form,      setForm]      = useState(emptyDishForm);
  const [formErrors, setFormErrors] = useState({});

  const [ingredients,  setIngredients]  = useState([]);
  const [ingErrors,    setIngErrors]    = useState([]);

  const [products,  setProducts]  = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      setProducts(await getProducts());
    } catch {
      notify.error('Не удалось загрузить список продуктов');
    } finally {
      setProdLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!open) return;

    loadProducts();

    if (isEditing) {
      setForm({
        name:        dish.name        ?? '',
        description: dish.description ?? '',
        price:       dish.price       ?? '',
        category:    dish.category    ?? 'основное',
        is_active:   dish.is_active   ?? true,
      });

      const filled = (dish.dish_ingredients ?? []).map(ing => ({
        product_id: ing.products?.id ?? '',
        quantity:   ing.quantity     ?? '',
      }));
      setIngredients(filled);
      setIngErrors(filled.map(() => ({})));
    } else {
      setForm(emptyDishForm);
      setIngredients([]);
      setIngErrors([]);
    }

    setFormErrors({});
  }, [open, isEditing, dish, loadProducts]);

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, { ...emptyIngredient }]);
    setIngErrors(prev => [...prev, {}]);
  };

  const removeIngredient = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    setIngErrors(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngChange = (index, field, value) => {
    setIngredients(prev =>
      prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing)
    );
    if (ingErrors[index]?.[field]) {
      setIngErrors(prev =>
        prev.map((err, i) => i === index ? { ...err, [field]: '' } : err)
      );
    }
  };

  const usedProductIds = ingredients.map(ing => ing.product_id).filter(Boolean);

  const getUnit = (product_id) =>
    products.find(p => p.id === product_id)?.unit ?? '';

  const validate = () => {
    const nextFormErrors = {};
    if (!form.name.trim())
      nextFormErrors.name = 'Введите название блюда';
    if (!form.price || Number(form.price) < 0)
      nextFormErrors.price = 'Укажите корректную цену';

    const nextIngErrors = ingredients.map(ing => {
      const err = {};
      if (!ing.product_id)
        err.product_id = 'Выберите продукт';
      if (!ing.quantity || Number(ing.quantity) <= 0)
        err.quantity = 'Укажите количество > 0';
      return err;
    });

    const hasIngErrors = nextIngErrors.some(e => Object.keys(e).length > 0);

    setFormErrors(nextFormErrors);
    setIngErrors(nextIngErrors);

    return Object.keys(nextFormErrors).length === 0 && !hasIngErrors;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      notify.warning('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      const dishPayload = {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        price:       Number(form.price),
        category:    form.category,
        is_active:   form.is_active,
      };

      const ingPayload = ingredients.map(ing => ({
        product_id: ing.product_id,
        quantity:   Number(ing.quantity),
      }));

      if (isEditing) {
        await updateDish(dish.id, dishPayload, ingPayload);
        notify.success(`Блюдо «${dishPayload.name}» обновлено`);
      } else {
        await createDish(dishPayload, ingPayload);
        notify.success(`Блюдо «${dishPayload.name}» добавлено в меню`);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Редактировать блюдо' : 'Добавить блюдо'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              ОСНОВНОЕ
            </Typography>
            <Stack spacing={2}>
              <TextField
                name="name"
                label="Название *"
                value={form.name}
                onChange={handleFormChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                autoFocus
              />

              <TextField
                name="description"
                label="Описание"
                value={form.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  name="price"
                  label="Цена (₽) *"
                  type="number"
                  value={form.price}
                  onChange={handleFormChange}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  fullWidth
                  slotProps={{
                    htmlInput: { min: 0, step: 1 },
                  }}
                />
                <TextField
                  select
                  name="category"
                  label="Категория"
                  value={form.category}
                  onChange={handleFormChange}
                  fullWidth
                >
                  {CATEGORIES.map(c => (
                    <MenuItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleFormChange}
                    color="primary"
                  />
                }
                label="Отображать в меню"
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                СОСТАВ ({ingredients.length} ингр.)
              </Typography>
              <Button
                size="small"
                startIcon={<AddCircleOutlined />}
                onClick={addIngredient}
                disabled={prodLoading}
              >
                Добавить ингредиент
              </Button>
            </Stack>

            {ingredients.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                Состав не указан. Нажмите «Добавить ингредиент».
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {ingredients.map((ing, index) => {
                  const availableProducts = products.filter(
                    p => !usedProductIds.includes(p.id) || p.id === ing.product_id
                  );

                  return (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: 'flex-start' }}
                    >
                      <TextField
                        select
                        label="Продукт *"
                        value={ing.product_id}
                        onChange={e => handleIngChange(index, 'product_id', e.target.value)}
                        error={!!ingErrors[index]?.product_id}
                        helperText={ingErrors[index]?.product_id}
                        sx={{ flex: 2 }}
                        size="small"
                      >
                        {availableProducts.map(p => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        label="Кол-во *"
                        type="number"
                        value={ing.quantity}
                        onChange={e => handleIngChange(index, 'quantity', e.target.value)}
                        error={!!ingErrors[index]?.quantity}
                        helperText={ingErrors[index]?.quantity}
                        sx={{ flex: 1 }}
                        size="small"
                        slotProps={{
                          htmlInput: { min: 0.01, step: 0.01 },
                        }}
                      />

                      <TextField
                        label="Ед."
                        value={getUnit(ing.product_id)}
                        disabled
                        sx={{ width: 72 }}
                        size="small"
                      />

                      <Tooltip title="Убрать ингредиент">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeIngredient(index)}
                          sx={{ mt: 0.5 }}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>

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