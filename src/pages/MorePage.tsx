import {
  ChevronRight,
  FolderTree,
  LogOut,
  Settings,
  ShieldCheck,
  Tags,
  User,
  WalletCards,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type MoreItem = {
  to: string;
  label: string;
  description: string;
  icon: typeof WalletCards;
  group: 'finance' | 'account';
};

const items: MoreItem[] = [
  {
    to: '/accounts',
    label: 'Contas',
    description: 'Bancos, carteiras e cartões',
    icon: WalletCards,
    group: 'finance',
  },
  {
    to: '/categories',
    label: 'Categorias',
    description: 'Receitas e despesas',
    icon: Tags,
    group: 'finance',
  },
  {
    to: '/transactions',
    label: 'Movimentações',
    description: 'Receitas, despesas e transferências',
    icon: FolderTree,
    group: 'finance',
  },
  {
    to: '/profile',
    label: 'Perfil',
    description: 'Dados da sua conta',
    icon: User,
    group: 'account',
  },
  {
    to: '/settings',
    label: 'Configurações',
    description: 'Preferências do app',
    icon: Settings,
    group: 'account',
  },
];

const financeItems = items.filter((item) => item.group === 'finance');
const accountItems = items.filter((item) => item.group === 'account');

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ShortcutCardProps = {
  item: MoreItem;
};

function ShortcutCard({ item }: ShortcutCardProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className="group flex items-center gap-3 rounded-[1.55rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-black text-slate-950">
          {item.label}
        </h2>

        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {item.description}
        </p>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-700">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}

type ShortcutSectionProps = {
  title: string;
  description: string;
  items: MoreItem[];
};

function ShortcutSection({ title, description, items }: ShortcutSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
      <div className="mb-4">
        <h2 className="text-lg font-black tracking-tight text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-500">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ShortcutCard key={item.to} item={item} />
        ))}
      </div>
    </section>
  );
}

export function MorePage() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('@EvFinanceiro:token');
    localStorage.removeItem('@EvFinanceiro:user');

    navigate('/login', {
      replace: true,
    });
  }

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
        <header>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
            Mais
          </h1>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="grid grid-cols-[6px_1fr]">
            <div className="bg-blue-700" />

            <div className="p-5 md:p-7">
              <div className="max-w-3xl">
                <p className="text-base font-bold text-slate-500 md:text-lg">
                  Central do app
                </p>

                <strong className="mt-2 block text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">
                  EvFinanceiro
                </strong>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                    <ShieldCheck size={14} />
                    Área segura
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    <WalletCards size={14} />
                    Organização financeira
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.055)]">
          <div className="grid grid-cols-[5px_1fr]">
            <div className="bg-blue-700" />

            <div className="p-5">
              <p className="text-sm font-semibold text-slate-500">
                Atalhos e preferências
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                Gerencie seu app em um só lugar
              </h2>

              <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
                Acesse rapidamente suas contas, categorias, movimentações,
                perfil e preferências do EvFinanceiro.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <FolderTree size={14} />
                  {financeItems.length} atalhos financeiros
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                  <Settings size={14} />
                  {accountItems.length} opções da conta
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 space-y-5">
          <ShortcutSection
            title="Financeiro"
            description="Organize as principais áreas do seu controle financeiro."
            items={financeItems}
          />

          <ShortcutSection
            title="Conta e aplicativo"
            description="Ajuste seus dados, segurança e preferências."
            items={accountItems}
          />

          <section className="rounded-[2rem] border border-red-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-[1.55rem] border border-red-100 bg-red-50 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-red-100"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-700">
                <LogOut size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-black text-red-700">
                  Sair da conta
                </h2>

                <p className="mt-1 truncate text-xs font-medium text-red-700/70">
                  Encerrar sessão neste dispositivo
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500 transition group-hover:text-red-700">
                <ChevronRight size={18} />
              </div>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}