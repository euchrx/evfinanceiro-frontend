import {
  FolderTree,
  LogOut,
  Settings,
  Tags,
  User,
  WalletCards,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const items = [
  {
    to: '/accounts',
    label: 'Contas',
    description: 'Bancos, carteiras e cartões',
    icon: WalletCards,
  },
  {
    to: '/categories',
    label: 'Categorias',
    description: 'Receitas e despesas',
    icon: Tags,
  },
  {
    to: '/transactions',
    label: 'Movimentações',
    description: 'Receitas, despesas e transferências',
    icon: FolderTree,
  },
  {
    to: '/profile',
    label: 'Perfil',
    description: 'Dados da sua conta',
    icon: User,
  },
  {
    to: '/settings',
    label: 'Configurações',
    description: 'Preferências do app',
    icon: Settings,
  },
];

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
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <section className="rounded-b-[2.5rem] bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 pb-8 pt-7 text-white md:rounded-none md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-violet-100">EvFinanceiro</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Mais</h1>
          <p className="mt-2 text-sm text-violet-100">
            Atalhos, organização e configurações.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-3 px-5 py-6 md:px-8">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Icon size={22} />
              </div>

              <div>
                <h2 className="font-black text-slate-950">{item.label}</h2>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </div>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[2rem] border border-red-100 bg-white p-4 text-left shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <LogOut size={22} />
          </div>

          <div>
            <h2 className="font-black text-red-700">Sair</h2>
            <p className="mt-1 text-xs text-slate-500">Encerrar sessão</p>
          </div>
        </button>
      </section>
    </div>
  );
}
