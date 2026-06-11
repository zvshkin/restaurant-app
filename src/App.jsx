import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute   from './components/common/PrivateRoute';
import AppLayout      from './components/layout/AppLayout';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import InventoryPage  from './pages/InventoryPage';
import MenuPage       from './pages/MenuPage';

export default function App() {
  return (
    <Routes>
      {/* Публичные роуты */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Приватные роуты */}
      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"           element={<DashboardPage />} />
          <Route path="/dashboard/inventory" element={<InventoryPage />} />
          <Route path="/dashboard/menu"      element={<MenuPage />} />
        </Route>
      </Route>

      {/* Редирект с корня */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}