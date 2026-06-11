import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar  from './TopBar';

const DRAWER_WIDTH = 260;

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setMobileOpen(v => !v);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={toggle}
      />
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        ml: { sm: `${DRAWER_WIDTH}px` },
      }}>
        <TopBar onMenuClick={toggle} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}