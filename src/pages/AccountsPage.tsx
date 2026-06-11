import { useEffect, useState } from 'react';
import { Plus, WalletCards } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AccountCard } from '../components/AccountCard';
import { AccountFormModal } from '../components/AccountFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  type CreateAccountPayload,
} from '../services/accounts';
import type { FinancialAccount } from '../types/finance';

export function AccountsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedAccount, setSelectedAccount] =
    useState<FinancialAccount | null>(null);

  const [accountToDelete, setAccountToDelete] =
    useState<FinancialAccount | null>(null);

  const [showModal, setShowModal] = useState(false);

  async function loadAccounts() {
    setLoading(true);

    try {
      const response = await listAccounts();
      setAccounts(response);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Não foi possível carregar as contas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;

    if (state?.openCreateModal) {
      setSelectedAccount(null);
      setShowModal(true);

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.state, navigate]);

  function handleNew() {
    setSelectedAccount(null);
    setShowModal(true);
  }

  function handleEdit(account: FinancialAccount) {
    setSelectedAccount(account);
    setShowModal(true);
  }

  function handleDelete(account: FinancialAccount) {
    setAccountToDelete(account);
  }

  async function confirmDelete() {
    if (!accountToDelete) {
      return;
    }

    try {
      setSaving(true);

      await deleteAccount(accountToDelete.id);

      toast.success('Conta excluída com sucesso.');

      setAccountToDelete(null);

      await loadAccounts();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Não foi possível excluir a conta.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(payload: CreateAccountPayload & { active?: boolean }) {
    try {
      setSaving(true);

      const normalizedPayload = {
        ...payload,
        initialBalance: Number(payload.initialBalance),
      };

      if (selectedAccount) {
        await updateAccount(selectedAccount.id, normalizedPayload);
        toast.success('Conta atualizada com sucesso.');
      } else {
        await createAccount({
          name: normalizedPayload.name,
          type: normalizedPayload.type,
          initialBalance: Number(normalizedPayload.initialBalance),
        });

        toast.success('Conta criada com sucesso.');
      }

      setShowModal(false);
      setSelectedAccount(null);

      await loadAccounts();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Não foi possível salvar a conta.');
    } finally {
      setSaving(false);
    }
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
              disabled={saving}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-800 shadow-lg shadow-violet-950/20 disabled:opacity-60"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-4 px-5 py-6 md:px-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[2rem] bg-violet-100"
            />
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

            <h2 className="font-black text-slate-950">
              Nenhuma conta cadastrada
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Cadastre sua primeira conta para começar.
            </p>

            <button
              type="button"
              onClick={handleNew}
              disabled={saving}
              className="mt-5 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60"
            >
              Criar conta
            </button>
          </div>
        )}
      </section>

      {showModal && (
        <AccountFormModal
          account={selectedAccount}
          onClose={() => {
            setShowModal(false);
            setSelectedAccount(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={!!accountToDelete}
        title="Excluir conta?"
        description={
          accountToDelete
            ? `A conta "${accountToDelete.name}" será removida. Essa ação não poderá ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={saving}
        tone="danger"
        onCancel={() => setAccountToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}