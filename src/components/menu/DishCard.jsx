import {
  Card, CardContent, CardMedia, CardHeader,
  Typography, Chip, Box, Divider,
} from '@mui/material';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';

export default function DishCard({ dish }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {dish.photo_url ? (
        <CardMedia component="img" height="180" image={dish.photo_url} alt={dish.name} />
      ) : (
        <Box sx={{
          height: 180, bgcolor: 'primary.light', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <RestaurantMenu sx={{ fontSize: 64, color: 'primary.contrastText', opacity: 0.7 }} />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6">{dish.name}</Typography>
          <Chip label={`${dish.price} ₽`} color="primary" size="small" />
        </Box>

        {dish.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
                  label={`${ing.products.name} ${ing.quantity}${ing.products.unit}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}