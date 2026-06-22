import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_HOME = {
  director: '/dashboard',
  admin:    '/dashboard',
  chef:     '/dashboard',
  client:   '/menu',
};

export default function RoleBasedRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const home = ROLE_HOME[profile?.role] ?? '/dashboard';
  return <Navigate to={home} replace />;
}