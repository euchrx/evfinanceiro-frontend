import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning';
};

const toneClasses = {
  default: 'bg-white text-slate-900',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-red-50 text-red-700',
  warning: 'bg-amber-50 text-amber-700',
};

export function StatCard({ title, value, icon, tone = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-3xl border border-slate-100 p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon}
      </div>
      <strong className="block text-xl font-bold tracking-tight">{value}</strong>
    </div>
  );
}
