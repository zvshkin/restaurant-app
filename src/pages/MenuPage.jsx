import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Button, // 1. ИСПРАВЛЕНО: Импортируем просто Grid
  CircularProgress, Paper, TextField, MenuItem,
  InputAdornment, Autocomplete, Chip,
  FormControlLabel, Switch, Stack, Slider,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';

import { getDishes, deleteDish } from '../api/dishes';
import { useNotification }       from '../contexts/NotificationContext';
import DishCard                  from '../components/menu/DishCard';
import DishFormModal             from '../components/menu/DishFormModal';
import DeleteConfirmDialog       from '../components/common/DeleteConfirmDialog';

const CATEGORIES = ['завтрак', 'салаты', 'супы', 'основное', 'десерты', 'напитки'];
const TAG_OPTIONS = [
  'острое', 'вегетарианское', 'без глютена',
  'детское', 'фирменное', 'постное', 'новинка',
];

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const DEFAULT_PRICE_RANGE = [0, 5000];

export default function MenuPage() {
  const notify = useNotification();

  const [dishes,  setDishes]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceRange,   setPriceRange]   = useState(DEFAULT_PRICE_RANGE);
  const [onlyActive,   setOnlyActive]   = useState(false);

  const [priceBounds, setPriceBounds] = useState(DEFAULT_PRICE_RANGE);

  const [formOpen,   setFormOpen]   = useState(false);
  const [formTarget, setFormTarget] = useState(null);

  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDishes();
      setDishes(data);

      if (data.length > 0) {
        const prices = data.map(d => Number(d.price));
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        setPriceBounds([min, max]);
        setPriceRange([min, max]);
      }
    } catch (err) {
      notify.error('Не удалось загрузить меню: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const filteredDishes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dishes.filter(d => {
      if (query && !d.name.toLowerCase().includes(query)) return false;
      if (category !== 'all' && d.category !== category)  return false;
      if (onlyActive && !d.is_active)                       return false;

      if (selectedTags.length > 0) {
        const dishTags = d.tags ?? [];
        const hasAllTags = selectedTags.every(t => dishTags.includes(t));
        if (!hasAllTags) return false;
      }

      const price = Number(d.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;

      return true;
    });
  }, [dishes, search, category, selectedTags, priceRange, onlyActive]);

  const filtersActive = search || category !== 'all' || selectedTags.length > 0
    || onlyActive || priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1];

  const openCreate = () => {
    setFormTarget(null);
    setFormOpen(true);
  };

  const openEdit = (dish) => {
    setFormTarget(dish);
    setFormOpen(true);
  };

  const openDelete = (dish) => {
    setDeleteTarget(dish);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDish(deleteTarget.id);
      notify.success(`Блюдо «${deleteTarget.name}» удалено`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      load();
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Меню</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Добавить блюдо
        </Button>
      </Box>

      {!loading && dishes.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <TextField
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ flex: 2, minWidth: 200 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                select
                label="Категория"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 160 }}
              >
                <MenuItem value="all">Все категории</MenuItem>
                {CATEGORIES.map(c => (
                  <MenuItem key={c} value={c}>{capitalize(c)}</MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={onlyActive}
                    onChange={(e) => setOnlyActive(e.target.checked)}
                    color="primary"
                  />
                }
                label="Только активные"
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { sm: 'flex-start' } }}>
              <Autocomplete
                multiple
                size="small"
                options={TAG_OPTIONS}
                value={selectedTags}
                onChange={(_, value) => setSelectedTags(value)}
                sx={{ flex: 1, minWidth: 240 }}
                slotProps={{
                  chip: {
                    size: 'small',
                  },
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Теги" placeholder={selectedTags.length === 0 ? 'Любые' : ''} />
                )}
              />

              <Box sx={{ flex: 1, minWidth: 240, px: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Цена: {priceRange[0]} ₽ — {priceRange[1]} ₽
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, value) => setPriceRange(value)}
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  size="small"
                  valueLabelDisplay="auto"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Stack>
          </Stack>
        </Paper>
      )}

      {filtersActive && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Показано {filteredDishes.length} из {dishes.length} блюд
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : dishes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="body1">Блюда не найдены.</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Нажмите «Добавить блюдо» чтобы создать первое.
          </Typography>
        </Box>
      ) : filteredDishes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="body1">Ничего не найдено по заданным фильтрам.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDishes.map(dish => (
            <Grid key={dish.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <DishCard
                dish={dish}
                onEdit={() => openEdit(dish)}
                onDelete={() => openDelete(dish)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <DishFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={load}
        dish={formTarget}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Удалить блюдо?"
        description={
          deleteTarget
            ? `Вы собираетесь удалить «${deleteTarget.name}». Состав блюда также будет удалён. Это действие необратимо.`
            : 'Это действие необратимо.'
        }
      />
    </Box>
  );
}