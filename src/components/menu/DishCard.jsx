import {
  Card, CardContent, CardMedia,
  Typography, Chip, Box, Divider,
  IconButton, Tooltip, Stack,
} from '@mui/material';
import { RestaurantMenu, EditOutlined, DeleteOutlined } from '@mui/icons-material';

export default function DishCard({ dish, onEdit, onDelete }) {
  const hasActions = onEdit || onDelete;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {dish.photo_url ? (
        <CardMedia
          component="img"
          height="180"
          image={dish.photo_url}
          alt={dish.name}
        />
      ) : (
        <Box
          sx={{
            height: 180,
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RestaurantMenu sx={{ fontSize: 64, color: 'primary.contrastText', opacity: 0.7 }} />
        </Box>
      )}

      {hasActions && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          {onEdit && (
            <Tooltip title="Редактировать">
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Удалить">
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                  color: 'error.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                }}
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
            {dish.name}
          </Typography>
          <Chip
            label={`${dish.price} ₽`}
            color="primary"
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {dish.category && (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
            {dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
          </Typography>
        )}

        {dish.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {dish.description}
          </Typography>
        )}

        {dish.dish_ingredients?.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Ингредиенты:
            </Typography>
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {dish.dish_ingredients.map(ing => (
                <Chip
                  key={ing.products.id}
                  label={`${ing.products.name} ${ing.quantity} ${ing.products.unit}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}

        {!dish.is_active && (
          <Chip
            label="Скрыто из меню"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ mt: 1.5 }}
          />
        )}
      </CardContent>
    </Card>
  );
}