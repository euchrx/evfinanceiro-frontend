import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  MoreVertical,
  Plus,
  RefreshCcw,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { listAccounts } from '../services/accounts';
import { listCategories } from '../services/categories';
import {
  cancelTransaction,
  createTransaction,
  deleteTransaction,
  listTransactions,
  payTransaction,
  type CreateTransactionPayload,
  type TransactionFilters,
} from '../services/transactions';
import type {
  Category,
  FinancialAccount,
  FinancialTransaction,
  TransactionStatus,
  TransactionType,
} from '../types/finance';

type ConfirmAction =
  | {
      type: 'delete';
      transaction: FinancialTransaction;
    }
  | {
      type: 'pay';
      transaction: FinancialTransaction;
    }
  | {
      type: 'cancel';
      transaction: FinancialTransaction;
    }
  | null;

function money(value: number | string) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function toInputDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  const [dateOnly] = date.split('T');
  const [year, month, day] = dateOnly.split('-');

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return new Date(date).toLocaleDateString('pt-BR');
}

const transactionTypeLabels: Record<TransactionType, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
};

const statusLabels: Record<TransactionStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
};

const today = toInputDate();

export function TransactionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [filters, setFilters] = useState<TransactionFilters>({
    type: '',
    status: '',
  });

  const [form, setForm] = useState<CreateTransactionPayload>({
    description: '',
    type: 'EXPENSE',
    amount: 0,
    transactionDate: today,
    status: 'PAID',
    accountId: '',
    categoryId: '',
    transferAccountId: '',
    notes: '',
  });

  const filteredCategories = useMemo(() => {
    if (form.type === 'TRANSFER') {
      return [];
    }

    return categories.filter((category) => {
      if (form.type === 'INCOME') {
        return category.type === 'INCOME';
      }

      return category.type === 'EXPENSE';
    });
  }, [categories, form.type]);

  async function loadData() {
    setLoading(true);

    try {
      const [transactionsResponse, accountsResponse, categoriesResponse] =
        await Promise.all([
          listTransactions(filters),
          listAccounts(),
          listCategories(),
        ]);

      setTransactions(transactionsResponse.items);
      setAccounts(accountsResponse);
      setCategories(categoriesResponse);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast.error('Não foi possível carregar as movimentações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state = location.state as
      | {
          openCreateModal?: boolean;
          transactionType?: TransactionType;
        }
      | null;

    if (state?.openCreateModal) {
      resetForm(state.transactionType ?? 'EXPENSE');
      setShowForm(true);

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.state, navigate, accounts]);

  function updateForm<K extends keyof CreateTransactionPayload>(
    key: K,
    value: CreateTransactionPayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm(type: TransactionType = 'EXPENSE') {
    setForm({
      description: '',
      type,
      amount: 0,
      transactionDate: today,
      status: 'PAID',
      accountId: accounts[0]?.id ?? '',
      categoryId: '',
      transferAccountId: '',
      notes: '',
    });
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    if (!form.accountId) {
      toast.error('Selecione uma conta.');
      return;
    }

    if (form.type === 'TRANSFER' && !form.transferAccountId) {
      toast.error('Selecione a conta destino.');
      return;
    }

    if (form.type === 'TRANSFER' && form.accountId === form.transferAccountId) {
      toast.error('A conta origem e destino não podem ser iguais.');
      return;
    }

    try {
      setSaving(true);

      const payload: CreateTransactionPayload = {
        description: form.description.trim(),
        type: form.type,
        amount: Number(form.amount),
        transactionDate: form.transactionDate,
        status: form.status,
        accountId: form.accountId,
        categoryId:
          form.type === 'TRANSFER' ? undefined : form.categoryId || undefined,
        transferAccountId:
          form.type === 'TRANSFER'
            ? form.transferAccountId || undefined
            : undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes?.trim() || undefined,
      };

      await createTransaction(payload);

      toast.success('Movimentação criada com sucesso.');

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      toast.error('Não foi possível criar a movimentação.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmSelectedAction() {
    if (!confirmAction) {
      return;
    }

    try {
      setSaving(true);

      if (confirmAction.type === 'pay') {
        await payTransaction(confirmAction.transaction.id);
        toast.success('Movimentação marcada como paga.');
      }

      if (confirmAction.type === 'cancel') {
        await cancelTransaction(confirmAction.transaction.id);
        toast.success('Movimentação cancelada.');
      }

      if (confirmAction.type === 'delete') {
        await deleteTransaction(confirmAction.transaction.id);
        toast.success('Movimentação excluída.');
      }

      setConfirmAction(null);
      setOpenedMenuId(null);

      await loadData();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      toast.error('Não foi possível concluir a ação.');
    } finally {
      setSaving(false);
    }
  }

  function getTransactionIcon(type: TransactionType) {
    if (type === 'INCOME') return ArrowDownLeft;
    if (type === 'EXPENSE') return ArrowUpRight;
    return ArrowRightLeft;
  }

  function getTransactionClasses(type: TransactionType) {
    if (type === 'INCOME') {
      return {
        icon: 'bg-emerald-50 text-emerald-600',
        amount: 'text-emerald-600',
        prefix: '+',
      };
    }

    if (type === 'EXPENSE') {
      return {
        icon: 'bg-red-50 text-red-600',
        amount: 'text-red-600',
        prefix: '-',
      };
    }

    return {
      icon: 'bg-violet-50 text-violet-600',
      amount: 'text-violet-600',
      prefix: '',
    };
  }

  function getConfirmTitle() {
    if (confirmAction?.type === 'pay') return 'Marcar como paga?';
    if (confirmAction?.type === 'cancel') return 'Cancelar movimentação?';
    return 'Excluir movimentação?';
  }

  function getConfirmDescription() {
    if (!confirmAction) return undefined;

    if (confirmAction.type === 'pay') {
      return `A movimentação "${confirmAction.transaction.description}" será marcada como paga.`;
    }

    if (confirmAction.type === 'cancel') {
      return `A movimentação "${confirmAction.transaction.description}" será cancelada.`;
    }

    return `A movimentação "${confirmAction.transaction.description}" será removida. Essa ação não poderá ser desfeita.`;
  }

  function getConfirmLabel() {
    if (confirmAction?.type === 'pay') return 'Marcar paga';
    if (confirmAction?.type === 'cancel') return 'Cancelar';
    return 'Excluir';
  }

  function openCreate(type: TransactionType) {
    resetForm(type);
    setShowForm(true);
  }

  function renderStatus(status: TransactionStatus) {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
          status === 'PAID'
            ? 'bg-emerald-50 text-emerald-700'
            : status === 'CANCELED'
              ? 'bg-slate-100 text-slate-500'
              : 'bg-amber-50 text-amber-700'
        }`}
      >
        {statusLabels[status]}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <section className="rounded-b-[2.5rem] bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 pb-8 pt-7 text-white md:rounded-none md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-violet-100">EvFinanceiro</p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Movimentações
              </h1>

              <p className="mt-2 text-sm text-violet-100">
                Receitas, despesas e transferências.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur md:hidden"
            >
              <Filter size={20} />
            </button>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => openCreate(type)}
                  className="flex min-w-max items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-800 shadow-lg shadow-violet-950/20"
                >
                  <Plus size={17} />
                  Nova {transactionTypeLabels[type]}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5 px-5 py-6 md:px-8">
        <div
          className={`rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm ${
            showFilters ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="grid gap-3 md:grid-cols-5">
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  type: event.target.value as TransactionType | '',
                }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="">Todos os tipos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
              <option value="TRANSFER">Transferências</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as TransactionStatus | '',
                }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="CANCELED">Cancelado</option>
            </select>

            <input
              type="date"
              value={filters.startDate ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            />

            <input
              type="date"
              value={filters.endDate ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            />

            <button
              type="button"
              onClick={loadData}
              className="flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-bold text-white"
            >
              <RefreshCcw size={17} />
              Filtrar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl bg-violet-100"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.length ? (
              transactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type);
                const classes = getTransactionClasses(transaction.type);
                const menuOpen = openedMenuId === transaction.id;

                return (
                  <article
                    key={transaction.id}
                    className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${classes.icon}`}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate font-bold text-slate-950">
                                {transaction.description}
                              </h2>
                              {renderStatus(transaction.status)}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(transaction.transactionDate)}
                              {transaction.account?.name
                                ? ` • ${transaction.account.name}`
                                : ''}
                              {transaction.category?.name
                                ? ` • ${transaction.category.name}`
                                : ''}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-start gap-2">
                            <strong
                              className={`pt-1 text-sm font-black ${classes.amount}`}
                            >
                              {classes.prefix}
                              {money(transaction.amount)}
                            </strong>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenedMenuId(menuOpen ? null : transaction.id)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-500"
                              >
                                <MoreVertical size={18} />
                              </button>

                              {menuOpen && (
                                <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                                  {transaction.status !== 'PAID' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmAction({
                                          type: 'pay',
                                          transaction,
                                        })
                                      }
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                      <CheckCircle2 size={15} />
                                      Marcar como paga
                                    </button>
                                  )}

                                  {transaction.status !== 'CANCELED' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmAction({
                                          type: 'cancel',
                                          transaction,
                                        })
                                      }
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                      <XCircle size={15} />
                                      Cancelar
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmAction({
                                        type: 'delete',
                                        transaction,
                                      })
                                    }
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={15} />
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Nenhuma movimentação encontrada.
              </div>
            )}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 md:items-center md:justify-center md:p-6">
          <form
            onSubmit={handleCreate}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl md:max-w-xl md:rounded-[2rem]"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-600">
                  Nova movimentação
                </p>

                <h2 className="text-2xl font-black text-slate-950">
                  {transactionTypeLabels[form.type]}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        updateForm('type', type);
                        updateForm('categoryId', '');
                        updateForm('transferAccountId', '');
                      }}
                      className={`rounded-2xl px-3 py-3 text-xs font-bold ${
                        form.type === type
                          ? 'bg-violet-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {transactionTypeLabels[type]}
                    </button>
                  ),
                )}
              </div>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Descrição
                </span>

                <input
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  placeholder="Ex: Mercado, salário, transferência..."
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Valor
                </span>

                <input
                  value={form.amount || ''}
                  onChange={(event) => updateForm('amount', Number(event.target.value))}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  placeholder="0,00"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Data
                  </span>

                  <input
                    value={form.transactionDate}
                    onChange={(event) => updateForm('transactionDate', event.target.value)}
                    type="date"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    required
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Status
                  </span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm('status', event.target.value as TransactionStatus)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  >
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Conta origem
                </span>

                <select
                  value={form.accountId}
                  onChange={(event) => updateForm('accountId', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  required
                >
                  <option value="">Selecione</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>

              {form.type === 'TRANSFER' ? (
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Conta destino
                  </span>

                  <select
                    value={form.transferAccountId}
                    onChange={(event) =>
                      updateForm('transferAccountId', event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    required
                  >
                    <option value="">Selecione</option>
                    {accounts
                      .filter((account) => account.id !== form.accountId)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Categoria
                  </span>

                  <select
                    value={form.categoryId}
                    onChange={(event) => updateForm('categoryId', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Sem categoria</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Observações
                </span>

                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  placeholder="Opcional"
                />
              </label>

              <button
                disabled={saving}
                className="rounded-2xl bg-violet-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar movimentação'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={getConfirmTitle()}
        description={getConfirmDescription()}
        confirmLabel={getConfirmLabel()}
        cancelLabel="Voltar"
        loading={saving}
        tone={confirmAction?.type === 'pay' ? 'default' : 'danger'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmSelectedAction}
      />
    </div>
  );
}
