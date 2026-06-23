import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Box,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function GuestGuard({ children, message }) {
  const { isGuest } = useAuth();
  const navigate     = useNavigate();
  const [open, setOpen] = useState(false);

  if (!isGuest) {
    if (typeof children === 'function') {
      return children({ guardClick: (fn) => fn?.() });
    }
    return children;
  }


  const guardClick = (fn) => {
    setOpen(true);
  };

  const handleClose    = () => setOpen(false);
  const goToLogin      = () => { handleClose(); navigate('/login'); };
  const goToRegister   = () => { handleClose(); navigate('/register'); };

  const dialogText = message ?? 'Чтобы использовать эту функцию, войдите в аккаунт или зарегистрируйтесь.';

  return (
    <>
      {typeof children === 'function'
        ? children({ guardClick })
        : (
          <Box
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            sx={{ display: 'contents' }}
          >
            {children}
          </Box>
        )
      }

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOutlined color="primary" />
          Нужен аккаунт
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogText}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Отмена
          </Button>
          <Button onClick={goToRegister} variant="outlined">
            Зарегистрироваться
          </Button>
          <Button onClick={goToLogin} variant="contained">
            Войти
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}