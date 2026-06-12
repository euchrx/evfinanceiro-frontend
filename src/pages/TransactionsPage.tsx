import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Clock3,
  FileUp,
  Filter,
  Loader2,
  MoreHorizontal,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { api } from '../api/client';
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

type ProofUploadStatus = 'CREATED' | 'NEEDS_REVIEW' | 'DUPLICATE';

type ProofUploadResult = {
  status: ProofUploadStatus;
  message: string;
  parsed: {
    rawText?: string;
    amount: number | null;
    transactionDate: string | null;
    payerName: string | null;
    recipientName: string | null;
    bankName: string | null;
    pixKey: string | null;
    endToEndId: string | null;
    confidence: number;
    warnings: string[];
  };
  transaction?: FinancialTransaction | null;
};

type ProofFormState = {
  type: TransactionType;
  accountId: string;
  categoryId: string;
};

type SortableFinancialTransaction = FinancialTransaction & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

type MonthlyComparisonData = {
  currentLabel: string;
  previousLabel: string;
  currentIncome: number;
  currentExpense: number;
  currentPending: number;
  currentResult: number;
  currentCount: number;
  previousIncome: number;
  previousExpense: number;
  previousPending: number;
  previousResult: number;
  previousCount: number;
};

type DetailedFilters = {
  accountId: string;
  categoryId: string;
  minAmount: string;
  maxAmount: string;
};

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

