import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, CircularProgress,
  Paper, TextField, MenuItem, Chip,
  InputAdornment, FormControlLabel, Switch, Stack, Slider,
  IconButton, Tooltip, Card, CardContent, CardMedia, CardActionArea,
} from '@mui/material';

import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import { Search, Favorite, FavoriteBorder } from '@mui/icons-material';
import { RestaurantMenu } from '@mui/icons-material';

import { getDishes }                          from '../../api/dishes';
import { getFavorites, addFavorite, removeFavorite } from '../../api/favorites';
import { useNotification }                     from '../../contexts/NotificationContext';
import DishDetailModal                         from '../../components/menu/DishDetailModal';

const CATEGORIES = ['завтрак', 'салаты', 'супы', 'основное', 'десерты', 'напитки'];
const TAG_OPTIONS = ['острое', 'вегетарианское', 'без глютена', 'детское', 'фирменное', 'постное', 'новинка'];

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const DEFAULT_PRICE_RANGE = [0, 5000];

export default function ClientMenuPage() {
  const notify = useNotification();

  const [dishes,      setDishes]      = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading,     setLoading]     = useState(true);

  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('all');
  const [selectedTags,  setSelectedTags]  = useState([]);
  const [priceRange,    setPriceRange]    = useState(DEFAULT_PRICE_RANGE);
  const [priceBounds,   setPriceBounds]   = useState(DEFAULT_PRICE_RANGE);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [selectedDish,  setSelectedDish]  = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dishData, favSet] = await Promise.all([
        getDishes(),
        getFavorites(),
      ]);

      const active = dishData.filter(d => d.is_active);
      setDishes(active);
      setFavoriteIds(favSet);

      if (active.length > 0) {
        const prices = active.map(d => Number(d.price));
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
      if (onlyFavorites && !favoriteIds.has(d.id))         return false;
      if (selectedTags.length > 0) {
        const dishTags = d.tags ?? [];
        if (!selectedTags.every(t => dishTags.includes(t))) return false;
      }
      const price = Number(d.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      return true;
    });
  }, [dishes, search, category, onlyFavorites, selectedTags, priceRange, favoriteIds]);

  const filtersActive = search || category !== 'all' || selectedTags.length > 0
    || onlyFavorites
    || priceRange[0] !== priceBounds[0]
    || priceRange[1] !== priceBounds[1];

  const handleToggleFavorite = useCallback(async (dish) => {
    const wasFavorite = favoriteIds.has(dish.id);

    setFavoriteIds(prev => {
      const next = new Set(prev);
      wasFavorite ? next.delete(dish.id) : next.add(dish.id);
      return next;
    });

    try {
      if (wasFavorite) {
        await removeFavorite(dish.id);
      } else {
        await addFavorite(dish.id);
        notify.success(`«${dish.name}» добавлено в избранное`);
      }
    } catch (err) {
      setFavoriteIds(prev => {
        const next = new Set(prev);
        wasFavorite ? next.add(dish.id) : next.delete(dish.id);
        return next;
      });
      notify.error('Ошибка: ' + err.message);
    }
  }, [favoriteIds, notify]);

  const openDishDetail = (dish) => {
    setSelectedDish(dish);
    setModalOpen(true);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Меню</Typography>

      {!loading && dishes.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <TextField
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ flex: 2 }}
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
                    checked={onlyFavorites}
                    onChange={(e) => setOnlyFavorites(e.target.checked)}
                    color="error"
                  />
                }
                label="Только избранные"
                sx={{ flexShrink: 0 }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { sm: 'flex-start' } }}>
              <Autocomplete
                multiple
                size="small"
                options={TAG_OPTIONS}
                value={selectedTags}
                onChange={(_, value) => setSelectedTags(value)}
                sx={{ flex: 1 }}
                slotProps={{
                    chip: {
                    size: 'small',
                    color: 'secondary',
                    variant: 'outlined',
                    sx: { height: 20, fontSize: '0.68rem' }
                    },
                }}
                renderInput={(params) => (
                    <TextField 
                    {...params} 
                    label="Теги" 
                    placeholder={selectedTags.length === 0 ? 'Любые' : ''} 
                    />
                )}
                />
              <Box sx={{ flex: 1, minWidth: 220, px: 1 }}>
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

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && dishes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>Меню пока пустое</Typography>
        </Box>
      )}

      {!loading && dishes.length > 0 && filteredDishes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>Ничего не найдено по заданным фильтрам</Typography>
        </Box>
      )}

      {!loading && filteredDishes.length > 0 && (
        <Grid container spacing={3}>
          {filteredDishes.map(dish => (
            <Grid key={dish.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ClientDishCard
                dish={dish}
                isFavorite={favoriteIds.has(dish.id)}
                onToggleFavorite={handleToggleFavorite}
                onClick={() => openDishDetail(dish)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <DishDetailModal
        dish={selectedDish}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isFavorite={selectedDish ? favoriteIds.has(selectedDish.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={null}
      />
    </Box>
  );
}

function ClientDishCard({ dish, isFavorite, onToggleFavorite, onClick }) {
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(dish);
  };

  const hasNutrition = dish.calories != null;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      <Tooltip title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}>
        <IconButton
          onClick={handleFavoriteClick}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
            zIndex: 1,
          }}
        >
          {isFavorite
            ? <Favorite fontSize="small" sx={{ color: 'error.main' }} />
            : <FavoriteBorder fontSize="small" />
          }
        </IconButton>
      </Tooltip>

      <CardActionArea onClick={onClick} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        {dish.photo_url ? (
          <CardMedia component="img" height="180" image={dish.photo_url} alt={dish.name} />
        ) : (
          <Box sx={{
            height: 180,
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <RestaurantMenu sx={{ fontSize: 56, color: 'primary.contrastText', opacity: 0.7 }} />
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.3 }}>{dish.name}</Typography>
            <Chip label={`${dish.price} ₽`} color="primary" size="small" sx={{ flexShrink: 0 }} />
          </Box>

          {dish.category && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
              {capitalize(dish.category)}
            </Typography>
          )}

          {dish.tags?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
              {dish.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" color="secondary" variant="outlined"
                  sx={{ height: 20, fontSize: '0.68rem' }} />
              ))}
            </Box>
          )}

          {dish.description && (
            <Typography variant="body2" color="text.secondary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {dish.description}
            </Typography>
          )}

          {hasNutrition && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              🔥 {dish.calories} ккал
              {dish.weight_grams && ` · ⚖️ ${dish.weight_grams}г`}
              {dish.cook_time_minutes && ` · ⏱ ${dish.cook_time_minutes} мин`}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}