import { type FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type { Category, CategoryType } from '../types/finance';
import type { CreateCategoryPayload } from '../services/categories';

type CategoryFormModalProps = {
  category?: Category | null;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryPayload & { active?: boolean }) => Promise<void>;
};

const colors = ['#6D28D9', '#10B981', '#EF4444', '#F59E0B', '#2563EB', '#EC4899'];

export function CategoryFormModal({
  category,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [color, setColor] = useState('#6D28D9');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color ?? '#6D28D9');
      setActive(category.active);
    }
  }, [category]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      await onSubmit({
        name,
        type,
        color,
        active,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 md:items-center md:justify-center md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl md:max-w-lg md:rounded-[2rem]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">Categoria</p>
            <h2 className="text-2xl font-black text-slate-950">
              {category ? 'Editar categoria' : 'Nova categoria'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="Ex: Alimentação"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Receita
            </button>

            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                type === 'EXPENSE'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Despesa
            </button>
          </div>

          <div>
            <span className="mb-2 block text-sm font-bold text-slate-700">Cor</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={`h-10 w-10 rounded-2xl border-4 ${
                    color === item ? 'border-slate-900' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          {category && (
            <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-700">Categoria ativa</span>
              <input
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                type="checkbox"
                className="h-5 w-5 accent-violet-700"
              />
            </label>
          )}

          <button
            disabled={saving}
            className="rounded-2xl bg-violet-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar categoria'}
          </button>
        </div>
      </form>
    </div>
  );
}
