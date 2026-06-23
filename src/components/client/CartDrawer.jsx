import {
  Drawer, Box, Typography, IconButton, Button,
  List, ListItem, Avatar, Divider,
  TextField, Stack, CircularProgress,
} from '@mui/material';
import {
  Close, Add, Remove, DeleteOutlined,
  ShoppingCartOutlined, RestaurantMenu,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCart }         from '../../contexts/CartContext';
import { useAuth }         from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { createOrder }     from '../../api/orders';
import GuestGuard          from '../common/GuestGuard';

const formatPrice = (n) =>
  new Intl.NumberFormat('ru-RU').format(n);

export default function CartDrawer({ open, onClose }) {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { user, isGuest } = useAuth();
  const notify             = useNotification();
  const navigate           = useNavigate();

  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (items.length === 0) {
      notify.warning('Корзина пуста');
      return;
    }

    setLoading(true);
    try {
      await createOrder(items, notes);
      notify.success('Заказ успешно оформлен! Мы начинаем готовить.');
      clearCart();
      setNotes('');
      onClose();
    } catch (err) {
      notify.error('Ошибка при оформлении заказа: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <ShoppingCartOutlined sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Корзина
          {totalItems > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({totalItems} {totalItems === 1 ? 'позиция' : 'позиций'})
            </Typography>
          )}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, color: 'text.disabled' }}>
          <ShoppingCartOutlined sx={{ fontSize: 56, mb: 2, opacity: 0.4 }} />
          <Typography variant="body1">Корзина пуста</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Добавьте блюда из меню
          </Typography>
        </Box>
      ) : (
        <>
          <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
            {items.map((item, idx) => (
              <ListItem
                key={item.dish_id}
                sx={{ flexDirection: 'column', alignItems: 'stretch', px: 1, py: 1.5 }}
                divider={idx < items.length - 1}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={item.photo_url || undefined}
                    variant="rounded"
                    sx={{ width: 48, height: 48, bgcolor: 'primary.light', flexShrink: 0 }}
                  >
                    <RestaurantMenu sx={{ fontSize: 24, color: 'primary.contrastText' }} />
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatPrice(item.price)} ₽ × {item.quantity} = {formatPrice(item.price * item.quantity)} ₽
                    </Typography>
                  </Box>

                  <IconButton size="small" color="error" onClick={() => removeFromCart(item.dish_id)}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, alignSelf: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item.dish_id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item.dish_id, item.quantity + 1)}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Stack>
              </ListItem>
            ))}
          </List>

          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Итого:</Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {formatPrice(totalPrice)} ₽
              </Typography>
            </Stack>

            <TextField
              label="Комментарий к заказу"
              placeholder="Аллергии, пожелания, столик..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              size="small"
              sx={{ mb: 2 }}
            />

            {isGuest ? (
              <GuestGuard message="Чтобы оформить заказ, войдите в аккаунт или зарегистрируйтесь.">
                <Button variant="contained" fullWidth size="large" disabled>
                  Оформить заказ
                </Button>
              </GuestGuard>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleOrder}
                disabled={loading}
              >
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : `Оформить заказ · ${formatPrice(totalPrice)} ₽`
                }
              </Button>
            )}

            <Button
              color="inherit"
              fullWidth
              size="small"
              onClick={clearCart}
              disabled={loading}
              sx={{ mt: 1, color: 'text.disabled' }}
            >
              Очистить корзину
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}