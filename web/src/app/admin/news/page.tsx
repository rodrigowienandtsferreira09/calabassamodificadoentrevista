'use client';

import { Spinner } from '@/components/spinner';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { NewsItem } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/use-api';

export default function AdminNewsPage() {
  const router = useRouter();
  const { data, loading, reload } = useApi<NewsItem[]>('/news');
  const items = data ?? [];

  async function handleDelete(item: NewsItem) {
    if (!confirm(`Excluir "${item.title}"?`)) return;
    try {
      await api.delete(`/admin/news/${item.id}`);
      await reload();
    } catch {
      alert('Não foi possível excluir.');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-12">
      <header className="flex items-center justify-between border-b border-zinc-900 px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="text-zinc-100">
            ←
          </button>
          <h1 className="text-xl font-bold text-zinc-100">Notícias</h1>
        </div>
        <Link href="/admin/news/new" className="text-sm font-bold text-zinc-100">
          + Nova
        </Link>
      </header>

      <div className="px-5 py-6">
        {loading ? (
          <Spinner className="py-16" />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <Link href={`/admin/news/${item.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-bold text-zinc-100">{item.title}</p>
                  <p className="text-xs text-zinc-500">{formatDate(item.createdAt)}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  className="shrink-0 text-red-500"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
