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
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getIcon(type: AccountType) {
  if (type === 'CREDIT_CARD') return CreditCard;
  if (type === 'CASH') return Wallet;
  return Landmark;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = getIcon(account.type);

  return (
    <article className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-950">{account.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {typeLabels[account.type]}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                account.active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {account.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>

          <div className="mt-4 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Saldo inicial</p>
            <strong className="mt-1 block text-xl font-black text-slate-950">
              {money(account.initialBalance)}
            </strong>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(account)}
              className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"
            >
              <Pencil size={14} />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onDelete(account)}
              className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
