import { useEffect, useState } from 'react';
import { Plus, WalletCards } from 'lucide-react';

import { AccountCard } from '../components/AccountCard';
import { AccountFormModal } from '../components/AccountFormModal';
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  type CreateAccountPayload,
} from '../services/accounts';
import type { FinancialAccount } from '../types/finance';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function loadAccounts() {
    setLoading(true);

    try {
      const response = await listAccounts();
      setAccounts(response);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function handleNew() {
    setSelectedAccount(null);
    setShowModal(true);
  }

  function handleEdit(account: FinancialAccount) {
    setSelectedAccount(account);
    setShowModal(true);
  }

  async function handleDelete(account: FinancialAccount) {
    if (!confirm(`Deseja excluir a conta ${account.name}?`)) {
      return;
    }

    await deleteAccount(account.id);
    await loadAccounts();
  }

  async function handleSubmit(payload: CreateAccountPayload & { active?: boolean }) {
    if (selectedAccount) {
      await updateAccount(selectedAccount.id, payload);
    } else {
      await createAccount(payload);
    }

    setShowModal(false);
    await loadAccounts();
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <section className="rounded-b-[2.5rem] bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 pb-8 pt-7 text-white md:rounded-none md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-violet-100">EvFinanceiro</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Contas</h1>
              <p className="mt-2 text-sm text-violet-100">
                Bancos, carteiras, poupanças e cartões.
              </p>
            </div>

            <button
              type="button"
              onClick={handleNew}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-800 shadow-lg shadow-violet-950/20"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-4 px-5 py-6 md:px-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[2rem] bg-violet-100" />
          ))
        ) : accounts.length ? (
          accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
              <WalletCards size={26} />
            </div>
            <h2 className="font-black text-slate-950">Nenhuma conta cadastrada</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre sua primeira conta para começar.
            </p>
          </div>
        )}
      </section>

      {showModal && (
        <AccountFormModal
          account={selectedAccount}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
