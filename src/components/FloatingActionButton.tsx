import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Landmark,
  LineChart,
  Plus,
  Tags,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function FloatingActionButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      label: 'Nova receita',
      icon: ArrowDownLeft,
      className: 'bg-emerald-600 text-white',
      onClick: () =>
        navigate('/transactions', {
          state: {
            openCreateModal: true,
            transactionType: 'INCOME',
          },
        }),
    },
    {
      label: 'Nova despesa',
      icon: ArrowUpRight,
      className: 'bg-red-600 text-white',
      onClick: () =>
        navigate('/transactions', {
          state: {
            openCreateModal: true,
            transactionType: 'EXPENSE',
          },
        }),
    },
    {
      label: 'Transferência',
      icon: ArrowRightLeft,
      className: 'bg-violet-700 text-white',
      onClick: () =>
        navigate('/transactions', {
          state: {
            openCreateModal: true,
            transactionType: 'TRANSFER',
          },
        }),
    },
    {
      label: 'Conta',
      icon: Landmark,
      className: 'bg-white text-slate-800',
      onClick: () =>
        navigate('/accounts', {
          state: {
            openCreateModal: true,
          },
        }),
    },
    {
      label: 'Categoria',
      icon: Tags,
      className: 'bg-white text-slate-800',
      onClick: () =>
        navigate('/categories', {
          state: {
            openCreateModal: true,
          },
        }),
    },
    {
      label: 'Investimento',
      icon: LineChart,
      className: 'bg-white text-slate-800',
      onClick: () =>
        navigate('/investments', {
          state: {
            openCreateModal: true,
          },
        }),
    },
  ];

  function handleActionClick(action: () => void) {
    setOpen(false);

    window.setTimeout(() => {
      action();
    }, 120);
  }

  return (
    <div className="fixed bottom-20 right-5 z-50 md:bottom-8">
      {open && (
        <button
          type="button"
          aria-label="Fechar ações"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/20"
        />
      )}

      <div className="relative z-50 mb-3 flex flex-col items-end gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={() => handleActionClick(action.onClick)}
              className={`flex origin-bottom-right items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-xl shadow-slate-950/15 transition-all duration-200 ease-out ${
                action.className
              } ${
                open
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-4 scale-75 opacity-0'
              }`}
              style={{
                transitionDelay: open
                  ? `${index * 35}ms`
                  : `${(actions.length - index) * 20}ms`,
              }}
            >
              <span>{action.label}</span>
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-700 text-white shadow-2xl shadow-violet-300 transition hover:bg-violet-800"
      >
        <span
          className={`transition-transform duration-200 ${
            open ? 'rotate-90 scale-95' : 'rotate-0 scale-100'
          }`}
        >
          {open ? <X size={26} /> : <Plus size={28} />}
        </span>
      </button>
    </div>
  );
}