import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, Link,
} from '@mui/material';
import Restaurant from '@mui/icons-material/Restaurant';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!formData.fullName.trim())          return 'Введите имя';
    if (!formData.email.includes('@'))      return 'Введите корректный email';
    if (formData.password.length < 6)       return 'Пароль — минимум 6 символов';
    if (formData.password !== formData.confirmPassword)
                                            return 'Пароли не совпадают';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });
      setSuccess('Аккаунт создан! Проверьте почту для подтверждения.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'fullName',        label: 'Полное имя',        type: 'text',     autoComplete: 'name' },
    { name: 'email',           label: 'Email',               type: 'email',    autoComplete: 'email' },
    { name: 'password',        label: 'Пароль',               type: 'password', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Подтвердите пароль',   type: 'password', autoComplete: 'new-password' },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2,
    }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 440 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Restaurant sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ mt: 1 }}>Регистрация</Typography>
        </Box>

        {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {fields.map(f => (
            <TextField
              key={f.name}
              name={f.name}
              label={f.label}
              type={f.type}
              value={formData[f.name]}
              onChange={handleChange}
              autoComplete={f.autoComplete}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
          ))}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Создать аккаунт'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to="/login">Войти</Link>
        </Typography>
      </Paper>
    </Box>
  );
}