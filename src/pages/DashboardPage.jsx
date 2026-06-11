import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Paper, Button, List,
  ListItem, ListItemText, Chip,
} from '@mui/material';
import Inventory2 from '@mui/icons-material/Inventory2';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Warning from '@mui/icons-material/Warning';
import { getProducts } from '../api/products';
import { getDishes } from '../api/dishes';

function StatCard({ icon, label, value, color = 'primary.main' }) {
  return (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4">{value}</Typography>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [dishes, setDishes]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getDishes()])
      .then(([p, d]) => {
        setProducts(p);
        setDishes(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStock = products.filter(p => p.quantity <= p.min_stock);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Панель управления</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<Inventory2 fontSize="large" />}
            label="Продуктов на складе"
            value={loading ? '…' : products.length}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<RestaurantMenu fontSize="large" />}
            label="Блюд в меню"
            value={loading ? '…' : dishes.length}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<Warning fontSize="large" />}
            label="Низкий остаток"
            value={loading ? '…' : lowStock.length}
            color="error.main"
          />
        </Grid>
      </Grid>

      {!loading && lowStock.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Требуют пополнения</Typography>
            <Button size="small" onClick={() => navigate('/dashboard/inventory')}>
              Перейти на склад
            </Button>
          </Box>
          <List disablePadding>
            {lowStock.map(p => (
              <ListItem key={p.id} disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary={p.name}
                  secondary={`${p.quantity} ${p.unit} (мин. ${p.min_stock} ${p.unit})`}
                />
                <Chip icon={<Warning />} label="Мало" color="error" size="small" />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
