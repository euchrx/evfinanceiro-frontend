import {
  Home,
  LineChart,
  LogOut,
  MoreHorizontal,
  ReceiptText,
  ShieldCheck,
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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('@EvFinanceiro:token');
    localStorage.removeItem('@EvFinanceiro:user');

    navigate('/login', {
      replace: true,
    });
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white p-5 md:block">
        <div className="flex h-full flex-col">
          <div className="mb-7 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-[5px_1fr]">
              <div className="bg-blue-700" />

              <div className="p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <WalletCards size={24} />
                </div>

                <p className="text-sm font-bold text-slate-500">
                  EvFinanceiro
                </p>

                <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-slate-950">
                  Controle financeiro
                </h1>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <ShieldCheck size={14} />
                  Área segura
                </div>
              </div>
            </div>
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
                    cn(
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition duration-200',
                      isActive
                        ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-2xl transition',
                          isActive
                            ? 'bg-white/12 text-white'
                            : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-700',
                        )}
                      >
                        <Icon size={19} />
                      </span>

                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition duration-200 hover:bg-red-100"
            >
              <LogOut size={18} />
              Sair
            </button>

            <p className="mt-4 text-center text-xs font-medium text-slate-400">
              EvFinanceiro App
            </p>
          </div>
        </div>
      </aside>

      <main className="min-h-screen bg-white pb-24 md:ml-72 md:pb-0">
        <Outlet />
      </main>

      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}