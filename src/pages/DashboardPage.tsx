import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCcw,
  WalletCards,
} from 'lucide-react';

import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { TransactionCard } from '../components/TransactionCard';

type DashboardResponse = {
  currentBalance: number;
  incomeMonth: number;
  expenseMonth: number;
  resultMonth: number;

  futureIncomeMonth?: number;
  futureExpenseMonth?: number;
  futureBalancePreview?: number;

  accounts: {
    id: string;
    name: string;
    balance: number;
  }[];

  lastTransactions: {
    id: string;
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: string | number;
    transactionDate: string;
    account?: {
      name: string;
    } | null;
    category?: {
      name: string;
    } | null;
  }[];
};

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  return Number(value);
}

function money(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function hiddenValue() {
  return 'R$ •••••';
}

function formatDateBR(value?: string | null) {
  if (!value) {
    return '-';
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return '-';
  }

  return `${day}/${month}/${year}`;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const currentBalance = toNumber(data?.currentBalance);
  const incomeMonth = toNumber(data?.incomeMonth);
  const expenseMonth = toNumber(data?.expenseMonth);
  const resultMonth = toNumber(data?.resultMonth);

  const futureIncomeMonth = toNumber(data?.futureIncomeMonth);
  const futureExpenseMonth = toNumber(data?.futureExpenseMonth);

  const projectedBalance =
    data?.futureBalancePreview !== undefined
      ? toNumber(data.futureBalancePreview)
      : currentBalance + futureIncomeMonth - futureExpenseMonth;

  const visibleAccounts = useMemo(() => {
    return (data?.accounts ?? []).filter(
      (account) => Number(account.balance) !== 0,
    );
  }, [data?.accounts]);

  const mainAccount = useMemo(() => {
    const accounts = data?.accounts ?? [];

    if (!accounts.length) {
      return null;
    }

    return [...accounts].sort(
      (a, b) => Number(b.balance) - Number(a.balance),
    )[0];
  }, [data?.accounts]);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get<DashboardResponse>('/dashboard');
      setData(response.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="h-56 animate-pulse rounded-[2rem] bg-violet-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-3xl bg-white" />
            <div className="h-28 animate-pulse rounded-3xl bg-white" />
            <div className="h-28 animate-pulse rounded-3xl bg-white" />
          </div>

          <div className="h-40 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <section className="px-4 pt-4 md:px-8 md:pt-6">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-800 text-white shadow-xl shadow-violet-950/20">
            <div className="relative px-5 pb-6 pt-5 md:px-8 md:pb-8 md:pt-7">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-violet-100">
                    Olá, Christian 👋
                  </p>

                  <h1 className="mt-1 text-2xl font-black tracking-tight">
                    Seu financeiro
                  </h1>

                  <p className="mt-1 text-sm text-violet-100">
                    Resumo atualizado das suas contas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadDashboard(true)}
                    disabled={refreshing}
                    aria-label="Atualizar dashboard"
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
                  >
                    <RefreshCcw
                      size={19}
                      className={refreshing ? 'animate-spin' : ''}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBalance((value) => !value)}
                    aria-label={showBalance ? 'Ocultar valores' : 'Mostrar valores'}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              <div className="relative mt-8">
                <p className="text-sm font-semibold text-violet-100">
                  Saldo disponível
                </p>

                <strong className="mt-2 block text-4xl font-black tracking-tight md:text-5xl">
                  {showBalance ? money(currentBalance) : hiddenValue()}
                </strong>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/12 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-100">
                      Resultado do mês
                    </p>

                    <strong
                      className={`mt-1 block text-lg font-black ${
                        resultMonth >= 0 ? 'text-emerald-200' : 'text-red-200'
                      }`}
                    >
                      {showBalance ? money(resultMonth) : hiddenValue()}
                    </strong>
                  </div>

                  <div className="rounded-3xl bg-white/12 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-100">
                      Saldo após programados
                    </p>

                    <strong
                      className={`mt-1 block text-lg font-black ${
                        projectedBalance >= 0 ? 'text-white' : 'text-red-200'
                      }`}
                    >
                      {showBalance ? money(projectedBalance) : hiddenValue()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Receitas do mês"
            value={showBalance ? money(incomeMonth) : hiddenValue()}
            icon={<ArrowDownLeft size={20} />}
            tone="success"
          />

          <StatCard
            title="Despesas do mês"
            value={showBalance ? money(expenseMonth) : hiddenValue()}
            icon={<ArrowUpRight size={20} />}
            tone="danger"
          />

          <StatCard
            title="Saldo após gastos futuros"
            value={showBalance ? money(projectedBalance) : hiddenValue()}
            icon={<CalendarClock size={20} />}
            tone={projectedBalance < 0 ? 'danger' : undefined}
          />
        </div>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Contas e saldo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Acompanhe onde seu dinheiro está distribuído.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <WalletCards size={21} />
            </div>
          </div>

          {mainAccount ? (
            <div className="mb-4 rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Principal conta
              </p>

              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <strong className="block text-base font-black text-slate-950">
                    {mainAccount.name}
                  </strong>

                  <p className="mt-1 text-sm text-slate-500">
                    Maior saldo registrado
                  </p>
                </div>

                <strong className="text-right text-lg font-black text-slate-950">
                  {showBalance
                    ? money(Number(mainAccount.balance))
                    : hiddenValue()}
                </strong>
              </div>
            </div>
          ) : null}

          {visibleAccounts.length ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {visibleAccounts.map((account) => (
                <div
                  key={account.id}
                  className="min-w-[180px] rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <p className="line-clamp-1 text-sm font-bold text-slate-700">
                    {account.name}
                  </p>

                  <strong className="mt-2 block text-lg font-black text-slate-950">
                    {showBalance
                      ? money(Number(account.balance))
                      : hiddenValue()}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhuma conta com saldo no momento.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Últimas movimentações
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Seus lançamentos mais recentes.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              Ver tudo
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {data?.lastTransactions.length ? (
              data.lastTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  description={transaction.description}
                  date={formatDateBR(transaction.transactionDate)}
                  account={transaction.account?.name}
                  category={transaction.category?.name}
                  type={transaction.type}
                  amount={Number(transaction.amount)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Nenhuma movimentação encontrada.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}