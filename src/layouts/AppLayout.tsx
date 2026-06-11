import {
  Home,
  LineChart,
  LogOut,
  MoreHorizontal,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { BottomNav } from '../components/BottomNav';
import { FloatingActionButton } from '../components/FloatingActionButton';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/transactions', label: 'Movimentações', icon: ReceiptText },
  { to: '/investments', label: 'Investimentos', icon: LineChart },
  { to: '/accounts', label: 'Contas', icon: WalletCards },
  { to: '/more', label: 'Mais', icon: MoreHorizontal },
];

export function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('@EvFinanceiro:token');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white p-6 md:block">
        <div className="mb-8">
          <p className="text-sm font-medium text-violet-600">EvFinanceiro</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Controle financeiro</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-violet-700 text-white shadow-lg shadow-violet-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <main className="min-h-screen pb-24 md:ml-72 md:pb-0">
        <Outlet />
      </main>

      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
