import { Pencil, Tag, Trash2 } from 'lucide-react';

import type { Category } from '../types/finance';

type CategoryCardProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <article className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: category.color ?? '#6D28D9' }}
        >
          <Tag size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-950">{category.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                category.active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {category.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"
            >
              <Pencil size={14} />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onDelete(category)}
              className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
