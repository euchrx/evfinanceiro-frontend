import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';

type AuthMode = 'login' | 'register';

type AuthResponse = {
  accessToken: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiErrorResponse;
  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }

  return message ?? fallback;
}

export function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  useEffect(() => {
    const token = localStorage.getItem('@EvFinanceiro:token');

    if (token) {
      navigate('/', {
        replace: true,
      });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isRegister && name.trim().length < 2) {
      setError('Informe seu nome.');
      return;
    }

    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const endpoint = isRegister ? '/auth/register' : '/auth/login';

      const payload = isRegister
        ? {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }
        : {
            email: email.trim().toLowerCase(),
            password,
          };

      const response = await api.post<AuthResponse>(endpoint, payload);

      localStorage.setItem('@EvFinanceiro:token', response.data.accessToken);

      if (response.data.user) {
        localStorage.setItem(
          '@EvFinanceiro:user',
          JSON.stringify(response.data.user),
        );
      }

      navigate('/', {
        replace: true,
      });
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          isRegister
            ? 'Não foi possível criar sua conta.'
            : 'E-mail ou senha inválidos.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setError('');
    setShowPassword(false);
    setPassword('');

    if (mode === 'login') {
      setMode('register');
      return;
    }

    setMode('login');
    setName('');
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
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
        className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-[calc(1rem+env(safe-area-inset-top))] md:grid-cols-[1fr_440px] md:items-center md:px-8 md:py-8"
        style={{ animation: 'evFadeIn 240ms ease-out both' }}
      >
        <section className="flex min-h-[34vh] flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] md:min-h-[620px] md:p-7">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
              <WalletCards size={28} />
            </div>

            <div className="mt-8 max-w-xl">
              <p className="text-base font-bold text-slate-500 md:text-lg">
                EvFinanceiro
              </p>

              <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 md:text-6xl">
                Seu dinheiro no controle.
              </h1>

              <p className="mt-5 max-w-lg text-sm font-medium leading-6 text-slate-500 md:text-base">
                Organize contas, movimentações e investimentos em uma
                experiência simples, limpa e feita para o uso diário.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <ShieldCheck size={19} />
              </div>

              <strong className="block text-sm font-black text-slate-950">
                Seguro
              </strong>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Acesso protegido por autenticação.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={19} />
              </div>

              <strong className="block text-sm font-black text-slate-950">
                Simples
              </strong>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Fluxos diretos para o dia a dia.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <WalletCards size={19} />
              </div>

              <strong className="block text-sm font-black text-slate-950">
                Completo
              </strong>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Contas, extrato e investimentos.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.09)] md:p-6">
          <div className="mb-6">
            <div className="mb-5 inline-flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  if (mode !== 'login') {
                    toggleMode();
                  }
                }}
                disabled={loading}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-black transition',
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500',
                )}
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (mode !== 'register') {
                    toggleMode();
                  }
                }}
                disabled={loading}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-black transition',
                  mode === 'register'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500',
                )}
              >
                Criar conta
              </button>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {isRegister ? 'Criar sua conta' : 'Acessar sua conta'}
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              {isRegister
                ? 'Preencha os dados para começar a usar o EvFinanceiro.'
                : 'Entre para continuar acompanhando sua vida financeira.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            {isRegister ? (
              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Nome
                </span>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-200 focus-within:bg-white">
                  <User size={18} className="text-slate-400" />

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="Seu nome"
                    autoComplete="name"
                    required={isRegister}
                  />
                </div>
              </label>
            ) : null}

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                E-mail
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-200 focus-within:bg-white">
                <Mail size={18} className="text-slate-400" />

                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="seu@email.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </div>
            </label>

            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Senha
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-200 focus-within:bg-white">
                <LockKeyhole size={18} className="text-slate-400" />

                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Digite sua senha"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading
                ? isRegister
                  ? 'Criando conta...'
                  : 'Entrando...'
                : isRegister
                  ? 'Criar conta'
                  : 'Entrar'}

              {!loading ? <ArrowRight size={18} /> : null}
            </button>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="text-sm font-black text-blue-700 transition hover:text-blue-800 disabled:opacity-60"
              >
                {isRegister
                  ? 'Já tem conta? Entrar'
                  : 'Não tem conta? Cadastre-se'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}