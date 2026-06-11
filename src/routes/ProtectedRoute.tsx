import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const token = localStorage.getItem('@EvFinanceiro:token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
