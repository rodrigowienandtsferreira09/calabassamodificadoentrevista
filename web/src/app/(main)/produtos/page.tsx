'use client';

import { buildProductSections, ProductSections } from '@/components/product-sections';
import { useApi } from '@/hooks/use-api';
import type { ProductsResponse } from '@/types';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProdutosPage() {
  const { data, loading } = useApi<ProductsResponse>('/products');
  const sections = data ? buildProductSections(data) : [];

  return (
    <div className="min-h-screen pb-10 pt-4 md:pt-6">
      <Link
        href="/"
        className="group mb-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao início
      </Link>

      <h2 className="text-xl font-bold text-zinc-100 md:text-2xl">Produtos</h2>
      <p className="mb-5 mt-1 font-sans text-sm text-zinc-500 md:mb-6 md:text-base">
        Cobertura, cavalos, camisetas e bonés oficiais
      </p>

      <ProductSections sections={sections} loading={loading} />
    </div>
  );
}
