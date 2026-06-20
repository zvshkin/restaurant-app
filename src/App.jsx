import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute      from './components/common/PrivateRoute';
import AppLayout         from './components/layout/AppLayout';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import AccessDeniedPage  from './pages/AccessDeniedPage';
import DashboardPage     from './pages/DashboardPage';
import InventoryPage     from './pages/InventoryPage';
import MenuPage          from './pages/MenuPage';
import UsersPage         from './pages/admin/UsersPage';

export default function App() {
  return (
    <Routes>

      <Route path="/login"          element={<LoginPage />} />
      <Route path="/register"       element={<RegisterPage />} />
      <Route path="/access-denied"  element={<AccessDeniedPage />} />

      <Route element={<PrivateRoute allowedRoles={['director', 'admin', 'chef']} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"           element={<DashboardPage />} />
          <Route path="/dashboard/inventory" element={<InventoryPage />} />
          <Route path="/dashboard/menu"      element={<MenuPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['director', 'admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}