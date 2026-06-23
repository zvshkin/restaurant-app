import {
  AppBar, Toolbar, IconButton, Typography,
  Avatar, Menu, MenuItem, Box, Divider, ListItemIcon,
  Badge, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, Logout, PersonOutlined,
  ShoppingCartOutlined, PersonOff,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function TopBar({ onMenuClick, onCartOpen }) {
  const { profile, isGuest, signOut } = useAuth();
  const { totalItems }                = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const closeMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    closeMenu();
    await signOut();
    navigate('/login');
  };

  const handleProfileClick = () => {
    closeMenu();
    navigate('/profile');
  };

  const showCart = location.pathname === '/menu' || location.pathname.startsWith('/menu');

  const initials = isGuest
    ? 'Г'
    : profile?.full_name
      ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
      : '?';

  const displayName = isGuest
    ? 'Гость'
    : (profile?.full_name ?? profile?.email ?? '');

  return (
    <AppBar position="static" color="inherit" elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar>
        <IconButton onClick={onMenuClick} sx={{ mr: 2, display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />

        {showCart && !isGuest && (
          <Tooltip title="Корзина">
            <IconButton onClick={onCartOpen} sx={{ mr: 1 }}>
              <Badge badgeContent={totalItems} color="error" max={9}>
                <ShoppingCartOutlined />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {displayName}
        </Typography>

        <Avatar
          src={profile?.avatar_url || undefined}
          sx={{
            bgcolor: isGuest ? 'grey.400' : 'primary.main',
            cursor: 'pointer',
            width: 36,
            height: 36,
          }}
          onClick={e => setAnchorEl(e.currentTarget)}
        >
          {initials}
        </Avatar>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          {!isGuest && (
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonOutlined fontSize="small" />
              </ListItemIcon>
              Мой профиль
            </MenuItem>
          )}
          {!isGuest && <Divider />}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            {isGuest ? 'Выйти из гостевого режима' : 'Выйти'}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}