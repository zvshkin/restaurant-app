import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  CircularProgress, Link, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Restaurant } from '@mui/icons-material';
import { useAuth }         from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();
  const notify     = useNotification();

  const [formData, setFormData] = useState({
    fullName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [showPassword,         setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading,     setLoading]     = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim())
      errors.fullName = 'Введите имя';
    if (!formData.email.includes('@'))
      errors.email = 'Введите корректный email';
    if (formData.password.length < 6)
      errors.password = 'Пароль — минимум 6 символов';
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Пароли не совпадают';
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
      await signUp({
        email:    formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      notify.success('Аккаунт создан! Выполняем вход...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setLoading(false);
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
      <Paper sx={{ p: 4, width: '100%', maxWidth: 440 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Restaurant sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ mt: 1 }}>
            Регистрация
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Создайте аккаунт сотрудника
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            name="fullName"
            label="Полное имя"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            error={!!fieldErrors.fullName}
            helperText={fieldErrors.fullName}
            fullWidth
            required
            sx={{ mb: 2 }}
            autoComplete="name"
          />

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
            sx={{ mb: 2 }}
            autoComplete="new-password"
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

          <TextField
            name="confirmPassword"
            label="Подтвердите пароль"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword}
            fullWidth
            required
            sx={{ mb: 3 }}
            autoComplete="new-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(v => !v)}
                      edge="end"
                      aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
            disabled={loading}
          >
            {loading
              ? <CircularProgress size={24} color="inherit" />
              : 'Создать аккаунт'
            }
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to="/login">
            Войти
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}