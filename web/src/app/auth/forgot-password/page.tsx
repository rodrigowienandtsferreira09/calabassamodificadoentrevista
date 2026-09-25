'use client';

import api from '@/lib/api';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!email.trim()) {
      setErr('Informe seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
        email: email.trim(),
      });
      setMsg(data.message || 'Verifique sua caixa de entrada.');
    } catch {
      setErr('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 md:flex md:items-center md:justify-center md:py-16">
      <div className="mx-auto w-full max-w-md md:rounded-2xl md:border md:border-zinc-800/90 md:bg-zinc-900/40 md:p-10 md:shadow-xl md:shadow-black/40">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <h1 className="text-2xl font-bold text-zinc-100">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Enviaremos um link para o seu e-mail para definir uma nova senha (se a conta existir).
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
            <Mail className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="email"
              className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600"
              placeholder="Seu e-mail cadastrado"
              autoCapitalize="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(msg)}
            />
          </div>

          {err && <p className="text-center text-sm text-red-400">{err}</p>}
          {msg && <p className="text-center text-sm leading-relaxed text-emerald-400/90">{msg}</p>}

          <button
            type="submit"
            disabled={loading || Boolean(msg)}
            className="w-full rounded-2xl bg-zinc-200 text-zinc-900 py-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? 'Enviando…' : msg ? 'E-mail enviado' : 'Enviar link'}
          </button>
        </form>

        <Link href="/auth" className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
