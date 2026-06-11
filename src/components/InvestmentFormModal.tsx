import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type {
  CreateInvestmentPayload,
  Investment,
  InvestmentStatus,
  InvestmentType,
} from '../services/investments';

type InvestmentFormModalProps = {
  investment?: Investment | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateInvestmentPayload & {
      status?: InvestmentStatus;
      redeemedAt?: string;
    },
  ) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

const investmentTypes: { value: InvestmentType; label: string }[] = [
  { value: 'FIXED_INCOME', label: 'Renda fixa' },
  { value: 'TREASURY', label: 'Tesouro' },
  { value: 'STOCK', label: 'Ações' },
  { value: 'CRYPTO', label: 'Cripto' },
  { value: 'FUND', label: 'Fundo' },
  { value: 'OTHER', label: 'Outro' },
];

export function InvestmentFormModal({
  investment,
  onClose,
  onSubmit,
}: InvestmentFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('FIXED_INCOME');
  const [institution, setInstitution] = useState('');
  const [investedAmount, setInvestedAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [profitability, setProfitability] = useState(0);
  const [investedAt, setInvestedAt] = useState(today);
  const [redeemedAt, setRedeemedAt] = useState('');
  const [status, setStatus] = useState<InvestmentStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setType(investment.type);
      setInstitution(investment.institution ?? '');
      setInvestedAmount(Number(investment.investedAmount));
      setCurrentAmount(Number(investment.currentAmount ?? investment.investedAmount));
      setProfitability(Number(investment.profitability ?? 0));
      setInvestedAt(investment.investedAt.slice(0, 10));
      setRedeemedAt(investment.redeemedAt?.slice(0, 10) ?? '');
      setStatus(investment.status);
      setNotes(investment.notes ?? '');
    }
  }, [investment]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      await onSubmit({
        name,
        type,
        institution: institution || undefined,
        investedAmount: Number(investedAmount),
        currentAmount: currentAmount ? Number(currentAmount) : undefined,
        profitability: profitability ? Number(profitability) : undefined,
        investedAt,
        redeemedAt: redeemedAt || undefined,
        status,
        notes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 md:items-center md:justify-center md:p-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl md:max-w-lg md:rounded-[2rem]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">Investimento</p>
            <h2 className="text-2xl font-black text-slate-950">
              {investment ? 'Editar investimento' : 'Novo investimento'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="Ex: Tesouro Selic"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Tipo</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as InvestmentType)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {investmentTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Instituição
            </span>
            <input
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="Ex: Nubank, Rico, XP..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Valor investido
              </span>
              <input
                value={investedAmount || ''}
                onChange={(event) => setInvestedAmount(Number(event.target.value))}
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Valor atual
              </span>
              <input
                value={currentAmount || ''}
                onChange={(event) => setCurrentAmount(Number(event.target.value))}
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Rentabilidade %
              </span>
              <input
                value={profitability || ''}
                onChange={(event) => setProfitability(Number(event.target.value))}
                type="number"
                step="0.01"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Data do investimento
              </span>
              <input
                value={investedAt}
                onChange={(event) => setInvestedAt(event.target.value)}
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                required
              />
            </label>
          </div>

          {investment && (
            <>
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as InvestmentStatus)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="REDEEMED">Resgatado</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Data do resgate
                </span>
                <input
                  value={redeemedAt}
                  onChange={(event) => setRedeemedAt(event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                />
              </label>
            </>
          )}

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Observações
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="Opcional"
            />
          </label>

          <button
            disabled={saving}
            className="rounded-2xl bg-violet-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar investimento'}
          </button>
        </div>
      </form>
    </div>
  );
}
