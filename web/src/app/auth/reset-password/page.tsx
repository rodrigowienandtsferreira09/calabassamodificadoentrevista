'use client';

import api, { getApiError } from '@/lib/api';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Spinner } from '@/components/spinner';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!tokenFromUrl) {
      setErr('Link inválido. Use o link recebido por e-mail ou solicite um novo.');
      return;
    }
    if (password.length < 8) {
      setErr('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== password2) {
      setErr('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', {
        token: tokenFromUrl,
        password,
      });
      setMsg(data.message || 'Senha alterada.');
      setTimeout(() => router.replace('/auth'), 2000);
    } catch (error) {
      setErr(getApiError(error, 'Não foi possível redefinir a senha.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 md:flex md:items-center md:justify-center md:py-16">
      <div className="mx-auto w-full max-w-md md:rounded-2xl md:border md:border-zinc-800/90 md:bg-zinc-900/40 md:p-10 md:shadow-xl md:shadow-black/40">
        <h1 className="text-2xl font-bold text-zinc-100">Nova senha</h1>
        <p className="mt-2 text-sm text-zinc-500">Defina uma senha forte para sua conta.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
            <Lock className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="password"
              className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600"
              placeholder="Nova senha (mín. 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={Boolean(msg)}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
            <Lock className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="password"
              className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600"
              placeholder="Confirmar nova senha"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              disabled={Boolean(msg)}
            />
          </div>

          {err && <p className="text-center text-sm text-red-400">{err}</p>}
          {msg && <p className="text-center text-sm text-emerald-400/90">{msg}</p>}

          <button
            type="submit"
            disabled={loading || Boolean(msg) || !tokenFromUrl}
            className="w-full rounded-2xl bg-zinc-200 text-zinc-900 py-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? 'Salvando…' : msg ? 'Redirecionando…' : 'Salvar nova senha'}
          </button>
        </form>

        {!tokenFromUrl ? (
          <p className="mt-6 text-center text-sm text-zinc-600">
            <Link href="/auth/forgot-password" className="text-zinc-100 hover:underline">
              Solicitar novo link
            </Link>
          </p>
        ) : null}

        <Link href="/auth" className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          Ir para o login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Spinner className="min-h-screen bg-zinc-950" />
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
