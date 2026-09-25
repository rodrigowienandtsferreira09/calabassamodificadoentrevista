'use client';

import { Spinner } from '@/components/spinner';
import api from '@/lib/api';
import type { ProductKind } from '@/lib/products';
import type { ProductsResponse } from '@/types';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ApparelForm, CoverageForm, HorseForm } from './product-forms';

const KINDS: ProductKind[] = ['coverage', 'horse', 'apparel'];

function FormInner() {
  const sp = useSearchParams();
  const kind = sp.get('kind') || 'coverage';
  const id = sp.get('id')?.trim() || null;
  const [catalog, setCatalog] = useState<ProductsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ProductsResponse>('/admin/products')
      .then(({ data }) => setCatalog(data))
      .catch(() => setErr('Produto não encontrado ou sem permissão.'));
  }, [id]);

  if (!KINDS.includes(kind as ProductKind)) return <p className="p-6 text-zinc-400">Tipo inválido.</p>;
  if (err) return <p className="p-6 text-zinc-400">{err}</p>;

  if (!id) {
    if (kind === 'coverage') return <CoverageForm />;
    if (kind === 'horse') return <HorseForm />;
    return <ApparelForm />;
  }

  if (!catalog) return <Spinner className="min-h-[40vh] bg-zinc-950" />;

  const notFound = <p className="p-6 text-zinc-400">Produto não encontrado ou sem permissão.</p>;
  if (kind === 'coverage') {
    const product = catalog.coverage.find((p) => p.id === id);
    return product ? <CoverageForm product={product} /> : notFound;
  }
  if (kind === 'horse') {
    const product = catalog.horses.find((p) => p.id === id);
    return product ? <HorseForm product={product} /> : notFound;
  }
  const product = catalog.apparel.find((p) => p.id === id);
  return product ? <ApparelForm product={product} /> : notFound;
}

export default function AdminProductFormPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-[40vh] bg-zinc-950" />}>
      <FormInner />
    </Suspense>
  );
}
