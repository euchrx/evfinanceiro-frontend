import { AlertTriangle, X } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: 'danger' | 'default';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[900] flex items-end bg-slate-950/50 md:items-center md:justify-center md:p-6">
      <div className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl md:max-w-md md:rounded-[2rem]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                tone === 'danger'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-violet-50 text-violet-700'
              }`}
            >
              <AlertTriangle size={22} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">{title}</h2>

              {description && (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60 ${
              tone === 'danger'
                ? 'bg-red-600 shadow-red-200'
                : 'bg-violet-700 shadow-violet-200'
            }`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}