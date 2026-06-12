import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  ReceiptText,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

import { api } from '../api/client';

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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
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

function formatShortDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const datePart = value.slice(0, 10);
  const [, month, day] = datePart.split('-');

  if (!month || !day) {
    return '-';
  }

  return `${day}/${month}`;
}

function getTodayDatePart() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date());
}

function getTransactionDatePart(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function isFutureTransaction(value?: string | null) {
  const transactionDate = getTransactionDatePart(value);

  if (!transactionDate) {
    return false;
  }

  return transactionDate > getTodayDatePart();
}

function getTransactionMeta(type: 'INCOME' | 'EXPENSE' | 'TRANSFER') {
  if (type === 'INCOME') {
    return {
      label: 'Receita',
      icon: ArrowDownLeft,
      amountClass: 'text-emerald-600',
      iconClass: 'bg-emerald-50 text-emerald-600',
      signal: '+',
    };
  }

  if (type === 'EXPENSE') {
    return {
      label: 'Despesa',
      icon: ArrowUpRight,
      amountClass: 'text-red-600',
      iconClass: 'bg-red-50 text-red-600',
      signal: '-',
    };
  }

  return {
    label: 'Transferência',
    icon: ArrowLeftRight,
    amountClass: 'text-blue-700',
    iconClass: 'bg-blue-50 text-blue-700',
    signal: '',
  };
}

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone?: 'income' | 'expense' | 'neutral' | 'warning';
};

function MetricCard({
  title,
  value,
  description,
  icon,
  tone = 'neutral',
}: MetricCardProps) {
  const toneClasses = {
    income: 'bg-emerald-50 text-emerald-600',
    expense: 'bg-red-50 text-red-600',
    neutral: 'bg-blue-50 text-blue-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <strong className="mt-2 block truncate text-xl font-black tracking-tight text-slate-950">
            {value}
          </strong>

          <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            toneClasses[tone],
          )}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

type DashboardAccountCardProps = {
  name: string;
  balance: number;
  showBalance: boolean;
  isMain?: boolean;
};

