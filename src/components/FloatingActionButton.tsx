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

type FloatingActionButtonProps = {
  onNewIncome?: () => void;
  onNewExpense?: () => void;
  onNewTransfer?: () => void;
};

export function FloatingActionButton({
  onNewIncome,
  onNewExpense,
  onNewTransfer,
}: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      label: 'Nova receita',
      icon: ArrowDownLeft,
      onClick: onNewIncome ?? (() => navigate('/transactions')),
      className: 'bg-emerald-600 text-white',
    },
    {
      label: 'Nova despesa',
      icon: ArrowUpRight,
      onClick: onNewExpense ?? (() => navigate('/transactions')),
      className: 'bg-red-600 text-white',
    },
    {
      label: 'Transferência',
      icon: ArrowRightLeft,
      onClick: onNewTransfer ?? (() => navigate('/transactions')),
      className: 'bg-violet-700 text-white',
    },
    {
      label: 'Conta',
      icon: Landmark,
      onClick: () => navigate('/accounts'),
      className: 'bg-white text-slate-800',
    },
    {
      label: 'Categoria',
      icon: Tags,
      onClick: () => navigate('/categories'),
      className: 'bg-white text-slate-800',
    },
    {
      label: 'Investimento',
      icon: LineChart,
      onClick: () => navigate('/investments'),
      className: 'bg-white text-slate-800',
    },
  ];

  function handleActionClick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="fixed bottom-20 right-5 z-50 md:bottom-8">
      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar ações"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/20"
          />

          <div className="relative z-50 mb-3 flex flex-col items-end gap-2">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleActionClick(action.onClick)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-xl shadow-slate-950/15 ${action.className}`}
                >
                  <span>{action.label}</span>
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-700 text-white shadow-2xl shadow-violet-300 transition hover:bg-violet-800"
      >
        {open ? <X size={26} /> : <Plus size={28} />}
      </button>
    </div>
  );
}
