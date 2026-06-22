import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Typography, Divider, Chip,
} from '@mui/material';
import {
  Dashboard, Inventory2, RestaurantMenu,
  Restaurant, AdminPanelSettings,
  AssignmentOutlined, ReceiptLongOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  {
    label: 'Панель',
    path:  '/dashboard',
    icon:  <Dashboard />,
    roles: ['director', 'admin', 'chef'],
  },
  {
    label: 'Склад',
    path:  '/dashboard/inventory',
    icon:  <Inventory2 />,
    roles: ['director', 'admin', 'chef'],
  },
  {
    label: 'Меню (управление)',
    path:  '/dashboard/menu',
    icon:  <RestaurantMenu />,
    roles: ['director', 'admin', 'chef'],
  },
  {
    label: 'Меню',
    path:  '/menu',
    icon:  <RestaurantMenu />,
    roles: ['client'],
  },
  {
    label: 'Заявки на поставку',
    path:  '/dashboard/supply-requests',
    icon:  <AssignmentOutlined />,
    roles: ['director', 'admin', 'chef'],
  },
];

const ADMIN_ITEMS = [
  {
    label: 'Пользователи',
    path:  '/admin/users',
    icon:  <AdminPanelSettings />,
    roles: ['director', 'admin'],
  },
  {
    label: 'История поставок',
    path:  '/admin/supply-history',
    icon:  <ReceiptLongOutlined />,
    roles: ['director', 'admin'],
  },
];

const ROLE_LABELS = {
  director: { label: 'Директор',      color: 'secondary' },
  admin:    { label: 'Администратор', color: 'primary'   },
  chef:     { label: 'Повар',         color: 'warning'   },
  client:   { label: 'Клиент',        color: 'success'   },
};

function SidebarContent() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { profile, role } = useAuth();

  const roleLabel = ROLE_LABELS[role] ?? null;

  const visibleNavItems = NAV_ITEMS.filter(
    item => !item.roles || item.roles.includes(role)
  );
  const visibleAdminItems = ADMIN_ITEMS.filter(
    item => !item.roles || item.roles.includes(role)
  );

  const renderItem = (item) => {
    const isActive = location.pathname === item.path
      || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

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
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Restaurant sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" color="primary.main" fontWeight={700}>
            Ресторан
          </Typography>
        </Box>

        {profile && (
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>
              {profile.full_name || profile.email}
            </Typography>
            {roleLabel && (
              <Chip
                label={roleLabel.label}
                color={roleLabel.color}
                size="small"
                sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
        )}
      </Box>

      <Divider />

      <List sx={{ mt: 1, px: 1, flexGrow: 1 }}>
        {visibleNavItems.map(renderItem)}
      </List>

      {visibleAdminItems.length > 0 && (
        <>
          <Divider sx={{ mx: 2 }} />
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, letterSpacing: 1 }}>
              АДМИНИСТРИРОВАНИЕ
            </Typography>
          </Box>
          <List sx={{ pb: 2, px: 1 }}>
            {visibleAdminItems.map(renderItem)}
          </List>
        </>
      )}

    </Box>
  );
}

export default function Sidebar({ drawerWidth, mobileOpen, onClose }) {
  const drawerSx = {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
    },
  };

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, ...drawerSx }}
      >
        <SidebarContent />
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: 'none', sm: 'block' }, ...drawerSx }}
      >
        <SidebarContent />
      </Drawer>
    </Box>
  );
}