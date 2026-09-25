'use client';

import { buildProductSections, ProductSections } from '@/components/product-sections';
import { StoryCarousel } from '@/components/story-carousel';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { formatDate } from '@/lib/format';
import type { NewsItem, ProductsResponse } from '@/types';
import { ChevronRight, Mail, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const { data: products, loading } = useApi<ProductsResponse>('/products');
  const { data: news } = useApi<NewsItem[]>('/news');
  const productSections = useMemo(() => (products ? buildProductSections(products) : []), [products]);
  const newsItems = news ?? [];
  const [newsOpen, setNewsOpen] = useState<NewsItem | null>(null);
  const coverageSections = productSections.filter((section) => section.title === 'Coberturas');

  return (
    <div className="min-h-screen">
      <div className="pb-10 pt-4 md:pt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400 md:text-base">
            Bem-vindo,{' '}
            <span className="font-semibold text-zinc-100">{user?.name || 'Visitante'}</span>
          </p>
          {!user && (
            <Link
              href="/auth"
              className="w-fit rounded-xl bg-zinc-200 text-zinc-900 px-4 py-2.5 text-sm font-bold text-black shadow-md shadow-black/20 md:hidden"
            >
              Entrar
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pb-1 md:gap-3">
          <Link
            href="/news"
            className="flex shrink-0 items-center gap-2 rounded-full bg-zinc-900/90 py-2 pl-3 pr-4 font-sans transition hover:bg-zinc-800/90"
          >
            <Star className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">Destaques</span>
          </Link>
          <Link
            href="/search"
            className="flex shrink-0 items-center gap-2 rounded-full bg-zinc-900/90 py-2 pl-3 pr-4 font-sans transition hover:bg-zinc-800/90"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">Buscar</span>
          </Link>
          <Link
            href="/contact"
            className="flex shrink-0 items-center gap-2 rounded-full bg-zinc-900/90 py-2 pl-3 pr-4 font-sans transition hover:bg-zinc-800/90"
          >
            <Mail className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">Contato</span>
          </Link>
        </div>
      </div>

      <div className="pb-10 pt-2 md:pb-12">
        <p className="mb-3 text-sm font-bold text-zinc-500 md:text-base">Notícias</p>
        {newsItems.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhuma notícia no momento.</p>
        ) : (
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-4 pb-2 [-webkit-overflow-scrolling:touch] md:-mx-0 md:px-0"
            role="region"
            aria-label="Notícias em carrossel horizontal"
          >
            {newsItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setNewsOpen(item)}
                className="w-48 shrink-0 snap-start overflow-hidden rounded-xl bg-zinc-900/70 text-left transition hover:bg-zinc-900 md:w-52"
              >
                <div className="relative h-20 bg-zinc-800/30 md:h-24">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">📰</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 font-sans text-xs font-medium text-zinc-400">{item.title}</p>
                  <p className="mt-0.5 font-sans text-[9px] text-zinc-600">{formatDate(item.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="pb-6">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Haras Exemplo</p>
          <h2 className="mt-2 text-xl font-bold text-zinc-100 md:text-3xl">Nossa história</h2>
          <p className="mt-3 text-sm text-zinc-400 md:text-base">Conheça a trajetória do Haras Exemplo.</p>

          <StoryCarousel />

          <Link
            href="/historia"
            className="group mt-5 inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand transition hover:gap-2"
          >
            Saiba mais sobre nossa história
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="pt-6 md:pt-8">
        <h2 className="text-xl font-bold text-zinc-100 md:text-2xl">Coberturas</h2>
        <p className="mb-5 mt-1 font-sans text-sm text-zinc-500 md:mb-6 md:text-base">
          Coberturas dos garanhões do Haras Exemplo
        </p>

        <ProductSections
          sections={coverageSections}
          loading={loading}
          emptyText="Nenhuma cobertura disponível no momento."
        />

        <Link
          href="/produtos"
          className="group mx-auto mt-8 flex w-fit items-center gap-1 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/20 transition hover:gap-2 hover:bg-zinc-800 md:text-base"
        >
          Confira mais produtos
          <ChevronRight className="h-4 w-4 text-brand" />
        </Link>
      </div>

      {newsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 md:items-center md:p-6"
          role="dialog"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-zinc-900 shadow-2xl shadow-black/50 md:rounded-2xl">
            <div className="flex items-center justify-between p-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">Notícia</span>
              <button
                type="button"
                onClick={() => setNewsOpen(null)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {newsOpen.imageUrl ? (
                <img src={newsOpen.imageUrl} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />
              ) : null}
              <h3 className="mb-2 font-sans text-xl font-bold text-zinc-100">{newsOpen.title}</h3>
              <p className="mb-4 font-sans text-xs text-zinc-500">{formatDate(newsOpen.createdAt)}</p>
              <p className="font-sans whitespace-pre-wrap leading-relaxed text-zinc-400">{newsOpen.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
