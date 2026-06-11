import { useEffect, useMemo, useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { CategoryCard } from '../components/CategoryCard';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CreateCategoryPayload,
} from '../services/categories';
import type { Category } from '../types/finance';

export function CategoriesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

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
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Não foi possível carregar as categorias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;

    if (state?.openCreateModal) {
      setSelectedCategory(null);
      setShowModal(true);

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.state, navigate]);

  function handleNew() {
    setSelectedCategory(null);
    setShowModal(true);
  }

  function handleEdit(category: Category) {
    setSelectedCategory(category);
    setShowModal(true);
  }

  function handleDelete(category: Category) {
    setCategoryToDelete(category);
  }

  async function confirmDelete() {
    if (!categoryToDelete) {
      return;
    }

    try {
      setSaving(true);

      await deleteCategory(categoryToDelete.id);

      toast.success('Categoria excluída com sucesso.');

      setCategoryToDelete(null);

      await loadCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Não foi possível excluir a categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(payload: CreateCategoryPayload & { active?: boolean }) {
    try {
      setSaving(true);

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
        toast.success('Categoria atualizada com sucesso.');
      } else {
        await createCategory({
          name: payload.name,
          type: payload.type,
          color: payload.color,
        });

        toast.success('Categoria criada com sucesso.');
      }

      setShowModal(false);
      setSelectedCategory(null);

      await loadCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Não foi possível salvar a categoria.');
    } finally {
      setSaving(false);
    }
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
              disabled={saving}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-800 shadow-lg shadow-violet-950/20 disabled:opacity-60"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-7 px-5 py-6 md:px-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[2rem] bg-violet-100"
            />
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

            <h2 className="font-black text-slate-950">
              Nenhuma categoria cadastrada
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Cadastre categorias para organizar seus lançamentos.
            </p>

            <button
              type="button"
              onClick={handleNew}
              disabled={saving}
              className="mt-5 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60"
            >
              Criar categoria
            </button>
          </div>
        )}
      </section>

      {showModal && (
        <CategoryFormModal
          category={selectedCategory}
          onClose={() => {
            setShowModal(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={!!categoryToDelete}
        title="Excluir categoria?"
        description={
          categoryToDelete
            ? `A categoria "${categoryToDelete.name}" será removida. Essa ação não poderá ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={saving}
        tone="danger"
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}