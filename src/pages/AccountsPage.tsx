import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Filter,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

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

type AccountWithOptionalFields = FinancialAccount & {
  initialBalance?: number | string | null;
  currentBalance?: number | string | null;
  balance?: number | string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type DetailedFilters = {
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | '';
  minBalance: string;
  maxBalance: string;
};

type AccountsInsightData = {
  totalBalance: number;
  activeBalance: number;
  inactiveBalance: number;
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  mainAccount: FinancialAccount | null;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function money(value: number | string) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    : 'R$ 0,00';
}

function getAccountBalance(account: FinancialAccount) {
  const typedAccount = account as AccountWithOptionalFields;

  return Number(
    typedAccount.currentBalance ??
    typedAccount.balance ??
    typedAccount.initialBalance ??
    0,
  );
}

function isAccountActive(account: FinancialAccount) {
  const typedAccount = account as AccountWithOptionalFields;

  return typedAccount.active !== false;
}

function getAccountTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    CHECKING: 'Conta corrente',
    SAVINGS: 'Poupança',
    WALLET: 'Carteira',
    CREDIT_CARD: 'Cartão de crédito',
    INVESTMENT: 'Investimento',
    CASH: 'Dinheiro',
  };

  if (!type) {
    return 'Conta';
  }

  return labels[type] ?? type;
}

function getAccountTone(type?: string | null) {
  if (type === 'CREDIT_CARD') {
    return {
      icon: CreditCard,
      iconClass: 'bg-amber-50 text-amber-700',
      barClass: 'bg-amber-500',
    };
  }

  if (type === 'WALLET' || type === 'CASH') {
    return {
      icon: WalletCards,
      iconClass: 'bg-emerald-50 text-emerald-700',
      barClass: 'bg-emerald-500',
    };
  }

  return {
    icon: Building2,
    iconClass: 'bg-blue-50 text-blue-700',
    barClass: 'bg-blue-700',
  };
}

function sortAccounts(accounts: FinancialAccount[]) {
  return [...accounts].sort((a, b) => {
    const aActive = isAccountActive(a);
    const bActive = isAccountActive(b);

    if (aActive !== bActive) {
      return aActive ? -1 : 1;
    }

    const aBalance = getAccountBalance(a);
    const bBalance = getAccountBalance(b);

    if (aBalance !== bBalance) {
      return bBalance - aBalance;
    }

    return String(a.name).localeCompare(String(b.name));
  });
}

function applyDetailedFilters(
  accounts: FinancialAccount[],
  detailedFilters: DetailedFilters,
) {
  return accounts.filter((account) => {
    const typedAccount = account as AccountWithOptionalFields;
    const balance = getAccountBalance(account);
    const active = isAccountActive(account);

    if (detailedFilters.type && typedAccount.type !== detailedFilters.type) {
      return false;
    }

    if (detailedFilters.status === 'ACTIVE' && !active) {
      return false;
    }

    if (detailedFilters.status === 'INACTIVE' && active) {
      return false;
    }

    const minBalance = detailedFilters.minBalance
      ? Number(detailedFilters.minBalance)
      : null;

    const maxBalance = detailedFilters.maxBalance
      ? Number(detailedFilters.maxBalance)
      : null;

    if (
      minBalance !== null &&
      Number.isFinite(minBalance) &&
      balance < minBalance
    ) {
      return false;
    }

    if (
      maxBalance !== null &&
      Number.isFinite(maxBalance) &&
      balance > maxBalance
    ) {
      return false;
    }

    return true;
  });
}

function getInsightMessage(insight: AccountsInsightData) {
  if (!insight.totalCount) {
    return 'Cadastre suas contas para acompanhar sua organização financeira.';
  }

  if (insight.activeCount === 1) {
    return 'Você possui uma conta ativa. Centralizar os lançamentos nela facilita a leitura do saldo.';
  }

  if (insight.inactiveCount > 0) {
    return 'Existem contas inativas na sua base. Revise se elas ainda precisam aparecer na sua organização.';
  }

  return 'Suas contas estão ativas e organizadas para acompanhar o saldo disponível.';
}

function AccountStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-black',
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
      )}
    >
      {active ? 'Ativa' : 'Inativa'}
    </span>
  );
}

