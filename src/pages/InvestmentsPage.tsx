import { useEffect, useMemo, useState } from 'react';
import { LineChart, Plus, TrendingUp, WalletCards } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { InvestmentCard } from '../components/InvestmentCard';
import { InvestmentFormModal } from '../components/InvestmentFormModal';
import { StatCard } from '../components/StatCard';
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

function money(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function InvestmentsPage() {
  const toast = useToast();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showModal, setShowModal] = useState(false);

  const summary = useMemo(() => {
    const activeInvestments = investments.filter(
      (investment) => investment.status === 'ACTIVE',
    );

    const totalInvested = activeInvestments.reduce(
      (sum, investment) => sum + Number(investment.investedAmount),
      0,
    );

    const currentTotal = activeInvestments.reduce(
      (sum, investment) =>
        sum + Number(investment.currentAmount ?? investment.investedAmount),
      0,
    );

    const result = currentTotal - totalInvested;

    return {
      totalInvested,
      currentTotal,
      result,
    };
  }, [investments]);

  async function loadInvestments() {
    setLoading(true);

    try {
      const response = await listInvestments();
      setInvestments(response);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvestments();
  }, []);

  function handleNew() {
    setSelectedInvestment(null);
    setShowModal(true);
  }

  function handleEdit(investment: Investment) {
    setSelectedInvestment(investment);
    setShowModal(true);
  }

  async function handleDelete(investment: Investment) {
    if (!confirm(`Deseja excluir o investimento ${investment.name}?`)) {
      return;
    }

    await deleteInvestment(investment.id);
    toast.success('Investimento excluído');
    await loadInvestments();
  }

  async function handleSubmit(
    payload: CreateInvestmentPayload & {
      status?: InvestmentStatus;
      redeemedAt?: string;
    },
  ) {
    if (selectedInvestment) {
      await updateInvestment(selectedInvestment.id, payload);
      toast.success('Investimento atualizado');
    } else {
      await createInvestment(payload);
      toast.success('Investimento criado');
    }

    setShowModal(false);
    await loadInvestments();
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <section className="rounded-b-[2.5rem] bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 pb-8 pt-7 text-white md:rounded-none md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-violet-100">EvFinanceiro</p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Investimentos</h1>
              <p className="mt-2 text-sm text-violet-100">
                Acompanhe patrimônio, rentabilidade e evolução.
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

          <div className="mt-7">
            <p className="text-sm text-violet-100">Patrimônio investido</p>
            <strong className="mt-1 block text-4xl font-black tracking-tight">
              {money(summary.currentTotal)}
            </strong>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-5 py-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total investido"
            value={money(summary.totalInvested)}
            icon={<WalletCards size={20} />}
          />

          <StatCard
            title="Valor atual"
            value={money(summary.currentTotal)}
            icon={<LineChart size={20} />}
            tone="success"
          />

          <StatCard
            title="Resultado"
            value={`${summary.result >= 0 ? '+' : ''}${money(summary.result)}`}
            icon={<TrendingUp size={20} />}
            tone={summary.result >= 0 ? 'success' : 'danger'}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-[2rem] bg-violet-100"
              />
            ))}
          </div>
        ) : investments.length ? (
          <div className="space-y-3">
            {investments.map((investment) => (
              <InvestmentCard
                key={investment.id}
                investment={investment}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<LineChart size={26} />}
            title="Nenhum investimento cadastrado"
            description="Cadastre seu primeiro investimento para acompanhar sua evolução patrimonial."
            action={
              <button
                type="button"
                onClick={handleNew}
                className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white"
              >
                Novo investimento
              </button>
            }
          />
        )}
      </section>

      {showModal && (
        <InvestmentFormModal
          investment={selectedInvestment}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
