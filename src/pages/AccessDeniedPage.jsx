import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper,
} from '@mui/material';
import { LockOutlined, HomeOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { role }  = useAuth();

  const homeRoute = role === 'client' ? '/menu' : '/dashboard';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: { xs: 4, sm: 6 },
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <LockOutlined sx={{ fontSize: 44, color: 'error.main' }} />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: '5rem',
            fontWeight: 800,
            color: 'error.main',
            lineHeight: 1,
            mb: 1,
          }}
        >
          403
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
          Нет доступа
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          У вашей учётной записи недостаточно прав для просмотра этой страницы.
          Если вы считаете, что это ошибка — обратитесь к администратору.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeOutlined />}
          onClick={() => navigate(homeRoute, { replace: true })}
          sx={{ minWidth: 180 }}
        >
          На главную
        </Button>
      </Paper>
    </Box>
  );
}