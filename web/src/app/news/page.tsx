'use client';

import api from '@/lib/api';
import type { NewsItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@/components/spinner';
import { formatDate } from '@/lib/format';

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<NewsItem | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const res = await api.get<NewsItem[]>('/news').catch(() => ({ data: [] as NewsItem[] }));
      setNewsItems(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNews();
  }, [fetchNews]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-zinc-100">Destaques</h1>
      </header>

      <div className="px-6 py-6">
        {loading ? (
          <Spinner className="py-16" />
        ) : newsItems.length === 0 ? (
          <p className="text-zinc-500">Nenhuma notícia no momento.</p>
        ) : (
          <div className="space-y-4">
            {newsItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpen(item)}
                className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left"
              >
                <div className="relative h-40 bg-zinc-800">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="font-bold text-zinc-100">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{formatDate(item.createdAt)}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{item.summary}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <span className="text-xs font-bold uppercase text-zinc-100">Notícia</span>
              <button type="button" onClick={() => setOpen(null)} className="p-2 text-zinc-400">
                ✕
              </button>
            </div>
            <div className="p-6">
              {open.imageUrl ? (
                <img src={open.imageUrl} alt="" className="mb-4 h-48 w-full rounded-xl object-cover" />
              ) : null}
              <h2 className="mb-2 text-xl font-bold text-zinc-100">{open.title}</h2>
              <p className="mb-4 text-xs text-zinc-500">{formatDate(open.createdAt)}</p>
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-400">{open.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
