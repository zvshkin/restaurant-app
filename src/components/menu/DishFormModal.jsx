import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
  Stack, Switch, FormControlLabel, Typography,
  Divider, IconButton, Box, Tooltip,
  Tabs, Tab, Autocomplete, Chip,
} from '@mui/material';
import { AddCircleOutlined, DeleteOutlined } from '@mui/icons-material';

import { createDish, updateDish } from '../../api/dishes';
import { getProducts }            from '../../api/products';
import { useNotification }        from '../../contexts/NotificationContext';

const CATEGORIES = ['завтрак', 'салаты', 'супы', 'основное', 'десерты', 'напитки'];

const TAG_OPTIONS = [
  'острое', 'вегетарианское', 'без глютена',
  'детское', 'фирменное', 'постное', 'новинка',
];

const emptyDishForm = {
  name:               '',
  description:        '',
  price:              '',
  category:           'основное',
  is_active:          true,
  tags:               [],
  calories:           '',
  proteins:           '',
  fats:               '',
  carbs:              '',
  weight_grams:       '',
  cook_time_minutes:  '',
};

const NUTRITION_FIELDS = ['calories', 'proteins', 'fats', 'carbs', 'weight_grams', 'cook_time_minutes'];

const emptyIngredient = { product_id: '', quantity: '' };

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 0.5 }}>{children}</Box>;
}

export default function DishFormModal({ open, onClose, onSuccess, dish }) {
  const notify    = useNotification();
  const isEditing = Boolean(dish);

  const [tab, setTab] = useState(0);

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

    setTab(0);
    loadProducts();

    if (isEditing) {
      setForm({
        name:              dish.name              ?? '',
        description:       dish.description        ?? '',
        price:             dish.price              ?? '',
        category:          dish.category           ?? 'основное',
        is_active:         dish.is_active           ?? true,
        tags:              dish.tags                ?? [],
        calories:          dish.calories           ?? '',
        proteins:          dish.proteins           ?? '',
        fats:              dish.fats               ?? '',
        carbs:             dish.carbs              ?? '',
        weight_grams:      dish.weight_grams       ?? '',
        cook_time_minutes: dish.cook_time_minutes  ?? '',
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

  const handleTagsChange = (_, newValue) => {
    setForm(prev => ({ ...prev, tags: newValue }));
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

    ['calories', 'proteins', 'fats', 'carbs'].forEach(field => {
      if (form[field] !== '' && Number(form[field]) < 0) {
        nextFormErrors[field] = 'Значение не может быть отрицательным';
      }
    });
    if (form.weight_grams !== '' && Number(form.weight_grams) <= 0)
      nextFormErrors.weight_grams = 'Вес должен быть больше 0';
    if (form.cook_time_minutes !== '' && Number(form.cook_time_minutes) <= 0)
      nextFormErrors.cook_time_minutes = 'Время должно быть больше 0';

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
        name:               form.name.trim(),
        description:        form.description.trim() || null,
        price:              Number(form.price),
        category:           form.category,
        is_active:          form.is_active,
        tags:               form.tags,
        calories:           form.calories          !== '' ? Number(form.calories)          : null,
        proteins:           form.proteins          !== '' ? Number(form.proteins)          : null,
        fats:               form.fats              !== '' ? Number(form.fats)              : null,
        carbs:              form.carbs             !== '' ? Number(form.carbs)             : null,
        weight_grams:       form.weight_grams       !== '' ? Number(form.weight_grams)       : null,
        cook_time_minutes:  form.cook_time_minutes  !== '' ? Number(form.cook_time_minutes)  : null,
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

  useEffect(() => {
    const hasNutritionError = NUTRITION_FIELDS.some(f => formErrors[f]);
    if (hasNutritionError && tab !== 1) { setTab(1); return; }

    const hasIngredientsError = ingErrors.some(e => Object.keys(e).length > 0);
    if (hasIngredientsError && tab !== 2 && !hasNutritionError) setTab(2);
  }, [formErrors, ingErrors, tab]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Редактировать блюдо' : 'Добавить блюдо'}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Основное" />
        <Tab label="Питательность" />
        <Tab label={`Состав (${ingredients.length})`} />
      </Tabs>

      <DialogContent dividers>

        <TabPanel value={tab} index={0}>
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

            <Autocomplete
              multiple
              freeSolo={false}
              options={TAG_OPTIONS}
              value={form.tags}
              onChange={handleTagsChange}
              slotProps={{
                chip: {
                  size: 'small',
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Теги"
                  placeholder={form.tags.length === 0 ? 'Выберите теги...' : ''}
                />
              )}
            />

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
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Все поля необязательны. Заполняйте то, что известно — остальное можно добавить позже.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                name="calories"
                label="Калории (ккал)"
                type="number"
                value={form.calories}
                onChange={handleFormChange}
                error={!!formErrors.calories}
                helperText={formErrors.calories}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
              <TextField
                name="weight_grams"
                label="Вес порции (г)"
                type="number"
                value={form.weight_grams}
                onChange={handleFormChange}
                error={!!formErrors.weight_grams}
                helperText={formErrors.weight_grams}
                fullWidth
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                name="proteins"
                label="Белки (г)"
                type="number"
                value={form.proteins}
                onChange={handleFormChange}
                error={!!formErrors.proteins}
                helperText={formErrors.proteins}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              />
              <TextField
                name="fats"
                label="Жиры (г)"
                type="number"
                value={form.fats}
                onChange={handleFormChange}
                error={!!formErrors.fats}
                helperText={formErrors.fats}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              />
              <TextField
                name="carbs"
                label="Углеводы (г)"
                type="number"
                value={form.carbs}
                onChange={handleFormChange}
                error={!!formErrors.carbs}
                helperText={formErrors.carbs}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              />
            </Stack>

            <TextField
              name="cook_time_minutes"
              label="Время приготовления (мин)"
              type="number"
              value={form.cook_time_minutes}
              onChange={handleFormChange}
              error={!!formErrors.cook_time_minutes}
              helperText={formErrors.cook_time_minutes}
              sx={{ maxWidth: { sm: '50%' } }}
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
            />
          </Stack>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1.5 }}>
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
                  <Stack key={index} direction="row" spacing={1.5}>
                    <TextField
                      select
                      label="Продукт *"
                      value={ing.product_id}
                      onChange={e => handleIngChange(index, 'product_id', e.target.value)}
                      error={!!ingErrors[index]?.product_id}
                      helperText={ingErrors[index]?.product_id}
                      sx={{ flex: 2, alignItems: 'flex-start'}}
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
                      slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
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