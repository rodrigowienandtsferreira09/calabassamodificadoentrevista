'use client';

import { Spinner } from '@/components/spinner';
import api from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { ADMIN_PRODUCT_ENDPOINT, apparelTypeLabel, type ProductKind } from '@/lib/products';
import type { ProductsResponse } from '@/types';
import { ArrowLeft, Award, FlaskConical, Pencil, Power, Shirt, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/use-api';
import { useState } from 'react';

const TAB_CONFIG: { id: ProductKind; label: string; singular: string; empty: string; Icon: typeof FlaskConical }[] = [
  { id: 'coverage', label: 'Coberturas', singular: 'Cobertura', empty: 'Nenhuma cobertura cadastrada.', Icon: FlaskConical },
  { id: 'horse', label: 'Cavalos', singular: 'Cavalo', empty: 'Nenhum cavalo cadastrado.', Icon: Award },
  { id: 'apparel', label: 'Vestuário', singular: 'Vestuário', empty: 'Nenhum item de vestuário.', Icon: Shirt },
];

type Row = { id: string; name: string; subtitle: string; price: number; isActive: boolean; extra?: string };

function toRows(data: ProductsResponse | null): Record<ProductKind, Row[]> {
  return {
    coverage: (data?.coverage ?? []).map((p) => ({ ...p, subtitle: p.description || '—' })),
    horse: (data?.horses ?? []).map((p) => ({ ...p, subtitle: p.breed })),
    apparel: (data?.apparel ?? []).map((p) => ({ ...p, subtitle: apparelTypeLabel(p.type), extra: `Estoque: ${p.stock}` })),
  };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ProductKind>('coverage');
  const { data, loading, error, reload: load } = useApi<ProductsResponse>('/admin/products');
  const [actionErr, setErr] = useState<string | null>(null);
  const err = actionErr ?? (error ? 'Não foi possível carregar os produtos.' : null);

  async function toggleActive(kind: ProductKind, id: string, next: boolean) {
    try {
      await api.patch(`${ADMIN_PRODUCT_ENDPOINT[kind]}/${id}`, { isActive: next });
      await load();
    } catch {
      setErr('Falha ao atualizar disponibilidade.');
    }
  }

  async function removeFromCatalog(kind: ProductKind, id: string, name: string) {
    if (!confirm(`Remover "${name}" do catálogo? (o produto fica inativo e some da loja)`)) return;
    try {
      await api.delete(`${ADMIN_PRODUCT_ENDPOINT[kind]}/${id}`);
      await load();
    } catch {
      setErr('Falha ao remover produto.');
    }
  }

  const rows = toRows(data);
  const current = TAB_CONFIG.find((t) => t.id === tab)!;

  const activeCount = (list: { isActive: boolean }[]) => list.filter((p) => p.isActive).length;

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Catálogo</p>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">Gerenciar produtos</h1>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-500">
                Preços, disponibilidade na loja e cadastro por categoria.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {!loading && data && (
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
            {TAB_CONFIG.map(({ id, label, Icon }) => {
              const list = rows[id];
              const active = activeCount(list);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-2xl border px-2 py-3 text-left transition sm:px-4 sm:py-4 ${
                    tab === id
                      ? 'border-brand/50 bg-brand/10 ring-1 ring-brand/30'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                        tab === id ? 'bg-brand/25 text-brand-light' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold uppercase tracking-wide text-zinc-400 sm:text-xs">
                        {label}
                      </p>
                      <p className="text-lg font-bold tabular-nums text-zinc-100 sm:text-xl">{list.length}</p>
                      <p className="text-[10px] text-zinc-500 sm:text-xs">
                        {active} ativo{active !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/50 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Novo produto</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {TAB_CONFIG.map(({ id, singular }) => (
              <Link
                key={id}
                href={`/admin/products/form?kind=${id}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-950/60 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-brand/40 hover:bg-zinc-900"
              >
                <span>{singular}</span>
                <span className="text-zinc-500 transition group-hover:text-brand-light">+</span>
              </Link>
            ))}
          </div>
        </section>

        {err && (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-zinc-300">
            {current.label}
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
          >
            Atualizar lista
          </button>
        </div>

        {loading ? (
          <Spinner className="py-20" />
        ) : (
          <ul className="space-y-3">
            {rows[tab].map((p) => (
              <ProductRow
                key={p.id}
                title={p.name}
                subtitle={p.subtitle}
                price={p.price}
                active={p.isActive}
                extra={p.extra}
                onEdit={() => router.push(`/admin/products/form?kind=${tab}&id=${p.id}`)}
                onToggle={() => void toggleActive(tab, p.id, !p.isActive)}
                onRemove={() => void removeFromCatalog(tab, p.id, p.name)}
              />
            ))}
            {rows[tab].length === 0 && <EmptyState message={current.empty} href={`/admin/products/form?kind=${tab}`} />}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, href }: { message: string; href: string }) {
  return (
    <li className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
      <Link href={href} className="mt-3 inline-block text-sm font-semibold text-brand-light hover:underline">
        Criar o primeiro
      </Link>
    </li>
  );
}

function ProductRow({
  title,
  subtitle,
  price,
  active,
  extra,
  onEdit,
  onToggle,
  onRemove,
}: {
  title: string;
  subtitle: string;
  price: number;
  active: boolean;
  extra?: string;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/50 shadow-sm transition hover:border-zinc-700/90">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-zinc-100">{title}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {active ? 'Na loja' : 'Inativo'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">{subtitle}</p>
          {extra && <p className="mt-1.5 text-xs text-zinc-600">{extra}</p>}
          <p className="mt-2 text-base font-bold tabular-nums text-white">
            {formatBRL(price)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-zinc-800/80 pt-4 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-950/50 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-950/50 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
          >
            <Power className="h-3.5 w-3.5" />
            {active ? 'Desativar' : 'Ativar'}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-900/50 bg-red-950/25 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}
