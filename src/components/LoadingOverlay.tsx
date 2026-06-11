type LoadingOverlayProps = {
  show: boolean;
  label?: string;
};

export function LoadingOverlay({ show, label = 'Carregando...' }: LoadingOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[950] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="rounded-[2rem] bg-white p-6 text-center shadow-2xl shadow-slate-950/10">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
        <p className="text-sm font-bold text-slate-700">{label}</p>
      </div>
    </div>
  );
}
