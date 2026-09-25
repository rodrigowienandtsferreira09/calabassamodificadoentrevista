'use client';

import api, { getApiError } from '@/lib/api';
import type { AuthResponse } from '@/types';
import { useAuth } from '@/context/auth-context';
import { Lock, Mail, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/spinner';

export default function AuthPage() {
  const { signIn, signed, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && signed) router.replace('/');
  }, [signed, authLoading, router]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email || !password || (!isLogin && !name)) {
      setMsg('Preencha todos os campos.');
      return;
    }
    setLocalLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        router.replace('/');
      } else {
        const { data } = await api.post<AuthResponse>('/register', {
          name,
          email,
          password,
        });
        setMsg(data.message || 'Conta criada!');
        setIsLogin(true);
        setName('');
        setPassword('');
      }
    } catch (error) {
      setMsg(getApiError(error, 'Erro ao conectar.'));
    } finally {
      setLocalLoading(false);
    }
  }

  if (authLoading) {
    return (
      <Spinner className="min-h-screen bg-zinc-950" />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 md:flex md:items-center md:justify-center md:py-16">
      <div className="mx-auto w-full max-w-md md:rounded-2xl md:border md:border-zinc-800/90 md:bg-zinc-900/40 md:p-10 md:shadow-xl md:shadow-black/40 md:backdrop-blur-sm">
        <div className="mb-10 flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Logo Haras Exemplo"
            width={260}
            height={72}
            className="h-12 w-auto object-contain"
            priority
          />
          <p className="mt-1 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Catálogo Oficial
          </p>
        </div>

        <div className="mb-8 flex rounded-full border border-zinc-800 bg-zinc-900 p-1.5">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-full py-3 text-xs font-bold ${
              isLogin ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            ENTRAR
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-full py-3 text-xs font-bold ${
              !isLogin ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            CRIAR CONTA
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
              <User className="h-5 w-5 shrink-0 text-zinc-500" />
              <input
                className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
            <Mail className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="email"
              className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600"
              placeholder="E-mail"
              autoCapitalize="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
              <Lock className="h-5 w-5 shrink-0 text-zinc-500" />
              <input
                type="password"
                className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isLogin ? (
              <div className="flex justify-end px-0.5">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-zinc-100 underline decoration-accent/40 underline-offset-4 hover:text-accent hover:decoration-accent"
                >
                  Esqueci minha senha
                </Link>
              </div>
            ) : null}
          </div>

          {msg && <p className="text-center text-sm text-zinc-100/90">{msg}</p>}

          <button
            type="submit"
            disabled={localLoading}
            className="mt-4 w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-50"
          >
            {localLoading ? '…' : isLogin ? 'ENTRAR' : 'CADASTRAR'}
          </button>
        </form>

        <Link href="/" className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
