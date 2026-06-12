import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Filter,
  LineChart,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { InvestmentFormModal } from '../components/InvestmentFormModal';
import { useToast } from '../components/ToastProvider';
import {
  createInvestment,
  deleteInvestment,
  listInvestments,
  updateInvestment,
  type CreateInvestmentPayload,
  type Investment,
  type InvestmentStatus,
} from '../services/investments';

type DetailedFilters = {
  status: InvestmentStatus | '';
  type: string;
  institution: string;
  minAmount: string;
  maxAmount: string;
};

type PortfolioInsightData = {
  totalInvested: number;
  currentTotal: number;
  result: number;
  resultPercent: number;
  activeCount: number;
  redeemedCount: number;
  bestInvestment: Investment | null;
  worstInvestment: Investment | null;
  biggestInvestment: Investment | null;
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

function percent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const [dateOnly] = value.split('T');
  const [year, month, day] = dateOnly.split('-');

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return new Date(value).toLocaleDateString('pt-BR');
}

function getStatusLabel(status: InvestmentStatus) {
  const labels: Partial<Record<InvestmentStatus, string>> = {
    ACTIVE: 'Ativo',
    REDEEMED: 'Resgatado',
  };

  return labels[status] ?? String(status);
}

function getStatusTone(status: InvestmentStatus) {
  if (status === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-700';
  }

  return 'bg-slate-100 text-slate-500';
}

function getInvestmentCurrentAmount(investment: Investment) {
  return Number(investment.currentAmount ?? investment.investedAmount);
}

function getInvestmentResult(investment: Investment) {
  return getInvestmentCurrentAmount(investment) - Number(investment.investedAmount);
}

function getInvestmentResultPercent(investment: Investment) {
  const investedAmount = Number(investment.investedAmount);

  if (!investedAmount) {
    return 0;
  }

  return (getInvestmentResult(investment) / investedAmount) * 100;
}

function sortInvestments(investments: Investment[]) {
  return [...investments].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'ACTIVE' ? -1 : 1;
    }

    const firstAmount = getInvestmentCurrentAmount(a);
    const secondAmount = getInvestmentCurrentAmount(b);

    if (firstAmount !== secondAmount) {
      return secondAmount - firstAmount;
    }

    return String(a.name).localeCompare(String(b.name));
  });
}

function applyDetailedFilters(
  investments: Investment[],
  detailedFilters: DetailedFilters,
) {
  return investments.filter((investment) => {
    if (detailedFilters.status && investment.status !== detailedFilters.status) {
      return false;
    }

    if (detailedFilters.type && investment.type !== detailedFilters.type) {
      return false;
    }

    if (
      detailedFilters.institution &&
      investment.institution !== detailedFilters.institution
    ) {
      return false;
    }

    const currentAmount = getInvestmentCurrentAmount(investment);
    const minAmount = detailedFilters.minAmount
      ? Number(detailedFilters.minAmount)
      : null;
    const maxAmount = detailedFilters.maxAmount
      ? Number(detailedFilters.maxAmount)
      : null;

    if (
      minAmount !== null &&
      Number.isFinite(minAmount) &&
      currentAmount < minAmount
    ) {
      return false;
    }

    if (
      maxAmount !== null &&
      Number.isFinite(maxAmount) &&
      currentAmount > maxAmount
    ) {
      return false;
    }

    return true;
  });
}

function getPortfolioInsight({
  result,
  resultPercent,
  activeCount,
  redeemedCount,
}: PortfolioInsightData) {
  if (!activeCount && !redeemedCount) {
    return 'Cadastre seus investimentos para acompanhar sua evolução patrimonial.';
  }

  if (result > 0) {
    return `Sua carteira está positiva, com valorização de ${percent(
      resultPercent,
    )} sobre o valor aplicado.`;
  }

  if (result < 0) {
    return `Sua carteira está abaixo do valor aplicado em ${percent(
      resultPercent,
    )}. Vale revisar os ativos com pior desempenho.`;
  }

  return 'Sua carteira está equilibrada em relação ao valor aplicado.';
}

