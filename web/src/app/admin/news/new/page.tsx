'use client';

import api from '@/lib/api';
import { NewsForm } from '../news-form';

export default function AdminNewsNewPage() {
  return (
    <NewsForm
      heading="Nova notícia"
      submitLabel="Salvar"
      onSubmit={(payload) => api.post('/admin/news', payload)}
    />
  );
}