function DashboardAccountCard({
  name,
  balance,
  showBalance,
  isMain = false,
}: DashboardAccountCardProps) {
  return (
    <article className="min-w-[200px] rounded-[1.4rem] border border-slate-200 bg-white p-4 transition duration-200 hover:border-slate-300">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-blue-700">
          <Landmark size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-black text-slate-950">
            {name}
          </p>

          {isMain ? (
            <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[0.68rem] font-bold text-blue-700">
              Conta principal
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">Saldo</p>

      <strong className="mt-1 block text-lg font-black tracking-tight text-slate-950">
        {showBalance ? money(balance) : hiddenValue()}
      </strong>
    </article>
  );
}

type TransactionRowProps = {
  description: string;
  date: string;
  shortDate: string;
  account?: string;
  category?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  showBalance: boolean;
  future?: boolean;
};

function TransactionRow({
  description,
  date,
  shortDate,
  account,
  category,
  type,
  amount,
  showBalance,
  future = false,
}: TransactionRowProps) {
  const meta = getTransactionMeta(type);
  const Icon = meta.icon;

  return (
    <article
      className={cn(
        'flex items-center gap-3 rounded-[1.25rem] p-3 transition duration-200',
        future ? 'bg-blue-50/70 hover:bg-blue-50' : 'bg-white hover:bg-slate-50',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
          meta.iconClass,
        )}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-black text-slate-950">
            {description || meta.label}
          </h3>

          <span
            className={cn(
              'hidden rounded-full px-2 py-0.5 text-[0.68rem] font-black sm:inline',
              future
                ? 'bg-white text-blue-700'
                : 'bg-slate-100 text-slate-500',
            )}
          >
            {shortDate}
          </span>
        </div>

        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
          {category || meta.label}
          {account ? ` • ${account}` : ''}
          {date ? ` • ${date}` : ''}
        </p>
      </div>

      <strong
        className={cn(
          'shrink-0 text-right text-sm font-black tracking-tight',
          meta.amountClass,
        )}
      >
        {showBalance ? `${meta.signal}${money(Math.abs(amount))}` : hiddenValue()}
      </strong>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pt-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-56 animate-pulse rounded-[2rem] bg-slate-100" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>

        <div className="h-48 animate-pulse rounded-[2rem] bg-slate-100" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-slate-100" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const sortedAccounts = useMemo(() => {
    return [...visibleAccounts].sort(
      (a, b) => Number(b.balance) - Number(a.balance),
    );
  }, [visibleAccounts]);

  const mainAccount = useMemo(() => {
    if (!sortedAccounts.length) {
      return null;
    }

    return sortedAccounts[0];
  }, [sortedAccounts]);

  const futureTransactions = useMemo(() => {
    return (data?.lastTransactions ?? []).filter((transaction) =>
      isFutureTransaction(transaction.transactionDate),
    );
  }, [data?.lastTransactions]);

  const currentTransactions = useMemo(() => {
    return (data?.lastTransactions ?? []).filter(
      (transaction) => !isFutureTransaction(transaction.transactionDate),
    );
  }, [data?.lastTransactions]);

  const resultIsPositive = resultMonth >= 0;
  const projectedIsPositive = projectedBalance >= 0;
  const currentBalanceIsPositive = currentBalance >= 0;

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await api.get<DashboardResponse>('/dashboard');
      setData(response.data);
    } catch {
      setError('Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-950">
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

      <div className="relative mx-auto max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] md:px-8 md:pb-10 md:pt-6">
        <section style={{ animation: 'evFadeIn 220ms ease-out both' }}>
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
                Olá, Christian
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                aria-label="Atualizar dashboard"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300 disabled:pointer-events-none disabled:opacity-60"
              >
                <RefreshCcw
                  size={18}
                  className={refreshing ? 'animate-spin' : ''}
                />
              </button>

              <button
                type="button"
                onClick={() => setShowBalance((value) => !value)}
                aria-label={showBalance ? 'Ocultar valores' : 'Mostrar valores'}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300"
              >
                {showBalance ? <Eye size={19} /> : <EyeOff size={19} />}
              </button>
            </div>
          </header>

          {error ? (
            <div className="mt-5 flex items-center gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 p-4 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          ) : null}

          <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
            <div className="grid grid-cols-[6px_1fr]">
              <div className="bg-blue-700" />

              <div className="p-5 md:p-7">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500">
                      Saldo disponível
                    </p>

                    <strong
                      className={cn(
                        'mt-2 block text-4xl font-black tracking-[-0.045em] md:text-6xl',
                        currentBalanceIsPositive
                          ? 'text-slate-950'
                          : 'text-red-600',
                      )}
                    >
                      {showBalance ? money(currentBalance) : hiddenValue()}
                    </strong>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black',
                          resultIsPositive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700',
                        )}
                      >
                        {resultIsPositive ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                        {showBalance ? money(resultMonth) : hiddenValue()}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                        <CalendarClock size={14} />
                        {showBalance ? money(projectedBalance) : hiddenValue()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <main
          className="mt-5 space-y-5"
          style={{ animation: 'evFadeIn 260ms ease-out 80ms both' }}
        >
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              title="Receitas"
              value={showBalance ? money(incomeMonth) : hiddenValue()}
              description="Entradas do mês"
              icon={<ArrowDownLeft size={20} />}
              tone="income"
            />

            <MetricCard
              title="Despesas"
              value={showBalance ? money(expenseMonth) : hiddenValue()}
              description="Saídas do mês"
              icon={<ArrowUpRight size={20} />}
              tone="expense"
            />

            <MetricCard
              title="Saldo futuro"
              value={showBalance ? money(projectedBalance) : hiddenValue()}
              description={
                projectedIsPositive ? 'Projeção positiva' : 'Projeção negativa'
              }
              icon={<CalendarClock size={20} />}
              tone={projectedIsPositive ? 'neutral' : 'warning'}
            />
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Contas
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <WalletCards size={20} />
              </div>
            </div>

            {sortedAccounts.length ? (
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {sortedAccounts.map((account) => (
                  <DashboardAccountCard
                    key={account.id}
                    name={account.name}
                    balance={Number(account.balance)}
                    showBalance={showBalance}
                    isMain={account.id === mainAccount?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-medium text-slate-500">
                Nenhuma conta com saldo.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Movimentações
                </h2>
              </div>

              <Link
                to="/transactions"
                className="flex shrink-0 items-center gap-1 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition duration-200 hover:bg-slate-200"
              >
                Ver tudo
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              {futureTransactions.length ? (
                <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-3">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <CalendarClock size={16} className="text-blue-700" />

                    <p className="text-sm font-black text-blue-700">
                      Lançamentos futuros
                    </p>
                  </div>

                  <div className="space-y-1">
                    {futureTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        description={transaction.description}
                        date={formatDateBR(transaction.transactionDate)}
                        shortDate={formatShortDate(transaction.transactionDate)}
                        account={transaction.account?.name}
                        category={transaction.category?.name}
                        type={transaction.type}
                        amount={Number(transaction.amount)}
                        showBalance={showBalance}
                        future
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {currentTransactions.length ? (
                <div className="space-y-1">
                  {currentTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      description={transaction.description}
                      date={formatDateBR(transaction.transactionDate)}
                      shortDate={formatShortDate(transaction.transactionDate)}
                      account={transaction.account?.name}
                      category={transaction.category?.name}
                      type={transaction.type}
                      amount={Number(transaction.amount)}
                      showBalance={showBalance}
                    />
                  ))}
                </div>
              ) : null}

              {!futureTransactions.length && !currentTransactions.length ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <ReceiptText size={21} />
                  </div>

                  <strong className="mt-4 block text-sm font-black text-slate-950">
                    Nenhuma movimentação encontrada
                  </strong>
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}