const proofStatusLabels: Record<ProofUploadStatus, string> = {
  CREATED: 'Movimentação criada',
  NEEDS_REVIEW: 'Precisa de conferência',
  DUPLICATE: 'Possível duplicidade',
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

function toInputDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const today = toInputDate();

function toInputDateFromApi(value?: string | null) {
  if (!value) {
    return today;
  }

  const [dateOnly] = value.split('T');
  const [year, month, day] = dateOnly.split('-');

  if (!year || !month || !day) {
    return today;
  }

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

function formatOptionalDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return formatDate(date);
}

function getDateKey(date: string) {
  const [dateOnly] = date.split('T');

  return dateOnly || date;
}

function getDatePart(value: string) {
  return value.split('T')[0] || value;
}

function parseDatePart(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function formatDatePart(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function diffDays(startDate: string, endDate: string) {
  const start = parseDatePart(startDate).getTime();
  const end = parseDatePart(endDate).getTime();

  const difference = Math.round((end - start) / 86_400_000);

  return Math.max(difference, 0);
}

function isBetweenDates(date: string, startDate: string, endDate: string) {
  const current = getDatePart(date);

  return current >= startDate && current <= endDate;
}

function getMonthKey(value: string) {
  return getDatePart(value).slice(0, 7);
}

function getCurrentMonthKey() {
  return today.slice(0, 7);
}

function getPreviousMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);

  const previousYear = date.getFullYear();
  const previousMonth = String(date.getMonth() + 1).padStart(2, '0');

  return `${previousYear}-${previousMonth}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function getSortableDate(transaction: SortableFinancialTransaction) {
  const referenceDate =
    transaction.createdAt ?? transaction.updatedAt ?? transaction.transactionDate;

  const date = new Date(referenceDate).getTime();

  if (Number.isNaN(date)) {
    return 0;
  }

  return date;
}

function sortNewestFirst(transactions: FinancialTransaction[]) {
  return [...transactions].sort((a, b) => {
    const firstDate = getSortableDate(a as SortableFinancialTransaction);
    const secondDate = getSortableDate(b as SortableFinancialTransaction);

    if (firstDate !== secondDate) {
      return secondDate - firstDate;
    }

    return String(b.id).localeCompare(String(a.id));
  });
}

function calculatePeriodTotals(transactions: FinancialTransaction[]) {
  return transactions
    .filter((transaction) => transaction.status !== 'CANCELED')
    .reduce(
      (totals, transaction) => {
        const amount = Number(transaction.amount);

        if (transaction.type === 'INCOME') {
          totals.income += amount;
        }

        if (transaction.type === 'EXPENSE') {
          totals.expense += amount;
        }

        if (transaction.status === 'PENDING') {
          totals.pending += amount;
        }

        totals.count += 1;

        return totals;
      },
      {
        income: 0,
        expense: 0,
        pending: 0,
        count: 0,
      },
    );
}

function getResultLabel(value: number) {
  if (value > 0) {
    return 'Resultado positivo';
  }

  if (value < 0) {
    return 'Resultado negativo';
  }

  return 'Resultado zerado';
}

function getVariationLabel(value: number) {
  if (value > 0) {
    return 'melhor que o período anterior';
  }

  if (value < 0) {
    return 'abaixo do período anterior';
  }

  return 'igual ao período anterior';
}

function getComparisonInsight({
  resultDifference,
  expenseDifference,
}: {
  resultDifference: number;
  expenseDifference: number;
}) {
  if (resultDifference > 0 && expenseDifference <= 0) {
    return 'Seu resultado melhorou e as despesas ficaram controladas.';
  }

  if (resultDifference > 0 && expenseDifference > 0) {
    return 'Seu resultado melhorou, mas as despesas também subiram.';
  }

  if (resultDifference < 0 && expenseDifference > 0) {
    return 'Atenção: o resultado caiu e as despesas aumentaram.';
  }

  if (resultDifference < 0) {
    return 'O resultado ficou abaixo do período anterior.';
  }

  return 'O período está equilibrado em relação ao anterior.';
}

function applyDetailedFilters(
  transactions: FinancialTransaction[],
  detailedFilters: DetailedFilters,
) {
  return transactions.filter((transaction) => {
    if (
      detailedFilters.accountId &&
      transaction.account?.id !== detailedFilters.accountId &&
      transaction.transferAccount?.id !== detailedFilters.accountId
    ) {
      return false;
    }

    if (
      detailedFilters.categoryId &&
      transaction.category?.id !== detailedFilters.categoryId
    ) {
      return false;
    }

    const amount = Number(transaction.amount);
    const minAmount = detailedFilters.minAmount
      ? Number(detailedFilters.minAmount)
      : null;
    const maxAmount = detailedFilters.maxAmount
      ? Number(detailedFilters.maxAmount)
      : null;

    if (minAmount !== null && Number.isFinite(minAmount) && amount < minAmount) {
      return false;
    }

    if (maxAmount !== null && Number.isFinite(maxAmount) && amount > maxAmount) {
      return false;
    }

    return true;
  });
}

function getTransactionTone(type: TransactionType) {
  if (type === 'INCOME') {
    return {
      icon: ArrowDownLeft,
      iconClass: 'bg-emerald-50 text-emerald-600',
      amountClass: 'text-emerald-600',
      barClass: 'bg-emerald-500',
      prefix: '+',
    };
  }

  if (type === 'EXPENSE') {
    return {
      icon: ArrowUpRight,
      iconClass: 'bg-red-50 text-red-600',
      amountClass: 'text-red-600',
      barClass: 'bg-red-500',
      prefix: '-',
    };
  }

  return {
    icon: ArrowRightLeft,
    iconClass: 'bg-blue-50 text-blue-700',
    amountClass: 'text-blue-700',
    barClass: 'bg-blue-600',
    prefix: '',
  };
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-black',
        status === 'PAID' && 'bg-emerald-50 text-emerald-700',
        status === 'PENDING' && 'bg-amber-50 text-amber-700',
        status === 'CANCELED' && 'bg-slate-100 text-slate-500',
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function ProofStatusBadge({ status }: { status: ProofUploadStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-black',
        status === 'CREATED' && 'bg-emerald-50 text-emerald-700',
        status === 'DUPLICATE' && 'bg-red-50 text-red-700',
        status === 'NEEDS_REVIEW' && 'bg-amber-50 text-amber-700',
      )}
    >
      {proofStatusLabels[status]}
    </span>
  );
}

function MonthlyComparisonInsight({
  comparison,
}: {
  comparison: MonthlyComparisonData | null;
}) {
  if (!comparison) {
    return (
      <section className="mt-4 rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-bold text-slate-500">
          Ainda não há dados suficientes para comparar períodos.
        </p>
      </section>
    );
  }

  if (comparison.previousCount === 0) {
    return (
      <section className="mt-4 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.055)]">
        <div className="grid grid-cols-[5px_1fr]">
          <div className="bg-blue-700" />

          <div className="p-5">
            <p className="text-sm font-semibold text-slate-500">
              Comparativo do período
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
              {comparison.currentLabel}
            </h2>

            <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
              Ainda não existe movimentação no período anterior para comparar.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                <ReceiptText size={14} />
                {comparison.currentCount} lançamentos neste período
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                Período anterior sem lançamentos
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const resultDifference = comparison.currentResult - comparison.previousResult;
  const incomeDifference = comparison.currentIncome - comparison.previousIncome;
  const expenseDifference =
    comparison.currentExpense - comparison.previousExpense;

  const resultIsBetter = resultDifference >= 0;

  return (
    <section className="mt-4 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.055)]">
      <div className="grid grid-cols-[5px_1fr]">
        <div className={resultIsBetter ? 'bg-blue-700' : 'bg-red-600'} />

        <div className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">
                Comparativo do período
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                {comparison.currentLabel}
              </h2>

              <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
                {getComparisonInsight({
                  resultDifference,
                  expenseDifference,
                })}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black',
                    resultIsBetter
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-red-50 text-red-700',
                  )}
                >
                  <ShieldCheck size={14} />
                  {money(Math.abs(resultDifference))}{' '}
                  {getVariationLabel(resultDifference)}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                  <ReceiptText size={14} />
                  {comparison.currentCount} lançamentos
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Resultado atual
                </p>

                <strong
                  className={cn(
                    'mt-2 block text-2xl font-black tracking-tight',
                    comparison.currentResult >= 0
                      ? 'text-slate-950'
                      : 'text-red-600',
                  )}
                >
                  {money(comparison.currentResult)}
                </strong>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Período anterior
                </p>

                <strong
                  className={cn(
                    'mt-2 block text-2xl font-black tracking-tight',
                    comparison.previousResult >= 0
                      ? 'text-slate-950'
                      : 'text-red-600',
                  )}
                >
                  {money(comparison.previousResult)}
                </strong>

                <p className="mt-1 truncate text-xs font-bold text-slate-400">
                  {comparison.previousLabel}
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">
                  Entradas
                </p>

                <strong className="mt-2 block text-lg font-black text-emerald-700">
                  {money(comparison.currentIncome)}
                </strong>

                <p className="mt-1 text-xs font-bold text-emerald-700/70">
                  {incomeDifference >= 0 ? '+' : '-'}
                  {money(Math.abs(incomeDifference))} vs anterior
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">Saídas</p>

                <strong className="mt-2 block text-lg font-black text-red-700">
                  {money(comparison.currentExpense)}
                </strong>

                <p className="mt-1 text-xs font-bold text-red-700/70">
                  {expenseDifference >= 0 ? '+' : '-'}
                  {money(Math.abs(expenseDifference))} vs anterior
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type TransactionCardProps = {
  transaction: FinancialTransaction;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onPay: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

function TransactionCard({
  transaction,
  menuOpen,
  onToggleMenu,
  onPay,
  onCancel,
  onDelete,
}: TransactionCardProps) {
  const tone = getTransactionTone(transaction.type);
  const Icon = tone.icon;
  const pending = transaction.status === 'PENDING';

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[1.55rem] border bg-white p-4 transition duration-200',
        pending
          ? 'border-amber-200 shadow-[0_14px_36px_rgba(251,191,36,0.13)]'
          : 'border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.045)] hover:border-slate-300',
      )}
    >
      <div className={cn('absolute bottom-0 left-0 top-0 w-1', tone.barClass)} />

      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            tone.iconClass,
          )}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-black text-slate-950">
                  {transaction.description}
                </h3>

                <StatusBadge status={transaction.status} />
              </div>

              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {transactionTypeLabels[transaction.type]}
                {transaction.account?.name ? ` • ${transaction.account.name}` : ''}
                {transaction.category?.name
                  ? ` • ${transaction.category.name}`
                  : ''}
                {transaction.transferAccount?.name
                  ? ` → ${transaction.transferAccount.name}`
                  : ''}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                  {formatDate(transaction.transactionDate)}
                </span>

                {pending ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800">
                    <Clock3 size={13} />
                    Aguardando pagamento
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <strong className={cn('pt-1 text-sm font-black', tone.amountClass)}>
                {tone.prefix}
                {money(transaction.amount)}
              </strong>

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
                  <div className="absolute right-0 top-11 z-30 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {transaction.status !== 'PAID' ? (
                      <button
                        type="button"
                        onClick={onPay}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <CheckCircle2 size={15} />
                        Marcar paga
                      </button>
                    ) : null}

                    {transaction.status !== 'CANCELED' ? (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <XCircle size={15} />
                        Cancelar
                      </button>
                    ) : null}

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
        </div>
      </div>
    </article>
  );
}

function EmptyTransactions() {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <ReceiptText size={24} />
      </div>

      <strong className="mt-4 block text-sm font-black text-slate-950">
        Nenhuma movimentação encontrada
      </strong>

      <p className="mt-1 text-sm font-medium text-slate-500">
        Ajuste os filtros ou crie uma nova movimentação.
      </p>
    </div>
  );
}

export function TransactionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>(
    [],
  );
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofResult, setProofResult] = useState<ProofUploadResult | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showProofPanel, setShowProofPanel] = useState(false);
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [filters, setFilters] = useState<TransactionFilters>({
    type: '',
    status: '',
  });

  const [detailedFilters, setDetailedFilters] = useState<DetailedFilters>({
    accountId: '',
    categoryId: '',
    minAmount: '',
    maxAmount: '',
  });

  const [proofForm, setProofForm] = useState<ProofFormState>({
    type: 'EXPENSE',
    accountId: '',
    categoryId: '',
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

  const proofFilteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (proofForm.type === 'INCOME') {
        return category.type === 'INCOME';
      }

      return category.type === 'EXPENSE';
    });
  }, [categories, proofForm.type]);

  const detailedFilterCategories = useMemo(() => {
    if (!filters.type || filters.type === 'TRANSFER') {
      return categories;
    }

    return categories.filter((category) => category.type === filters.type);
  }, [categories, filters.type]);

  const sortedTransactions = useMemo(() => {
    return sortNewestFirst(transactions);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return applyDetailedFilters(sortedTransactions, detailedFilters);
  }, [detailedFilters, sortedTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, FinancialTransaction[]>();

    filteredTransactions.forEach((transaction) => {
      const key = getDateKey(transaction.transactionDate);
      const currentGroup = groups.get(key) ?? [];

      currentGroup.push(transaction);
      groups.set(key, currentGroup);
    });

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      label: formatDate(date),
      items,
    }));
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === 'INCOME' && transaction.status !== 'CANCELED',
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === 'EXPENSE' && transaction.status !== 'CANCELED',
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }, [filteredTransactions]);

  const result = totalIncome - totalExpense;

  const comparisonBaseTransactions = useMemo(() => {
    const baseTransactions = allTransactions.filter((transaction) => {
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      return true;
    });

    return applyDetailedFilters(baseTransactions, detailedFilters);
  }, [allTransactions, detailedFilters, filters.status, filters.type]);

  const monthlyComparison = useMemo<MonthlyComparisonData | null>(() => {
    const availableTransactions = comparisonBaseTransactions.filter(
      (transaction) => transaction.status !== 'CANCELED',
    );

    if (!availableTransactions.length) {
      return null;
    }

    const hasDateFilter = Boolean(filters.startDate || filters.endDate);

    if (hasDateFilter) {
      const availableDates = availableTransactions
        .map((transaction) => getDatePart(transaction.transactionDate))
        .sort();

      const currentStartDate = filters.startDate || availableDates[0];
      const currentEndDate =
        filters.endDate || availableDates[availableDates.length - 1];

      const periodLength = diffDays(currentStartDate, currentEndDate) + 1;

      const previousEndDate = formatDatePart(
        addDays(parseDatePart(currentStartDate), -1),
      );

      const previousStartDate = formatDatePart(
        addDays(parseDatePart(previousEndDate), -(periodLength - 1)),
      );

      const currentItems = availableTransactions.filter((transaction) =>
        isBetweenDates(
          transaction.transactionDate,
          currentStartDate,
          currentEndDate,
        ),
      );

      const previousItems = availableTransactions.filter((transaction) =>
        isBetweenDates(
          transaction.transactionDate,
          previousStartDate,
          previousEndDate,
        ),
      );

      const currentTotals = calculatePeriodTotals(currentItems);
      const previousTotals = calculatePeriodTotals(previousItems);

      return {
        currentLabel: `${formatDate(currentStartDate)} até ${formatDate(
          currentEndDate,
        )}`,
        previousLabel: `${formatDate(previousStartDate)} até ${formatDate(
          previousEndDate,
        )}`,
        currentIncome: currentTotals.income,
        currentExpense: currentTotals.expense,
        currentPending: currentTotals.pending,
        currentResult: currentTotals.income - currentTotals.expense,
        currentCount: currentTotals.count,
        previousIncome: previousTotals.income,
        previousExpense: previousTotals.expense,
        previousPending: previousTotals.pending,
        previousResult: previousTotals.income - previousTotals.expense,
        previousCount: previousTotals.count,
      };
    }

    const currentMonthKey = getCurrentMonthKey();
    const hasCurrentMonthData = availableTransactions.some(
      (transaction) =>
        getMonthKey(transaction.transactionDate) === currentMonthKey,
    );

    const referenceMonthKey = hasCurrentMonthData
      ? currentMonthKey
      : getMonthKey(availableTransactions[0].transactionDate);

    const previousMonthKey = getPreviousMonthKey(referenceMonthKey);

    const currentItems = availableTransactions.filter(
      (transaction) =>
        getMonthKey(transaction.transactionDate) === referenceMonthKey,
    );

    const previousItems = availableTransactions.filter(
      (transaction) =>
        getMonthKey(transaction.transactionDate) === previousMonthKey,
    );

    const currentTotals = calculatePeriodTotals(currentItems);
    const previousTotals = calculatePeriodTotals(previousItems);

    return {
      currentLabel: formatMonthLabel(referenceMonthKey),
      previousLabel: formatMonthLabel(previousMonthKey),
      currentIncome: currentTotals.income,
      currentExpense: currentTotals.expense,
      currentPending: currentTotals.pending,
      currentResult: currentTotals.income - currentTotals.expense,
      currentCount: currentTotals.count,
      previousIncome: previousTotals.income,
      previousExpense: previousTotals.expense,
      previousPending: previousTotals.pending,
      previousResult: previousTotals.income - previousTotals.expense,
      previousCount: previousTotals.count,
    };
  }, [comparisonBaseTransactions, filters.endDate, filters.startDate]);

  const hasActiveFilters =
    Boolean(filters.type) ||
    Boolean(filters.status) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(detailedFilters.accountId) ||
    Boolean(detailedFilters.categoryId) ||
    Boolean(detailedFilters.minAmount) ||
    Boolean(detailedFilters.maxAmount);

  async function loadData() {
    setLoading(true);

    try {
      const [
        transactionsResponse,
        allTransactionsResponse,
        accountsResponse,
        categoriesResponse,
      ] = await Promise.all([
        listTransactions(filters),
        listTransactions({
          type: '',
          status: '',
        }),
        listAccounts(),
        listCategories(),
      ]);

      setTransactions(sortNewestFirst(transactionsResponse.items));
      setAllTransactions(sortNewestFirst(allTransactionsResponse.items));
      setAccounts(accountsResponse);
      setCategories(categoriesResponse);

      setProofForm((current) => ({
        ...current,
        accountId: current.accountId || accountsResponse[0]?.id || '',
      }));
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
          openProofUpload?: boolean;
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

    if (state?.openProofUpload) {
      setShowProofPanel(true);

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

  function updateProofForm<K extends keyof ProofFormState>(
    key: K,
    value: ProofFormState[K],
  ) {
    setProofForm((current) => ({
      ...current,
      [key]: value,
      categoryId: key === 'type' ? '' : current.categoryId,
    }));
  }

  function updateDetailedFilter<K extends keyof DetailedFilters>(
    key: K,
    value: DetailedFilters[K],
  ) {
    setDetailedFilters((current) => ({
      ...current,
      [key]: value,
      categoryId: key === 'categoryId' ? value : current.categoryId,
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

  function clearFilters() {
    setFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: '',
    });

    setDetailedFilters({
      accountId: '',
      categoryId: '',
      minAmount: '',
      maxAmount: '',
    });
  }

  function fillFormFromProof(resultData: ProofUploadResult) {
    const parsed = resultData.parsed;

    const description =
      parsed.recipientName ||
      parsed.payerName ||
      parsed.bankName ||
      'Movimentação importada por comprovante';

    const notes = [
      'Dados preenchidos automaticamente pela leitura do comprovante.',
      parsed.endToEndId ? `Identificador/EndToEnd: ${parsed.endToEndId}` : null,
      parsed.pixKey ? `Chave Pix: ${parsed.pixKey}` : null,
      parsed.payerName ? `Pagador: ${parsed.payerName}` : null,
      parsed.recipientName ? `Destinatário: ${parsed.recipientName}` : null,
      parsed.bankName ? `Banco: ${parsed.bankName}` : null,
      `Confiança da leitura: ${parsed.confidence}%`,
      parsed.warnings.length ? `Avisos: ${parsed.warnings.join(' | ')}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    setForm({
      description,
      type: proofForm.type,
      amount: parsed.amount ?? 0,
      transactionDate: toInputDateFromApi(parsed.transactionDate),
      status: 'PAID',
      accountId: proofForm.accountId,
      categoryId: proofForm.categoryId,
      transferAccountId: '',
      notes,
    });

    setShowForm(true);
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

  async function handleProofFile(file?: File | null) {
    if (!file) {
      return;
    }

    if (!proofForm.accountId) {
      toast.error('Selecione a conta antes de enviar o comprovante.');
      return;
    }

    try {
      setUploadingProof(true);
      setProofResult(null);

      const formData = new FormData();

      formData.append('file', file);
      formData.append('type', proofForm.type);
      formData.append('accountId', proofForm.accountId);
      formData.append('autoCreate', 'true');

      if (proofForm.categoryId) {
        formData.append('categoryId', proofForm.categoryId);
      }

      const response = await api.post<ProofUploadResult>(
        '/financial-transactions/payment-proof/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setProofResult(response.data);

      if (response.data.status === 'CREATED') {
        toast.success('Comprovante lido e movimentação lançada.');
        await loadData();
        return;
      }

      if (response.data.status === 'DUPLICATE') {
        toast.error('Este comprovante parece já ter sido lançado.');
        return;
      }

      toast.error('Comprovante lido, mas precisa de conferência manual.');
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error);
      toast.error('Não foi possível ler o comprovante.');
    } finally {
      setUploadingProof(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
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
              Movimentações
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300"
              aria-label="Filtros detalhados"
            >
              <SlidersHorizontal size={18} />
            </button>

            <button
              type="button"
              onClick={loadData}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300"
              aria-label="Atualizar"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="grid grid-cols-[6px_1fr]">
            <div className={cn(result >= 0 ? 'bg-blue-700' : 'bg-red-600')} />

            <div className="p-5 md:p-7">
              <div className="max-w-3xl">
                <p className="text-base font-bold text-slate-500 md:text-lg">
                  Previsão das movimentações
                </p>

                <strong
                  className={cn(
                    'mt-2 block text-4xl font-black tracking-[-0.045em] md:text-6xl',
                    result >= 0 ? 'text-slate-950' : 'text-red-600',
                  )}
                >
                  {money(result)}
                </strong>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black',
                      result >= 0
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-red-50 text-red-700',
                    )}
                  >
                    <ShieldCheck size={14} />
                    {getResultLabel(result)}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    <ReceiptText size={14} />
                    {filteredTransactions.length} lançamentos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Filter size={19} />
              </div>

              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Filtros detalhados
                </h2>

                <p className="text-sm font-medium text-slate-500">
                  Refine por período, conta, categoria, tipo, status e valor.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
            >
              {showFilters ? 'Ocultar' : 'Abrir'}
            </button>
          </div>

          {showFilters ? (
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Tipo
                  </span>

                  <select
                    value={filters.type}
                    onChange={(event) => {
                      const type = event.target.value as TransactionType | '';

                      setFilters((current) => ({
                        ...current,
                        type,
                      }));

                      setDetailedFilters((current) => ({
                        ...current,
                        categoryId: '',
                      }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="INCOME">Receitas</option>
                    <option value="EXPENSE">Despesas</option>
                    <option value="TRANSFER">Transferências</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Status
                  </span>

                  <select
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        status: event.target.value as TransactionStatus | '',
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todos os status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="CANCELED">Cancelado</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Data inicial
                  </span>

                  <input
                    type="date"
                    value={filters.startDate ?? ''}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Data final
                  </span>

                  <input
                    type="date"
                    value={filters.endDate ?? ''}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Conta
                  </span>

                  <select
                    value={detailedFilters.accountId}
                    onChange={(event) =>
                      updateDetailedFilter('accountId', event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todas as contas</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Categoria
                  </span>

                  <select
                    value={detailedFilters.categoryId}
                    onChange={(event) =>
                      updateDetailedFilter('categoryId', event.target.value)
                    }
                    disabled={filters.type === 'TRANSFER'}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Todas as categorias</option>
                    {detailedFilterCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Valor mínimo
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={detailedFilters.minAmount}
                    onChange={(event) =>
                      updateDetailedFilter('minAmount', event.target.value)
                    }
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Valor máximo
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={detailedFilters.maxAmount}
                    onChange={(event) =>
                      updateDetailedFilter('maxAmount', event.target.value)
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
                  onClick={loadData}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          ) : null}

          <MonthlyComparisonInsight comparison={monthlyComparison} />
        </section>

        {showProofPanel ? (
          <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <div className="grid grid-cols-[6px_1fr]">
              <div className="bg-slate-950" />

              <div className="p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <ReceiptText size={22} />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-950">
                        Lançar por comprovante
                      </h2>

                      <p className="mt-1 text-sm font-medium text-slate-500">
                        O sistema tenta identificar valor, data, banco, pagador e
                        destinatário automaticamente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProofPanel(false);
                      setProofResult(null);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label>
                    <span className="mb-2 block text-sm font-semibold text-slate-500">
                      Tipo
                    </span>

                    <select
                      value={proofForm.type}
                      onChange={(event) =>
                        updateProofForm(
                          'type',
                          event.target.value as TransactionType,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-semibold text-slate-500">
                      Conta
                    </span>

                    <select
                      value={proofForm.accountId}
                      onChange={(event) =>
                        updateProofForm('accountId', event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-semibold text-slate-500">
                      Categoria
                    </span>

                    <select
                      value={proofForm.categoryId}
                      onChange={(event) =>
                        updateProofForm('categoryId', event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                    >
                      <option value="">Sem categoria</option>
                      {proofFilteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={uploadingProof}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {uploadingProof ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Camera size={18} />
                    )}
                    Tirar foto
                  </button>

                  <button
                    type="button"
                    disabled={uploadingProof}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {uploadingProof ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <FileUp size={18} />
                    )}
                    Anexar arquivo
                  </button>
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => handleProofFile(event.target.files?.[0])}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="hidden"
                  onChange={(event) => handleProofFile(event.target.files?.[0])}
                />

                {proofResult ? (
                  <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">
                            Resultado da leitura
                          </h3>

                          <ProofStatusBadge status={proofResult.status} />
                        </div>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {proofResult.message}
                        </p>
                      </div>

                      {proofResult.status === 'NEEDS_REVIEW' ? (
                        <button
                          type="button"
                          onClick={() => fillFormFromProof(proofResult)}
                          className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
                        >
                          Revisar e lançar
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-2 text-sm md:grid-cols-3">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Valor
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {proofResult.parsed.amount !== null
                            ? money(proofResult.parsed.amount)
                            : '-'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Data
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatOptionalDate(proofResult.parsed.transactionDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Confiança
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {proofResult.parsed.confidence}%
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Pagador
                        </p>
                        <p className="mt-1 break-words font-black text-slate-950">
                          {proofResult.parsed.payerName ?? '-'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Destinatário
                        </p>
                        <p className="mt-1 break-words font-black text-slate-950">
                          {proofResult.parsed.recipientName ?? '-'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Banco
                        </p>
                        <p className="mt-1 break-words font-black text-slate-950">
                          {proofResult.parsed.bankName ?? '-'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 md:col-span-2">
                        <p className="text-sm font-semibold text-slate-500">
                          Chave Pix
                        </p>
                        <p className="mt-1 break-words font-black text-slate-950">
                          {proofResult.parsed.pixKey ?? '-'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          Identificador
                        </p>
                        <p className="mt-1 break-words font-black text-slate-950">
                          {proofResult.parsed.endToEndId ?? '-'}
                        </p>
                      </div>
                    </div>

                    {proofResult.parsed.warnings.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                        <div className="mb-2 flex items-center gap-2 text-amber-700">
                          <AlertTriangle size={16} />

                          <p className="text-xs font-black">
                            Conferência necessária
                          </p>
                        </div>

                        <ul className="space-y-1 text-xs font-medium text-amber-800">
                          {proofResult.parsed.warnings.map((warning) => (
                            <li key={warning}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Extrato
              </h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
              {filteredTransactions.length} lançamentos
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100"
                />
              ))}
            </div>
          ) : groupedTransactions.length ? (
            <div className="space-y-6">
              {groupedTransactions.map((group) => (
                <div key={group.date}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                      {group.label}
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="space-y-3">
                    {group.items.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        menuOpen={openedMenuId === transaction.id}
                        onToggleMenu={() =>
                          setOpenedMenuId(
                            openedMenuId === transaction.id
                              ? null
                              : transaction.id,
                          )
                        }
                        onPay={() =>
                          setConfirmAction({ type: 'pay', transaction })
                        }
                        onCancel={() =>
                          setConfirmAction({ type: 'cancel', transaction })
                        }
                        onDelete={() =>
                          setConfirmAction({ type: 'delete', transaction })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTransactions />
          )}
        </section>
      </main>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 md:items-center md:justify-center md:p-6">
          <form
            onSubmit={handleCreate}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl md:max-w-xl md:rounded-[2rem]"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
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
                      className={cn(
                        'rounded-2xl px-3 py-3 text-xs font-bold transition',
                        form.type === type
                          ? 'bg-slate-950 text-white'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {transactionTypeLabels[type]}
                    </button>
                  ),
                )}
              </div>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-500">
                  Descrição
                </span>

                <input
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                  placeholder="Ex: Mercado, salário, transferência"
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-500">
                  Valor
                </span>

                <input
                  value={form.amount || ''}
                  onChange={(event) =>
                    updateForm('amount', Number(event.target.value))
                  }
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                  placeholder="0,00"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Data
                  </span>

                  <input
                    value={form.transactionDate}
                    onChange={(event) =>
                      updateForm('transactionDate', event.target.value)
                    }
                    type="date"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                    required
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Status
                  </span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm('status', event.target.value as TransactionStatus)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                  >
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-500">
                  Conta origem
                </span>

                <select
                  value={form.accountId}
                  onChange={(event) => updateForm('accountId', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
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
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Conta destino
                  </span>

                  <select
                    value={form.transferAccountId}
                    onChange={(event) =>
                      updateForm('transferAccountId', event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
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
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Categoria
                  </span>

                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm('categoryId', event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
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
                <span className="mb-2 block text-sm font-semibold text-slate-500">
                  Observações
                </span>

                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-200 focus:bg-white"
                  placeholder="Opcional"
                />
              </label>

              <button
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar movimentação'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

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