import { CreditCard, Landmark, Pencil, Trash2, Wallet } from 'lucide-react';

import type { AccountType, FinancialAccount } from '../types/finance';

type AccountCardProps = {
  account: FinancialAccount;
  onEdit: (account: FinancialAccount) => void;
  onDelete: (account: FinancialAccount) => void;
};

const typeLabels: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de crédito',
};

function money(value: string | number) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : 'R$ 0,00';
}

function getIcon(type: AccountType) {
  if (type === 'CREDIT_CARD') return CreditCard;
  if (type === 'CASH') return Wallet;

  return Landmark;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = getIcon(account.type);

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:border-slate-300">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-slate-950">
                {account.name}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {typeLabels[account.type]}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                account.active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {account.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">
              Saldo inicial
            </p>

            <strong className="mt-1 block text-xl font-black tracking-tight text-slate-950">
              {money(account.initialBalance)}
            </strong>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onEdit(account)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              <Pencil size={15} />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onDelete(account)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 text-sm font-bold text-red-700 transition duration-200 hover:bg-red-100"
            >
              <Trash2 size={15} />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}