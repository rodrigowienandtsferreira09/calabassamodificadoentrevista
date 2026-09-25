'use client';

import { ImageCropModal } from '@/components/ImageCropModal';
import { getApiError, uploadFile } from '@/lib/api';
import type { NewsItem } from '@/types';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export type NewsPayload = {
  title: string;
  summary: string;
  body: string;
  imageUrl?: string;
  order: number;
};

type Props = {
  heading: string;
  submitLabel: string;
  initial?: NewsItem;
  onSubmit: (payload: NewsPayload) => Promise<unknown>;
};

const inputClass = 'w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-100';

export function NewsForm({ heading, submitLabel, initial, onSubmit }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function closeCropModal() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) setCropSrc(URL.createObjectURL(f));
  }

  async function onCropped(blob: Blob) {
    closeCropModal();
    setUploadingImage(true);
    setErr(null);
    try {
      setImageUrl(await uploadFile('/admin/news/upload', blob, 'news.jpg'));
    } catch (e) {
      setErr(getApiError(e, 'Falha ao enviar imagem.'));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !body.trim()) {
      setErr('Preencha título, resumo e corpo.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSubmit({
        title: title.trim(),
        summary: summary.trim(),
        body: body.trim(),
        imageUrl: imageUrl || undefined,
        order: parseInt(order, 10) || 0,
      });
      router.push('/admin/news');
    } catch (e) {
      setErr(getApiError(e, 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-12">
      {cropSrc ? (
        <ImageCropModal
          open
          imageSrc={cropSrc}
          aspect={16 / 9}
          title="Ajustar imagem da notícia (16:9)"
          onClose={closeCropModal}
          onCropped={onCropped}
        />
      ) : null}

      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <button type="button" onClick={() => router.back()} className="text-zinc-100">
          ←
        </button>
        <h1 className="text-xl font-bold text-zinc-100">{heading}</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-4 px-6 py-6">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Imagem</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-800 bg-zinc-900"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : uploadingImage ? (
              <span className="text-zinc-500">Enviando...</span>
            ) : (
              <span className="text-sm text-zinc-500">Clique para escolher imagem</span>
            )}
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Título</p>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Resumo</p>
          <input className={inputClass} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Corpo</p>
          <textarea className={`min-h-[120px] ${inputClass}`} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Ordem</p>
          <input className={inputClass} value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" />
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-200 py-4 font-bold text-zinc-900 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : submitLabel}
        </button>
      </form>
    </div>
  );
}
