import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Typography, Divider,
} from '@mui/material';
import Dashboard from '@mui/icons-material/Dashboard';
import Inventory2 from '@mui/icons-material/Inventory2';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Restaurant from '@mui/icons-material/Restaurant';

const NAV_ITEMS = [
  { label: 'Панель',  path: '/dashboard',           icon: <Dashboard /> },
  { label: 'Склад',   path: '/dashboard/inventory', icon: <Inventory2 /> },
  { label: 'Меню',    path: '/dashboard/menu',      icon: <RestaurantMenu /> },
];

function SidebarContent() {
  const location = useLocation();
  const navigate  = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Лого */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Restaurant sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" color="primary.main">
          Ресторан
        </Typography>
      </Box>
      <Divider />

      {/* Навигация */}
      <List sx={{ mt: 1, px: 1 }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default function Sidebar({ drawerWidth, mobileOpen, onClose }) {
  const drawerSx = { width: drawerWidth, flexShrink: 0,
    '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } };

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth } }}>
      {/* Mobile */}
      <Drawer variant="temporary" open={mobileOpen} onClose={onClose}
        ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, ...drawerSx }}>
        <SidebarContent />
      </Drawer>
      {/* Desktop */}
      <Drawer variant="permanent" open
        sx={{ display: { xs: 'none', sm: 'block' }, ...drawerSx }}>
        <SidebarContent />
      </Drawer>
    </Box>
  );
}