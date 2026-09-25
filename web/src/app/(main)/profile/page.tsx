'use client';

import { useAuth } from '@/context/auth-context';
import { BarChart2, FileText, LogOut, Package, Settings, Tag, Truck, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.replace('/');
  }

  const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : 'Conta Comprador';

  return (
    <div className="min-h-screen pb-28 pt-6 md:pb-16 md:pt-8">
      <div className="mb-10 flex flex-col items-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 shadow-[0_0_0_2px_rgba(217,119,6,0.55)]">
          <User className="h-10 w-10 text-zinc-100" />
        </div>
        <p className="text-2xl font-bold text-zinc-100">{user?.name || 'Visitante'}</p>
        <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{roleLabel}</p>
      </div>

      {!user && (
        <Link
          href="/auth"
          className="mb-8 block rounded-2xl bg-zinc-200 text-zinc-900 py-4 text-center font-bold text-black"
        >
          Entrar ou criar conta
        </Link>
      )}

      {user?.role === 'ADMIN' && (
        <section className="mb-8">
          <p className="mb-3 ml-1 text-xs font-bold uppercase text-zinc-400">Painel Administrativo</p>
          <div className="space-y-3">
            <RowLink href="/admin/news" icon={FileText} title="Gerenciar notícias" subtitle="Alterar notícias da home" />
            <RowLink
              href="/admin/products"
              icon={Package}
              title="Gerenciar produtos"
              subtitle="Criar, editar, preços, estoque e disponibilidade"
            />
            <RowLink
              href="/admin/orders"
              icon={Truck}
              title="Gerenciar entregas"
              subtitle="Atualizar status dos pedidos e rastreio"
            />
            <RowLink href="/admin/reports" icon={BarChart2} title="Relatórios" subtitle="Vendas e catálogo" />
            <RowLink href="/admin/discounts" icon={Tag} title="Cupons de desconto" subtitle="Criar e gerenciar cupons" />
          </div>
        </section>
      )}

      {user && (
        <section className="mb-6">
          <p className="mb-3 ml-1 text-xs font-bold uppercase text-zinc-400">Minhas Atividades</p>
          <Link
            href="/buyer/orders"
            className="flex items-center justify-between rounded-2xl bg-zinc-900/90 p-4 shadow-md shadow-black/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                <Package className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-zinc-100">Meus Pedidos</p>
                <p className="text-xs text-zinc-500">Acompanhar entregas</p>
              </div>
            </div>
            <span className="text-zinc-600">›</span>
          </Link>
        </section>
      )}

      {user && (
        <section>
          <p className="mb-3 ml-1 text-xs font-bold uppercase text-zinc-400">Conta</p>
          <div className="space-y-3">
            <Link
              href="/settings"
              className="flex items-center justify-between rounded-2xl bg-zinc-900/90 p-4 shadow-md shadow-black/20 transition hover:bg-zinc-800/80"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-zinc-300" />
                <span className="font-medium text-zinc-100">Configurações</span>
              </div>
              <span className="text-zinc-600">›</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl bg-zinc-900/90 p-4 text-left shadow-md shadow-black/20"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-500">Sair da Conta</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function RowLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl bg-zinc-900/90 p-4 shadow-md shadow-black/20 transition hover:bg-zinc-800/80"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-900">
          <Icon className="h-5 w-5 text-zinc-100" />
        </div>
        <div>
          <p className="font-bold text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <span className="text-zinc-600">›</span>
    </Link>
  );
}
