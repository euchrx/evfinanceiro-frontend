import type { FormEvent } from 'react';
import { useState } from 'react';
import { Eye, LockKeyhole, Mail, User, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';

type AuthMode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@evfinanceiro.local');
  const [password, setPassword] = useState('admin123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const endpoint = isRegister ? '/auth/register' : '/auth/login';

      const payload = isRegister
        ? {
            name,
            email,
            password,
          }
        : {
            email,
            password,
          };

      const response = await api.post(endpoint, payload);

      localStorage.setItem('@EvFinanceiro:token', response.data.accessToken);

      navigate('/');
    } catch {
      setError(
        isRegister
          ? 'Não foi possível criar sua conta.'
          : 'E-mail ou senha inválidos.',
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setError('');

    if (mode === 'login') {
      setMode('register');
      setEmail('');
      setPassword('');
      return;
    }

    setMode('login');
    setEmail('admin@evfinanceiro.local');
    setPassword('admin123');
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
                type="password"
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Digite sua senha"
                minLength={6}
                required
              />

              <Eye size={18} className="text-slate-400" />
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
              className="text-sm font-bold text-violet-700"
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