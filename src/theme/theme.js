import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2D6A4F',
      light: '#52B788',
      dark: '#1B4332',
      contrastText: '#fff',
    },
    secondary: {
      main: '#E76F51',
      contrastText: '#fff',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    error:   { main: '#D62839' },
    warning: { main: '#F4A261' },
    success: { main: '#52B788' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      },
    },
  },
});