function PortfolioInsightCard({
  insight,
}: {
  insight: PortfolioInsightData;
}) {
  const resultIsPositive = insight.result >= 0;

  return (
    <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.055)]">
      <div className="grid grid-cols-[5px_1fr]">
        <div className={resultIsPositive ? 'bg-blue-700' : 'bg-red-600'} />

        <div className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">
                Análise da carteira
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                {resultIsPositive ? 'Carteira saudável' : 'Carteira em atenção'}
              </h2>

              <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
                {getPortfolioInsight(insight)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black',
                    resultIsPositive
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-red-50 text-red-700',
                  )}
                >
                  <ShieldCheck size={14} />
                  {percent(insight.resultPercent)} de rentabilidade
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                  <WalletCards size={14} />
                  {insight.activeCount} ativos
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Valor aplicado
                </p>

                <strong className="mt-2 block text-2xl font-black tracking-tight text-slate-950">
                  {money(insight.totalInvested)}
                </strong>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Valor atual
                </p>

                <strong className="mt-2 block text-2xl font-black tracking-tight text-slate-950">
                  {money(insight.currentTotal)}
                </strong>
              </div>

              <div
                className={cn(
                  'rounded-[1.35rem] border p-4',
                  resultIsPositive
                    ? 'border-emerald-100 bg-emerald-50'
                    : 'border-red-100 bg-red-50',
                )}
              >
                <p
                  className={cn(
                    'text-sm font-semibold',
                    resultIsPositive ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  Resultado
                </p>

                <strong
                  className={cn(
                    'mt-2 block text-lg font-black',
                    resultIsPositive ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  {insight.result >= 0 ? '+' : ''}
                  {money(insight.result)}
                </strong>
              </div>

              <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-700">
                  Maior posição
                </p>

                <strong className="mt-2 block truncate text-lg font-black text-blue-700">
                  {insight.biggestInvestment?.name ?? '-'}
                </strong>

                <p className="mt-1 text-xs font-bold text-blue-700/70">
                  {insight.biggestInvestment
                    ? money(getInvestmentCurrentAmount(insight.biggestInvestment))
                    : 'Sem posição'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type InvestmentRowProps = {
  investment: Investment;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function InvestmentRow({
  investment,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: InvestmentRowProps) {
  const currentAmount = getInvestmentCurrentAmount(investment);
  const result = getInvestmentResult(investment);
  const resultPercent = getInvestmentResultPercent(investment);
  const resultIsPositive = result >= 0;

  return (
    <article className="group relative overflow-visible rounded-[1.55rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:border-slate-300">
      <div
        className={cn(
          'absolute bottom-0 left-0 top-0 w-1 rounded-l-[1.55rem]',
          resultIsPositive ? 'bg-emerald-500' : 'bg-red-500',
        )}
      />

      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            resultIsPositive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700',
          )}
        >
          <LineChart size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-black text-slate-950">
                  {investment.name}
                </h3>

                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-black',
                    getStatusTone(investment.status),
                  )}
                >
                  {getStatusLabel(investment.status)}
                </span>
              </div>

              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {investment.type}
                {investment.institution ? ` • ${investment.institution}` : ''}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                  Aplicado em {formatDate(investment.investedAt)}
                </span>

                {investment.redeemedAt ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                    Resgatado em {formatDate(investment.redeemedAt)}
                  </span>
                ) : null}

                {investment.profitability !== null &&
                  investment.profitability !== undefined ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                    {Number(investment.profitability).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    % esperado
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <div className="pt-1 text-right">
                <strong className="block text-sm font-black text-slate-950">
                  {money(currentAmount)}
                </strong>

                <p
                  className={cn(
                    'mt-1 text-xs font-black',
                    resultIsPositive ? 'text-emerald-600' : 'text-red-600',
                  )}
                >
                  {result >= 0 ? '+' : ''}
                  {money(result)} · {percent(resultPercent)}
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

          {investment.notes ? (
            <p className="mt-3 line-clamp-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              {investment.notes}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyInvestments({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <LineChart size={24} />
      </div>

      <strong className="mt-4 block text-sm font-black text-slate-950">
        Nenhum investimento encontrado
      </strong>

      <p className="mt-1 text-sm font-medium text-slate-500">
        Ajuste os filtros ou cadastre seu primeiro investimento pelo botão
        flutuante.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
      >
        Cadastrar investimento
      </button>
    </div>
  );
}

export function InvestmentsPage() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);

  const [investmentToDelete, setInvestmentToDelete] =
    useState<Investment | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  const [detailedFilters, setDetailedFilters] = useState<DetailedFilters>({
    status: '',
    type: '',
    institution: '',
    minAmount: '',
    maxAmount: '',
  });

  const sortedInvestments = useMemo(() => {
    return sortInvestments(investments);
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return applyDetailedFilters(sortedInvestments, detailedFilters);
  }, [detailedFilters, sortedInvestments]);

  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(investments.map((investment) => investment.type).filter(Boolean)),
    ).sort();
  }, [investments]);

  const institutionOptions = useMemo(() => {
    return Array.from(
      new Set(
        investments
          .map((investment) => investment.institution)
          .filter((institution): institution is string => Boolean(institution)),
      ),
    ).sort();
  }, [investments]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(investments.map((investment) => investment.status)),
    ).sort();
  }, [investments]);

  const summary = useMemo<PortfolioInsightData>(() => {
    const activeInvestments = filteredInvestments.filter(
      (investment) => investment.status === 'ACTIVE',
    );

    const redeemedInvestments = filteredInvestments.filter(
      (investment) => investment.status !== 'ACTIVE',
    );

    const totalInvested = activeInvestments.reduce(
      (sum, investment) => sum + Number(investment.investedAmount),
      0,
    );

    const currentTotal = activeInvestments.reduce(
      (sum, investment) => sum + getInvestmentCurrentAmount(investment),
      0,
    );

    const result = currentTotal - totalInvested;

    const resultPercent = totalInvested ? (result / totalInvested) * 100 : 0;

    const activeSortedByResult = [...activeInvestments].sort(
      (a, b) => getInvestmentResult(b) - getInvestmentResult(a),
    );

    const activeSortedByAmount = [...activeInvestments].sort(
      (a, b) => getInvestmentCurrentAmount(b) - getInvestmentCurrentAmount(a),
    );

    return {
      totalInvested,
      currentTotal,
      result,
      resultPercent,
      activeCount: activeInvestments.length,
      redeemedCount: redeemedInvestments.length,
      bestInvestment: activeSortedByResult[0] ?? null,
      worstInvestment:
        activeSortedByResult.length > 1
          ? activeSortedByResult[activeSortedByResult.length - 1]
          : null,
      biggestInvestment: activeSortedByAmount[0] ?? null,
    };
  }, [filteredInvestments]);

  const hasActiveFilters =
    Boolean(detailedFilters.status) ||
    Boolean(detailedFilters.type) ||
    Boolean(detailedFilters.institution) ||
    Boolean(detailedFilters.minAmount) ||
    Boolean(detailedFilters.maxAmount);

  async function loadInvestments() {
    setLoading(true);

    try {
      const response = await listInvestments();
      setInvestments(response);
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
      toast.error('Não foi possível carregar os investimentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvestments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;

    if (state?.openCreateModal) {
      setSelectedInvestment(null);
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
      status: '',
      type: '',
      institution: '',
      minAmount: '',
      maxAmount: '',
    });
  }

  function handleNew() {
    setSelectedInvestment(null);
    setShowModal(true);
  }

  function handleEdit(investment: Investment) {
    setSelectedInvestment(investment);
    setShowModal(true);
    setOpenedMenuId(null);
  }

  function handleDelete(investment: Investment) {
    setInvestmentToDelete(investment);
    setOpenedMenuId(null);
  }

  async function confirmDelete() {
    if (!investmentToDelete) {
      return;
    }

    try {
      setSaving(true);

      await deleteInvestment(investmentToDelete.id);

      toast.success('Investimento excluído com sucesso.');

      setInvestmentToDelete(null);

      await loadInvestments();
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
      toast.error('Não foi possível excluir o investimento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(
    payload: CreateInvestmentPayload & {
      status?: InvestmentStatus;
      redeemedAt?: string;
    },
  ) {
    try {
      setSaving(true);

      if (selectedInvestment) {
        await updateInvestment(selectedInvestment.id, {
          name: payload.name,
          type: payload.type,
          institution: payload.institution,
          investedAmount: Number(payload.investedAmount),
          currentAmount:
            payload.currentAmount !== undefined
              ? Number(payload.currentAmount)
              : undefined,
          profitability:
            payload.profitability !== undefined
              ? Number(payload.profitability)
              : undefined,
          investedAt: payload.investedAt,
          redeemedAt: payload.redeemedAt || undefined,
          status: payload.status,
          notes: payload.notes,
        });

        toast.success('Investimento atualizado com sucesso.');
      } else {
        await createInvestment({
          name: payload.name,
          type: payload.type,
          institution: payload.institution,
          investedAmount: Number(payload.investedAmount),
          currentAmount:
            payload.currentAmount !== undefined
              ? Number(payload.currentAmount)
              : undefined,
          profitability:
            payload.profitability !== undefined
              ? Number(payload.profitability)
              : undefined,
          investedAt: payload.investedAt,
          notes: payload.notes,
        });

        toast.success('Investimento criado com sucesso.');
      }

      setShowModal(false);
      setSelectedInvestment(null);

      await loadInvestments();
    } catch (error) {
      console.error('Erro ao salvar investimento:', error);
      toast.error('Não foi possível salvar o investimento.');
    } finally {
      setSaving(false);
    }
  }

  const resultIsPositive = summary.result >= 0;

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
              Investimentos
            </h1>
          </div>

          <button
            type="button"
            onClick={loadInvestments}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300 disabled:pointer-events-none disabled:opacity-60"
            aria-label="Atualizar investimentos"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="grid grid-cols-[6px_1fr]">
            <div className={resultIsPositive ? 'bg-blue-700' : 'bg-red-600'} />

            <div className="p-5 md:p-7">
              <div className="max-w-3xl">
                <p className="text-base font-bold text-slate-500 md:text-lg">
                  Patrimônio investido
                </p>

                <strong className="mt-2 block text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">
                  {money(summary.currentTotal)}
                </strong>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black',
                      resultIsPositive
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-red-50 text-red-700',
                    )}
                  >
                    <ShieldCheck size={14} />
                    {summary.result >= 0 ? '+' : ''}
                    {money(summary.result)} de resultado
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    <WalletCards size={14} />
                    {summary.activeCount} investimentos ativos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PortfolioInsightCard insight={summary} />

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Carteira
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {filteredInvestments.length} investimentos encontrados
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
              <div className="grid gap-3 md:grid-cols-5">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Status
                  </span>

                  <select
                    value={detailedFilters.status}
                    onChange={(event) =>
                      updateDetailedFilter(
                        'status',
                        event.target.value as InvestmentStatus | '',
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todos os status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

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
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-500">
                    Instituição
                  </span>

                  <select
                    value={detailedFilters.institution}
                    onChange={(event) =>
                      updateDetailedFilter('institution', event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="">Todas</option>
                    {institutionOptions.map((institution) => (
                      <option key={institution} value={institution}>
                        {institution}
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
          ) : filteredInvestments.length ? (
            <div className="space-y-3">
              {filteredInvestments.map((investment) => (
                <InvestmentRow
                  key={investment.id}
                  investment={investment}
                  menuOpen={openedMenuId === investment.id}
                  onToggleMenu={() =>
                    setOpenedMenuId(
                      openedMenuId === investment.id ? null : investment.id,
                    )
                  }
                  onEdit={() => handleEdit(investment)}
                  onDelete={() => handleDelete(investment)}
                />
              ))}
            </div>
          ) : (
            <EmptyInvestments onCreate={handleNew} />
          )}
        </section>
      </main>

      {showModal ? (
        <InvestmentFormModal
          investment={selectedInvestment}
          onClose={() => {
            setShowModal(false);
            setSelectedInvestment(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ConfirmDialog
        open={!!investmentToDelete}
        title="Excluir investimento?"
        description={
          investmentToDelete
            ? `O investimento "${investmentToDelete.name}" será removido. Essa ação não poderá ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={saving}
        tone="danger"
        onCancel={() => setInvestmentToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}