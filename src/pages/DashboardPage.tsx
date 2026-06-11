import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
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

  const visibleAccounts = useMemo(() => {
    return (data?.accounts ?? []).filter(
      (account) => Number(account.balance) !== 0,
    );
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
        <div className="h-44 animate-pulse rounded-b-[2.5rem] rounded-t-3xl bg-violet-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="rounded-b-[2.5rem] bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 pb-8 pt-7 text-white md:rounded-none md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-100">Olá, Christian 👋</p>
              <h1 className="text-xl font-black">Início</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur disabled:opacity-60"
              >
                <RefreshCcw
                  size={19}
                  className={refreshing ? 'animate-spin' : ''}
                />
              </button>

              <button
                type="button"
                onClick={() => setShowBalance((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
              >
                {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <p className="mb-2 text-sm font-medium text-violet-100">Saldo total</p>

          <strong className="block text-4xl font-black tracking-tight">
            {showBalance ? money(data?.currentBalance ?? 0) : hiddenValue()}
          </strong>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-5 py-6 md:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Receitas do mês"
            value={showBalance ? money(data?.incomeMonth ?? 0) : hiddenValue()}
            icon={<ArrowDownLeft size={20} />}
            tone="success"
          />

          <StatCard
            title="Despesas do mês"
            value={showBalance ? money(data?.expenseMonth ?? 0) : hiddenValue()}
            icon={<ArrowUpRight size={20} />}
            tone="danger"
          />

          <StatCard
            title="Saldo em contas"
            value={showBalance ? money(data?.currentBalance ?? 0) : hiddenValue()}
            icon={<WalletCards size={20} />}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Saldos por conta</h2>
          </div>

          {visibleAccounts.length ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {visibleAccounts.map((account) => (
                <div
                  key={account.id}
                  className="min-w-[170px] rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-600">
                    {account.name}
                  </p>

                  <strong className="mt-2 block text-lg text-slate-950">
                    {showBalance ? money(Number(account.balance)) : hiddenValue()}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Nenhuma conta com saldo no momento.
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">
              Últimas movimentações
            </h2>
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
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Nenhuma movimentação encontrada.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}