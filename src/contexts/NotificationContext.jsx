import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 3;

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((severity, message) => {
    const id = ++idCounter;

    setNotifications(prev => {
      const trimmed = prev.length >= MAX_NOTIFICATIONS ? prev.slice(1) : prev;
      return [...trimmed, { id, severity, message, open: true }];
    });

    setTimeout(() => {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, open: false } : n)
      );
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 500);
    }, 4000);
  }, []);

  const closeNotification = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, open: false } : n)
    );
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 500);
  }, []);

  const notify = {
    success: (msg) => addNotification('success', msg),
    error:   (msg) => addNotification('error',   msg),
    warning: (msg) => addNotification('warning', msg),
    info:    (msg) => addNotification('info',    msg),
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
          maxWidth: 400,
          width: { xs: 'calc(100vw - 48px)', sm: 360 },
        }}
      >
        {notifications.map(n => (
          <Snackbar
            key={n.id}
            open={n.open}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            sx={{ position: 'relative', bottom: 'auto', left: 'auto' }}
          >
            <Alert
              severity={n.severity}
              variant="filled"
              onClose={() => closeNotification(n.id)}
              sx={{
                width: '100%',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                borderRadius: 2,
                alignItems: 'center',
                '& .MuiAlert-message': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
              }}
            >
              {n.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification должен использоваться внутри NotificationProvider');
  }
  return context.notify;
}