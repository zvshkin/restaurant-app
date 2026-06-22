import {
  Dialog, DialogContent, DialogTitle,
  Box, Typography, Chip, Divider, Stack,
  IconButton, Button, Tooltip,
} from '@mui/material';
import {
  Close, Favorite, FavoriteBorder,
  AccessTime, RestaurantMenu, ShoppingCartOutlined,
} from '@mui/icons-material';

export default function DishDetailModal({ dish, open, onClose, isFavorite, onToggleFavorite, onAddToCart }) {
  if (!dish) return null;

  const hasNutrition = dish.calories != null || dish.proteins != null
    || dish.fats != null || dish.carbs != null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <IconButton
        onClick={onClose}
        size="small"
        sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}
      >
        <Close fontSize="small" />
      </IconButton>

      {dish.photo_url ? (
        <Box
          component="img"
          src={dish.photo_url}
          alt={dish.name}
          sx={{ width: '100%', height: 220, objectFit: 'cover' }}
        />
      ) : (
        <Box sx={{
          height: 160,
          bgcolor: 'primary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <RestaurantMenu sx={{ fontSize: 56, color: 'primary.contrastText', opacity: 0.7 }} />
        </Box>
      )}

      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>{dish.name}</Typography>
          <Chip label={`${dish.price} ₽`} color="primary" />
        </Box>

        <Stack direction="row" gap={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {dish.category && (
            <Chip
              label={dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
              size="small"
              variant="outlined"
            />
          )}
          {dish.tags?.map(tag => (
            <Chip key={tag} label={tag} size="small" color="secondary" variant="outlined" />
          ))}
          {dish.cook_time_minutes && (
            <Chip
              icon={<AccessTime sx={{ fontSize: '14px !important' }} />}
              label={`${dish.cook_time_minutes} мин`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        {dish.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dish.description}
          </Typography>
        )}

        {hasNutrition && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ПИТАТЕЛЬНОСТЬ НА ПОРЦИЮ
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 2 }}>
              {dish.calories    != null && <Chip label={`🔥 ${dish.calories} ккал`}      size="small" variant="outlined" />}
              {dish.proteins    != null && <Chip label={`🥩 ${dish.proteins}г белков`}    size="small" variant="outlined" />}
              {dish.fats        != null && <Chip label={`🧈 ${dish.fats}г жиров`}        size="small" variant="outlined" />}
              {dish.carbs       != null && <Chip label={`🍞 ${dish.carbs}г углеводов`}   size="small" variant="outlined" />}
              {dish.weight_grams != null && <Chip label={`⚖️ ${dish.weight_grams}г`}     size="small" variant="outlined" />}
            </Box>
          </>
        )}

        {dish.dish_ingredients?.length > 0 && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              СОСТАВ
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 2 }}>
              {dish.dish_ingredients.map(ing => (
                <Chip
                  key={ing.products?.id}
                  label={`${ing.products?.name} ${ing.quantity}${ing.products?.unit}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}

        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
            onClick={() => onToggleFavorite(dish)}
            sx={{ flex: 1 }}
          >
            {isFavorite ? 'В избранном' : 'В избранное'}
          </Button>

          <Tooltip title={onAddToCart ? '' : 'Корзина появится в следующей версии'}>
            <span style={{ flex: 2 }}>
              <Button
                variant="contained"
                startIcon={<ShoppingCartOutlined />}
                onClick={() => onAddToCart?.(dish)}
                disabled={!onAddToCart}
                fullWidth
              >
                В корзину
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}