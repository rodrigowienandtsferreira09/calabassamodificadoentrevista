'use client';

import { Spinner } from '@/components/spinner';
import api from '@/lib/api';
import type { NewsItem } from '@/types';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NewsForm } from '../news-form';

export default function AdminNewsEditPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<NewsItem[]>('/news')
      .then(({ data }) => {
        const found = data.find((n) => n.id === id);
        if (found) setItem(found);
        else setError('Notícia não encontrada.');
      })
      .catch(() => setError('Erro ao carregar.'));
  }, [id]);

  if (error) return <p className="p-6 text-center text-zinc-400">{error}</p>;
  if (!item) return <Spinner className="min-h-screen bg-zinc-950" />;

  return (
    <NewsForm
      heading="Editar notícia"
      submitLabel="Salvar alterações"
      initial={item}
      onSubmit={(payload) => api.patch(`/admin/news/${id}`, payload)}
    />
  );
}
