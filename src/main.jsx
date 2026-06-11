import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { AuthProvider } from './contexts/AuthContext';
import { theme } from './theme/theme';
import App from './App';
import { supabase } from './api/supabaseClient';

// Тест подключения
supabase.from('products').select('count').then(({ data, error }) => {
  if (error) console.error('❌ Supabase ошибка:', error.message);
  else       console.log('✅ Supabase подключён!', data);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);