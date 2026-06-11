import { type FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type { AccountType, FinancialAccount } from '../types/finance';
import type { CreateAccountPayload } from '../services/accounts';

type AccountFormModalProps = {
  account?: FinancialAccount | null;
  onClose: () => void;
  onSubmit: (payload: CreateAccountPayload & { active?: boolean }) => Promise<void>;
};

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Conta corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
];

export function AccountFormModal({ account, onClose, onSubmit }: AccountFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [initialBalance, setInitialBalance] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setInitialBalance(Number(account.initialBalance));
      setActive(account.active);
    }
  }, [account]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      await onSubmit({
        name,
        type,
        initialBalance: Number(initialBalance),
        active,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 md:items-center md:justify-center md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl md:max-w-lg md:rounded-[2rem]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">Conta</p>
            <h2 className="text-2xl font-black text-slate-950">
              {account ? 'Editar conta' : 'Nova conta'}
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
              placeholder="Ex: Nubank"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Tipo</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as AccountType)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {accountTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Saldo inicial
            </span>
            <input
              value={initialBalance}
              onChange={(event) => setInitialBalance(Number(event.target.value))}
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              required
            />
          </label>

          {account && (
            <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-700">Conta ativa</span>
              <input
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                type="checkbox"
                className="h-5 w-5 accent-violet-700"
              />
            </label>
          )}

          <button
            disabled={saving}
            className="rounded-2xl bg-violet-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar conta'}
          </button>
        </div>
      </form>
    </div>
  );
}
