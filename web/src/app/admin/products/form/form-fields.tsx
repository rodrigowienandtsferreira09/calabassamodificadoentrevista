'use client';

import api, { getApiError } from '@/lib/api';
import { ADMIN_PRODUCT_ENDPOINT, type ProductKind } from '@/lib/products';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export type BuildResult = { body: Record<string, unknown> } | { error: string };

export function ProductFormShell({
  kind,
  id,
  build,
  children,
}: {
  kind: ProductKind;
  id: string | null;
  build: () => BuildResult;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endpoint = ADMIN_PRODUCT_ENDPOINT[kind];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = build();
    if ('error' in result) {
      setErr(result.error);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      if (id) await api.patch(`${endpoint}/${id}`, result.body);
      else await api.post(endpoint, result.body);
      router.push('/admin/products');
    } catch (error) {
      setErr(getApiError(error, 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Remover este item do catálogo?')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      router.push('/admin/products');
    } catch {
      setErr('Não foi possível remover.');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <Link href="/admin/products" className="text-zinc-100">
          ←
        </Link>
        <h1 className="text-lg font-bold text-zinc-100">{id ? 'Editar produto' : 'Novo produto'}</h1>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 py-6">
        {err && <p className="text-sm text-red-400">{err}</p>}

        {children}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-200 py-4 text-sm font-bold text-zinc-900 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>

        {id && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="w-full rounded-xl border border-red-900/50 py-3 text-sm font-semibold text-red-400"
          >
            Remover do catálogo
          </button>
        )}
      </form>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <input
        required={required}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <textarea
        className="min-h-[88px] w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ActiveCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Disponível na loja (ativo)
    </label>
  );
}
