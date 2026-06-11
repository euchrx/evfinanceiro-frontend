import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
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

  useEffect(() => {
  const token = localStorage.getItem('@EvFinanceiro:token');

  if (token) {
    navigate('/', {
      replace: true,
    });
  }
}, [navigate]);

  const isRegister = mode === 'register';

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
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between">
        <div>
          <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
            <WalletCards size={28} />
          </div>

          <p className="mb-2 text-sm font-medium text-violet-100">
            EvFinanceiro
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Seu dinheiro no controle.
          </h1>

          <p className="mt-4 text-sm leading-6 text-violet-100">
            Acompanhe receitas, despesas, contas e investimentos em uma
            experiência simples e mobile.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-[2rem] bg-white p-5 text-slate-900 shadow-2xl shadow-violet-950/30"
        >
          <h2 className="mb-1 text-xl font-black">
            {isRegister ? 'Criar conta' : 'Entrar'}
          </h2>

          <p className="mb-5 text-sm text-slate-500">
            {isRegister
              ? 'Cadastre-se para começar a usar o EvFinanceiro.'
              : 'Acesse sua conta para continuar.'}
          </p>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {isRegister && (
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Nome
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <User size={18} className="text-slate-400" />

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Seu nome"
                  autoComplete="name"
                  required={isRegister}
                />
              </div>
            </label>
          )}

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              E-mail
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Mail size={18} className="text-slate-400" />

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
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
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Senha
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <LockKeyhole size={18} className="text-slate-400" />

              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Digite sua senha"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-violet-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:opacity-60"
          >
            {loading
              ? isRegister
                ? 'Criando conta...'
                : 'Entrando...'
              : isRegister
                ? 'Criar conta'
                : 'Entrar'}
          </button>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              className="text-sm font-bold text-violet-700 disabled:opacity-60"
            >
              {isRegister
                ? 'Já tem conta? Entrar'
                : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}