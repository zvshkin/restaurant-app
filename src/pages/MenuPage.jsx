import { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { getDishes } from '../api/dishes';
import DishCard from '../components/menu/DishCard';

export default function MenuPage() {
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    getDishes().then(setDishes).catch(console.error);
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Меню</Typography>
      <Grid container spacing={3}>
        {dishes.map(dish => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dish.id}>
            <DishCard dish={dish} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}