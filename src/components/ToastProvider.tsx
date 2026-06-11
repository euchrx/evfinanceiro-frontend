import {
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  error: 'border-red-100 bg-red-50 text-red-800',
  info: 'border-violet-100 bg-violet-50 text-violet-800',
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function remove(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function add(type: ToastType, title: string, description?: string) {
    const id = crypto.randomUUID();

    setToasts((current) => [
      ...current,
      {
        id,
        type,
        title,
        description,
      },
    ]);

    window.setTimeout(() => {
      remove(id);
    }, 3500);
  }

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, description) => add('success', title, description),
      error: (title, description) => add('error', title, description),
      info: (title, description) => add('info', title, description),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed left-4 right-4 top-4 z-[999] space-y-3 md:left-auto md:right-6 md:w-96">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-3xl border p-4 shadow-xl shadow-slate-950/10 backdrop-blur ${toastStyles[toast.type]}`}
            >
              <Icon size={22} className="mt-0.5 shrink-0" />

              <div className="min-w-0 flex-1">
                <strong className="block text-sm font-black">{toast.title}</strong>
                {toast.description && (
                  <p className="mt-1 text-xs leading-5 opacity-80">{toast.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="rounded-full p-1 opacity-70 hover:bg-white/50 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }

  return context;
}
