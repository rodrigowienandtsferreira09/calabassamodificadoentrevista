'use client';

import { Spinner } from '@/components/spinner';
import { useApi } from '@/hooks/use-api';
import { formatBRL, parseMoneyInput } from '@/lib/format';
import { ITEM_TYPE_LABEL } from '@/lib/orders';
import { catalogItems, productHref, type CatalogItem } from '@/lib/products';
import type { ProductsResponse } from '@/types';
import { Frown, ImageIcon, Search, Sliders, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function matchesQuery(item: CatalogItem, query: string) {
  const q = normalize(query);
  return !q || item.searchText.some((chunk) => normalize(chunk).includes(q));
}

export default function SearchPage() {
  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { data: catalog, loading: loadingCatalog, error: loadError } = useApi<ProductsResponse>('/products');
  const [modalOpen, setModalOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const allItems = useMemo(() => (catalog ? catalogItems(catalog) : []), [catalog]);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    return allItems.filter((item) => {
      if (!matchesQuery(item, debouncedQuery)) return false;
      if (appliedMin != null && item.price < appliedMin) return false;
      if (appliedMax != null && item.price > appliedMax) return false;
      return true;
    });
  }, [allItems, appliedMax, appliedMin, debouncedQuery]);

  const hasPriceFilter = appliedMin != null || appliedMax != null;

  function applyFilters() {
    setAppliedMin(parseMoneyInput(minPrice));
    setAppliedMax(parseMoneyInput(maxPrice));
    setModalOpen(false);
  }

  function clearFilters() {
    setMinPrice('');
    setMaxPrice('');
    setAppliedMin(null);
    setAppliedMax(null);
    setModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-4 md:pt-6">
      <h1 className="mb-4 text-2xl font-bold text-zinc-100 md:text-3xl">Buscar</h1>

      <div className="mb-6 flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-zinc-900/90 px-4 py-3 shadow-md shadow-black/25">
          <Search className="h-5 w-5 shrink-0 text-zinc-500" />
          <input
            className="w-full bg-transparent font-medium text-zinc-100 placeholder:text-zinc-600"
            placeholder="Nome, cobertura, camiseta, boné..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText.length > 0 && (
            <button type="button" onClick={() => setSearchText('')}>
              <XCircle className="h-4 w-4 text-zinc-500" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md shadow-black/25 ${
            hasPriceFilter ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-900/90'
          }`}
        >
          <Sliders className={`h-5 w-5 ${hasPriceFilter ? 'text-zinc-100' : 'text-zinc-500'}`} />
        </button>
      </div>

      {loadingCatalog && <Spinner className="py-10" />}

      {loadError && !loadingCatalog && (
        <p className="text-center text-sm text-zinc-500">Não foi possível carregar o catálogo. Tente novamente.</p>
      )}

      {!loadingCatalog && !loadError && debouncedQuery.length > 0 && results.length === 0 && (
        <div className="mt-10 flex flex-col items-center opacity-50">
          <Frown className="h-12 w-12 text-zinc-500" />
          <p className="mt-4 text-center text-zinc-500">
            Nenhum produto encontrado para &quot;{debouncedQuery}&quot;.
          </p>
        </div>
      )}

      <ul className="space-y-3 pb-24">
        {results.map((item) => (
          <li key={`${item.itemType}:${item.id}`}>
            <Link
              href={productHref(item)}
              className="group flex items-center gap-3 rounded-2xl bg-zinc-900/90 p-3 shadow-md shadow-black/25"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className={`h-full w-full object-cover ${
                      item.hoverImage ? 'transition-opacity duration-200 group-hover:opacity-0' : ''
                    }`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-zinc-600" />
                  </div>
                )}
                {item.hoverImage && (
                  <img
                    src={item.hoverImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-zinc-100">{item.title}</p>
                <p className="text-xs uppercase text-zinc-500">{item.cardSubtitle}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  {ITEM_TYPE_LABEL[item.itemType]}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-zinc-100">{formatBRL(item.price)}</p>
            </Link>
          </li>
        ))}
      </ul>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80">
          <div className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-zinc-900 p-6 shadow-2xl shadow-black/60">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Filtrar por preço</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 text-zinc-400">
                ✕
              </button>
            </div>
            <p className="mb-3 font-bold text-zinc-400">Faixa de preço (todos os produtos)</p>
            <div className="mb-8 flex gap-4">
              <div className="flex-1">
                <p className="mb-1 text-xs text-zinc-500">Mínimo</p>
                <input
                  className="w-full rounded-xl bg-zinc-950/90 p-3 text-zinc-100 shadow-inner shadow-black/30"
                  placeholder="Ex: 100 ou 100,50"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs text-zinc-500">Máximo</p>
                <input
                  className="w-full rounded-xl bg-zinc-950/90 p-3 text-zinc-100 shadow-inner shadow-black/30"
                  placeholder="Ex: 5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={applyFilters}
              className="mb-3 w-full rounded-xl bg-zinc-200 py-4 font-bold text-zinc-900"
            >
              Aplicar filtros
            </button>
            <button type="button" onClick={clearFilters} className="w-full py-3 text-zinc-500">
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
