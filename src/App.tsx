import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import { AccountsPage } from './pages/AccountsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { LoginPage } from './pages/LoginPage';
import { MorePage } from './pages/MorePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route
              path="/profile"
              element={
                <PlaceholderPage
                  title="Perfil"
                  description="Dados da sua conta de acesso."
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Configurações"
                  description="Preferências do aplicativo."
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
