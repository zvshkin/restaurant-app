import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Link,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Restaurant, PersonOutlined } from '@mui/icons-material';
import { useAuth }         from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getProfileById }  from '../api/profiles';

const ROLE_HOME = {
  director: '/dashboard',
  admin:    '/dashboard',
  chef:     '/dashboard',
  client:   '/menu',
};

export default function LoginPage() {
  const { signIn, signInAsGuest } = useAuth();
  const navigate   = useNavigate();
  const notify     = useNotification();

  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [loading,      setLoading]       = useState(false);
  const [guestLoading, setGuestLoading]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.includes('@'))  errors.email    = 'Введите корректный email';
    if (formData.password.length < 6)   errors.password = 'Пароль — минимум 6 символов';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { session } = await signIn(formData);

      let homeRoute = '/dashboard';
      try {
        const profile = await getProfileById(session.user.id);
        homeRoute = ROLE_HOME[profile?.role] ?? '/dashboard';
      } catch {
      }

      navigate(homeRoute);
    } catch (err) {
      const message = err.message === 'Invalid login credentials'
        ? 'Неверный email или пароль'
        : err.message;
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await signInAsGuest();
      navigate('/menu');
    } catch (err) {
      notify.error('Не удалось войти как гость: ' + err.message);
    } finally {
      setGuestLoading(false);
    }
  };

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
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Restaurant sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ mt: 1 }}>
            Войти в систему
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Управление рестораном
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            fullWidth
            required
            sx={{ mb: 2 }}
            autoComplete="email"
          />

          <TextField
            name="password"
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            fullWidth
            required
            sx={{ mb: 3 }}
            autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(v => !v)}
                      edge="end"
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || guestLoading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>или</Divider>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          startIcon={guestLoading ? <CircularProgress size={20} color="inherit" /> : <PersonOutlined />}
          onClick={handleGuestLogin}
          disabled={loading || guestLoading}
          color="inherit"
        >
          {guestLoading ? 'Входим...' : 'Войти как гость'}
        </Button>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          Только просмотр меню, без сохранения данных
        </Typography>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Нет аккаунта?{' '}
          <Link component={RouterLink} to="/register">
            Зарегистрироваться
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}