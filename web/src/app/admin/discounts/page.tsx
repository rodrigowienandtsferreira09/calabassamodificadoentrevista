'use client';

import { Spinner } from '@/components/spinner';
import { useApi } from '@/hooks/use-api';
import api from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/format';
import { ArrowLeft, Pencil, Percent, Plus, Power, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DiscountFormModal, type DiscountCode } from './discount-form-modal';

export default function AdminDiscountsPage() {
  const router = useRouter();
  const { data, loading, error, reload: load } = useApi<DiscountCode[]>('/admin/discounts');
  const discounts = data ?? [];
  const err = error ? 'Não foi possível carregar os cupons.' : null;

  const [editing, setEditing] = useState<DiscountCode | 'new' | null>(null);

  async function toggleActive(id: string, next: boolean) {
    try {
      await api.patch(`/admin/discounts/${id}`, { isActive: next });
      await load();
    } catch {}
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-12">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <button type="button" onClick={() => router.back()} className="text-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-zinc-100">Cupons de Desconto</h1>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="ml-auto flex items-center gap-2 rounded-xl bg-zinc-200 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-zinc-300"
        >
          <Plus className="h-4 w-4" />
          Novo Cupom
        </button>
      </header>

      {editing && (
        <DiscountFormModal
          discount={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}

      <div className="px-4 py-6">
        {loading && (
          <Spinner className="py-24" />
        )}

        {err && (
          <p className="py-12 text-center text-sm text-red-400">{err}</p>
        )}

        {!loading && !err && discounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 shadow-inner shadow-black/40">
              <Tag className="h-9 w-9 text-zinc-600" />
            </div>
            <p className="text-xl font-bold text-zinc-100">Nenhum cupom criado</p>
            <p className="mt-2 text-sm text-zinc-500">Crie seu primeiro cupom de desconto.</p>
          </div>
        )}

        {!loading && !err && discounts.length > 0 && (
          <div className="space-y-3">
            {discounts.map((dc) => {
              const isExpired = dc.expiresAt && new Date(dc.expiresAt) < new Date();
              const isMaxed = dc.maxUses != null && dc.usedCount >= dc.maxUses;
              const statusColor = !dc.isActive
                ? 'text-zinc-600'
                : isExpired || isMaxed
                  ? 'text-accent'
                  : 'text-emerald-400';
              const statusLabel = !dc.isActive
                ? 'Inativo'
                : isExpired
                  ? 'Expirado'
                  : isMaxed
                    ? 'Esgotado'
                    : 'Ativo';

              return (
                <div
                  key={dc.id}
                  className={`rounded-2xl border bg-zinc-900/90 p-4 shadow-md shadow-black/25 transition ${
                    dc.isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-lg bg-zinc-800 px-3 py-1 font-mono text-sm font-bold text-zinc-100 tracking-wider">
                          {dc.code}
                        </span>
                        <span className={`text-xs font-bold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {dc.description && (
                        <p className="text-xs text-zinc-500 mt-1">{dc.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span>
                          {dc.type === 'PERCENTAGE' ? (
                            <><Percent className="inline h-3 w-3 mr-0.5" />{dc.value}%</>
                          ) : (
                            <>{formatBRL(dc.value)}</>
                          )}
                        </span>
                        {dc.includeFreight && <span className="text-emerald-400">Inclui frete</span>}
                        {dc.minOrderAmount != null && (
                          <span>Mín. {formatBRL(dc.minOrderAmount)}</span>
                        )}
                        <span>
                          {dc.usedCount} uso{dc.usedCount !== 1 ? 's' : ''}
                          {dc.maxUses != null ? ` / ${dc.maxUses}` : ''}
                        </span>
                        {dc.expiresAt && (
                          <span>Até {formatDate(dc.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing(dc)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(dc.id, !dc.isActive)}
                        className={`rounded-lg border p-2 ${
                          dc.isActive
                            ? 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        }`}
                        title={dc.isActive ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