function AccountsInsightCard({ insight }: { insight: AccountsInsightData }) {
  return (
    <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.055)]">
      <div className="grid grid-cols-[5px_1fr]">
        <div className="bg-blue-700" />

        <div className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">
                Análise das contas
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                Organização financeira
              </h2>

              <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
                {getInsightMessage(insight)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <ShieldCheck size={14} />
                  {insight.activeCount} contas ativas
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                  <WalletCards size={14} />
                  {insight.totalCount} contas no total
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Saldo ativo
                </p>

                <strong className="mt-2 block text-2xl font-black tracking-tight text-slate-950">
                  {money(insight.activeBalance)}
                </strong>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Saldo inativo
                </p>

                <strong className="mt-2 block text-2xl font-black tracking-tight text-slate-950">
                  {money(insight.inactiveBalance)}
                </strong>
              </div>

              <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-blue-700">
                  Conta principal
                </p>

                <strong className="mt-2 block truncate text-lg font-black text-blue-700">
                  {insight.mainAccount?.name ?? 'Nenhuma conta cadastrada'}
                </strong>

                <p className="mt-1 text-xs font-bold text-blue-700/70">
                  {insight.mainAccount
                    ? money(getAccountBalance(insight.mainAccount))
                    : 'Sem saldo para exibir'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type AccountRowProps = {
  account: FinancialAccount;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function AccountRow({
  account,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: AccountRowProps) {
  const typedAccount = account as AccountWithOptionalFields;
  const active = isAccountActive(account);
  const balance = getAccountBalance(account);
  const tone = getAccountTone(typedAccount.type);
  const Icon = tone.icon;

  return (
    <article className="group relative overflow-visible rounded-[1.55rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:border-slate-300">
      <div
        className={cn(
          'absolute bottom-0 left-0 top-0 w-1 rounded-l-[1.55rem]',
          active ? tone.barClass : 'bg-slate-300',
        )}
      />

      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            active ? tone.iconClass : 'bg-slate-100 text-slate-400',
          )}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-black text-slate-950">
                  {account.name}
                </h3>

                <AccountStatusBadge active={active} />
              </div>

              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {getAccountTypeLabel(typedAccount.type)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                  Saldo inicial {money(typedAccount.initialBalance ?? 0)}
                </span>

                {balance < 0 ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">
                    Saldo negativo
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <div className="pt-1 text-right">
                <strong
                  className={cn(
                    'block text-sm font-black',
                    balance >= 0 ? 'text-slate-950' : 'text-red-600',
                  )}
                >
                  {money(balance)}
                </strong>

                <p className="mt-1 text-xs font-black text-slate-400">
                  Saldo atual
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Abrir ações"
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-11 z-30 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <CheckCircle2 size={15} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={onDelete}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {!active ? (
            <p className="mt-3 line-clamp-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              Esta conta está inativa e pode não participar dos fluxos principais.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyAccounts({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <WalletCards size={24} />
      </div>

      <strong className="mt-4 block text-sm font-black text-slate-950">
        Nenhuma conta encontrada
      </strong>

      <p className="mt-1 text-sm font-medium text-slate-500">
        Ajuste os filtros ou cadastre sua primeira conta pelo botão flutuante.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
      >
        Cadastrar conta
      </button>
    </div>
  );
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  const [detailedFilters, setDetailedFilters] = useState<DetailedFilters>({
    type: '',
    status: '',
    minBalance: '',
    maxBalance: '',
  });

  const sortedAccounts = useMemo(() => {
    return sortAccounts(accounts);
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return applyDetailedFilters(sortedAccounts, detailedFilters);
  }, [detailedFilters, sortedAccounts]);

  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(
        accounts
          .map((account) => (account as AccountWithOptionalFields).type)
          .filter(
            (
              type,
            ): type is NonNullable<AccountWithOptionalFields['type']> =>
              Boolean(type),
          ),
      ),
    ).sort();
  }, [accounts]);

  const summary = useMemo<AccountsInsightData>(() => {
    const activeAccounts = filteredAccounts.filter((account) =>
      isAccountActive(account),
    );

    const inactiveAccounts = filteredAccounts.filter(
      (account) => !isAccountActive(account),
    );

    const activeBalance = activeAccounts.reduce(
      (sum, account) => sum + getAccountBalance(account),
      0,
    );

    const inactiveBalance = inactiveAccounts.reduce(
      (sum, account) => sum + getAccountBalance(account),
      0,
    );

    const totalBalance = activeBalance + inactiveBalance;

    const mainAccount =
      [...activeAccounts].sort(
        (a, b) => getAccountBalance(b) - getAccountBalance(a),
      )[0] ?? null;

    return {
      totalBalance,
      activeBalance,
      inactiveBalance,
      activeCount: activeAccounts.length,
      inactiveCount: inactiveAccounts.length,
      totalCount: filteredAccounts.length,
      mainAccount,
    };
  }, [filteredAccounts]);

  const hasActiveFilters =
    Boolean(detailedFilters.type) ||
    Boolean(detailedFilters.status) ||
    Boolean(detailedFilters.minBalance) ||
    Boolean(detailedFilters.maxBalance);

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

  function updateDetailedFilter<K extends keyof DetailedFilters>(
    key: K,
    value: DetailedFilters[K],
  ) {
    setDetailedFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setDetailedFilters({
      type: '',
      status: '',
      minBalance: '',
      maxBalance: '',
    });
  }

  function handleNew() {
    setSelectedAccount(null);
    setShowModal(true);
  }

  function handleEdit(account: FinancialAccount) {
    setSelectedAccount(account);
    setShowModal(true);
    setOpenedMenuId(null);
  }

  function handleDelete(account: FinancialAccount) {
    setAccountToDelete(account);
    setOpenedMenuId(null);
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
    <div className="min-h-screen bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] text-slate-950 md:pb-10">
      <style>
        {`
          @keyframes evFadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <main
        className="mx-auto max-w-6xl px-4 pt-[calc(1rem+env(safe-area-inset-top))] md:px-8 md:pt-6"
        style={{ animation: 'evFadeIn 220ms ease-out both' }}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
              Contas
            </h1>
          </div>

          <button
            type="button"
            onClick={loadAccounts}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300 disabled:pointer-events-none disabled:opacity-60"
            aria-label="Atualizar contas"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="grid grid-cols-[6px_1fr]">
            <div className="bg-blue-700" />

            <div className="p-5 md:p-7">
              <div className="max-w-3xl">
                <p className="text-base font-bold text-slate-500 md:text-lg">
                  Saldo das contas
                </p>

                <strong
                  className={cn(
                    'mt-2 block text-4xl font-black tracking-[-0.045em] md:text-6xl',
                    summary.totalBalance >= 0 ? 'text-slate-950' : 'text-red-600',
                  )}
                >
                  {money(summary.totalBalance)}
                </strong>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                    <ShieldCheck size={14} />
                    {summary.activeCount} contas ativas
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    <WalletCards size={14} />
                    {filteredAccounts.length} contas encontradas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AccountsInsightCard insight={summary} />

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Minhas contas
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {filteredAccounts.length} contas encontradas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition',
                showFilters
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              <Filter size={17} />
              Filtrar
            </button>
          </div>

          {showFilters ? (
            <div className="mb-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Tipo
                  </span>

                  <select
                    value={detailedFilters.type}
                    onChange={(event) =>
                      updateDetailedFilter('type', event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todos os tipos</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {getAccountTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Status
                  </span>

                  <select
                    value={detailedFilters.status}
                    onChange={(event) =>
                      updateDetailedFilter(
                        'status',
                        event.target.value as DetailedFilters['status'],
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todos os status</option>
                    <option value="ACTIVE">Ativas</option>
                    <option value="INACTIVE">Inativas</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Saldo mínimo
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    value={detailedFilters.minBalance}
                    onChange={(event) =>
                      updateDetailedFilter('minBalance', event.target.value)
                    }
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Saldo máximo
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    value={detailedFilters.maxBalance}
                    onChange={(event) =>
                      updateDetailedFilter('maxBalance', event.target.value)
                    }
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Limpar filtros
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-[1.5rem] bg-slate-100"
                />
              ))}
            </div>
          ) : filteredAccounts.length ? (
            <div className="space-y-3">
              {filteredAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  menuOpen={openedMenuId === account.id}
                  onToggleMenu={() =>
                    setOpenedMenuId(
                      openedMenuId === account.id ? null : account.id,
                    )
                  }
                  onEdit={() => handleEdit(account)}
                  onDelete={() => handleDelete(account)}
                />
              ))}
            </div>
          ) : (
            <EmptyAccounts onCreate={handleNew} />
          )}
        </section>
      </main>

      {showModal ? (
        <AccountFormModal
          account={selectedAccount}
          onClose={() => {
            setShowModal(false);
            setSelectedAccount(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

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