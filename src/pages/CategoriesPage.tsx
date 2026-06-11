import { useEffect, useMemo, useState } from 'react';
import { Plus, Tags } from 'lucide-react';

import { CategoryCard } from '../components/CategoryCard';
import { CategoryFormModal } from '../components/CategoryFormModal';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CreateCategoryPayload,
} from '../services/categories';
import type { Category } from '../types/finance';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === 'INCOME'),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'EXPENSE'),
    [categories],
  );

  async function loadCategories() {
    setLoading(true);

    try {
      const response = await listCategories();
      setCategories(response);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleNew() {
    setSelectedCategory(null);
    setShowModal(true);
  }

  function handleEdit(category: Category) {
    setSelectedCategory(category);
    setShowModal(true);
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Deseja excluir a categoria ${category.name}?`)) {
      return;
    }

    await deleteCategory(category.id);
    await loadCategories();
  }

  async function handleSubmit(payload: CreateCategoryPayload & { active?: boolean }) {
    if (selectedCategory) {
      await updateCategory(selectedCategory.id, payload);
    } else {
      await createCategory(payload);
    }

    setShowModal(false);
    await loadCategories();
  }

  function renderSection(title: string, items: Category[]) {
    return (
      <div>
        <h2 className="mb-3 text-lg font-black text-slate-950">{title}</h2>

        <div className="space-y-3">
          {items.length ? (
            items.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Nenhuma categoria nessa seção.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <section className="rounded-b-[2.5rem] bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 pb-8 pt-7 text-white md:rounded-none md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-violet-100">EvFinanceiro</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Categorias</h1>
              <p className="mt-2 text-sm text-violet-100">
                Organize receitas e despesas por tipo.
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

      <section className="mx-auto max-w-6xl space-y-7 px-5 py-6 md:px-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[2rem] bg-violet-100" />
          ))
        ) : categories.length ? (
          <>
            {renderSection('Receitas', incomeCategories)}
            {renderSection('Despesas', expenseCategories)}
          </>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
              <Tags size={26} />
            </div>
            <h2 className="font-black text-slate-950">Nenhuma categoria cadastrada</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre categorias para organizar seus lançamentos.
            </p>
          </div>
        )}
      </section>

      {showModal && (
        <CategoryFormModal
          category={selectedCategory}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
