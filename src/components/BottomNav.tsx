import { Home, LineChart, MoreHorizontal, ReceiptText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/transactions', label: 'Mov.', icon: ReceiptText },
  { to: '/investments', label: 'Invest.', icon: LineChart },
  { to: '/more', label: 'Mais', icon: MoreHorizontal },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                  isActive ? 'text-violet-700' : 'text-slate-500'
                }`
              }
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
