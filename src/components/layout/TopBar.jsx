import {
  AppBar, Toolbar, IconButton, Typography,
  Avatar, Menu, MenuItem, Box, Divider, ListItemIcon,
} from '@mui/material';
import { Menu as MenuIcon, Logout, PersonOutlined } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ onMenuClick }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
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

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <AppBar position="static" color="inherit" elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar>
        <IconButton onClick={onMenuClick} sx={{ mr: 2, display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {profile?.full_name ?? profile?.email}
        </Typography>
        <Avatar
          sx={{ bgcolor: 'primary.main', cursor: 'pointer', width: 36, height: 36 }}
          onClick={e => setAnchorEl(e.currentTarget)}
        >
          {initials}
        </Avatar>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PersonOutlined fontSize="small" />
            </ListItemIcon>
            Мой профиль
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Выйти
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}