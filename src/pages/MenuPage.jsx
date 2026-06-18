import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Button,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';

import { getDishes, deleteDish } from '../api/dishes';
import { useNotification }       from '../contexts/NotificationContext';
import DishCard                  from '../components/menu/DishCard';
import DishFormModal             from '../components/menu/DishFormModal';
import DeleteConfirmDialog       from '../components/common/DeleteConfirmDialog';

export default function MenuPage() {
  const notify = useNotification();

  const [dishes,  setDishes]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen,   setFormOpen]   = useState(false);
  const [formTarget, setFormTarget] = useState(null);

  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDishes(await getDishes());
    } catch (err) {
      notify.error('Не удалось загрузить меню: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

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
      ) : (
        <Grid container spacing={3}>
          {dishes.map(dish => (
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