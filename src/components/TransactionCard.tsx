import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from 'lucide-react';

type TransactionCardProps = {
  description: string;
  date: string;
  account?: string;
  category?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
};

export function TransactionCard({
  description,
  date,
  account,
  category,
  type,
  amount,
}: TransactionCardProps) {
  const isIncome = type === 'INCOME';
  const isTransfer = type === 'TRANSFER';

  const Icon = isTransfer ? ArrowRightLeft : isIncome ? ArrowDownLeft : ArrowUpRight;

  const valuePrefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          isIncome
            ? 'bg-emerald-50 text-emerald-600'
            : isTransfer
              ? 'bg-violet-50 text-violet-600'
              : 'bg-red-50 text-red-600'
        }`}
      >
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-900">{description}</h3>
        <p className="truncate text-xs text-slate-500">
          {date}
          {account ? ` • ${account}` : ''}
          {category ? ` • ${category}` : ''}
        </p>
      </div>

      <strong
        className={`text-sm font-bold ${
          isIncome ? 'text-emerald-600' : isTransfer ? 'text-violet-600' : 'text-red-600'
        }`}
      >
        {valuePrefix}R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </strong>
    </div>
  );
}
