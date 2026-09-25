'use client';

import { Spinner } from '@/components/spinner';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner className="min-h-screen bg-zinc-950" />;

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
        <p className="text-center text-zinc-400">Acesso restrito a administradores.</p>
        <Link href="/profile" className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-zinc-100">
          Voltar
        </Link>
      </div>
    );
  }

  return children;
}
