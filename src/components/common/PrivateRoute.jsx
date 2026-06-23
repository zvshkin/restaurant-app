import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ allowedRoles = [] }) {
  const { user, profile, loading, isGuest } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isGuest) {
    if (allowedRoles.length === 0 || allowedRoles.includes('guest')) {
      return <Outlet />;
    }
    return <Navigate to="/access-denied" replace />;
  }

  if (!profile) {
    return <Spinner />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

function Spinner() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );
}