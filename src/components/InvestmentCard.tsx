import {
  Bitcoin,
  CircleDollarSign,
  Landmark,
  LineChart,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { Investment, InvestmentType } from '../services/investments';

type InvestmentCardProps = {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (investment: Investment) => void;
};

const typeLabels: Record<InvestmentType, string> = {
  FIXED_INCOME: 'Renda fixa',
  STOCK: 'Ações',
  CRYPTO: 'Cripto',
  FUND: 'Fundo',
  TREASURY: 'Tesouro',
  OTHER: 'Outro',
};

function money(value?: string | number | null) {
  return Number(value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getIcon(type: InvestmentType) {
  if (type === 'CRYPTO') return Bitcoin;
  if (type === 'STOCK') return LineChart;
  if (type === 'TREASURY') return Landmark;
  return CircleDollarSign;
}

export function InvestmentCard({
  investment,
  onEdit,
  onDelete,
}: InvestmentCardProps) {
  const Icon = getIcon(investment.type);

  const investedAmount = Number(investment.investedAmount);
  const currentAmount = Number(investment.currentAmount ?? investment.investedAmount);
  const result = currentAmount - investedAmount;
  const resultPositive = result >= 0;

  return (
    <article className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-950">{investment.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {typeLabels[investment.type]}
                {investment.institution ? ` • ${investment.institution}` : ''}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                investment.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700'
                  : investment.status === 'REDEEMED'
                    ? 'bg-violet-50 text-violet-700'
                    : 'bg-red-50 text-red-700'
              }`}
            >
              {investment.status === 'ACTIVE'
                ? 'Ativo'
                : investment.status === 'REDEEMED'
                  ? 'Resgatado'
                  : 'Cancelado'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Investido</p>
              <strong className="mt-1 block text-base font-black text-slate-950">
                {money(investment.investedAmount)}
              </strong>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Atual</p>
              <strong className="mt-1 block text-base font-black text-slate-950">
                {money(investment.currentAmount ?? investment.investedAmount)}
              </strong>
            </div>
          </div>

          <div className="mt-3 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Resultado</p>
            <strong
              className={`mt-1 block text-lg font-black ${
                resultPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {resultPositive ? '+' : ''}
              {money(result)}
            </strong>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(investment)}
              className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"
            >
              <Pencil size={14} />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onDelete(investment)}
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
