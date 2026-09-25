'use client';

import { ImageCropModal } from '@/components/ImageCropModal';
import { getApiError, uploadFile } from '@/lib/api';
import { useRef, useState } from 'react';

export const ADMIN_PRODUCT_CROP_ASPECT = 4 / 3;

const UPLOAD_ENDPOINT = '/admin/upload/image';

function isVideoUrl(url: string): boolean {
  return /\.mp4($|\?)/i.test(url);
}

export function MediaPreview({ url }: { url: string }) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        muted
        className="aspect-[4/3] h-20 w-auto max-w-[140px] rounded-lg bg-black object-cover"
      />
    );
  }
  return <img src={url} alt="" className="aspect-[4/3] h-20 w-auto max-w-[140px] rounded-lg object-cover" />;
}

type AddProps = {
  label: string;
  onAdd: (url: string) => void;
  cropAspect?: number;
};

export function AdminImageAddButton({ label, onAdd, cropAspect = ADMIN_PRODUCT_CROP_ASPECT }: AddProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  function onFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f || (!f.type.startsWith('image/') && f.type !== 'video/mp4')) return;
    setLocalErr(null);
    if (f.type === 'video/mp4') {
      setUploading(true);
      void uploadFile(UPLOAD_ENDPOINT, f, f.name).then(onAdd).catch(() => setLocalErr('Falha no upload do MP4.')).finally(() => setUploading(false));
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === 'string') setCropSrc(r.result);
    };
    r.readAsDataURL(f);
  }

  return (
    <div className="space-y-2">
      {label ? <label className="block text-xs font-medium text-zinc-500">{label}</label> : null}
      {localErr && <p className="text-xs text-red-400">{localErr}</p>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 py-3 text-sm font-semibold text-zinc-300 disabled:opacity-50"
      >
        {uploading ? 'Enviando…' : '+ Adicionar foto ou vídeo MP4'}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" className="hidden" onChange={onFile} />
      {cropSrc && (
        <ImageCropModal
          open
          imageSrc={cropSrc}
          aspect={cropAspect}
          title="Ajuste o enquadramento"
          onClose={() => setCropSrc(null)}
          onCropped={async (blob) => {
            setUploading(true);
            setLocalErr(null);
            try {
              onAdd(await uploadFile(UPLOAD_ENDPOINT, blob, 'foto.jpg'));
            } catch (e) {
              setLocalErr(getApiError(e, 'Falha no upload.'));
              throw e;
            } finally {
              setUploading(false);
            }
          }}
        />
      )}
    </div>
  );
}

type MediaGalleryProps = {
  label: string;
  hint?: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  cropAspect?: number;
};

export function AdminMediaGallery({ label, hint, urls, onChange, cropAspect = ADMIN_PRODUCT_CROP_ASPECT }: MediaGalleryProps) {
  function remove(i: number) {
    onChange(urls.filter((_, j) => j !== i));
  }

  function makeCover(i: number) {
    if (i === 0) return;
    const next = [...urls];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-500">{label}</label>
      {hint && <p className="text-[11px] leading-relaxed text-zinc-600">{hint}</p>}
      {urls.length > 0 && (
        <ul className="space-y-2">
          {urls.map((url, i) => (
            <li key={`${url}-${i}`} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2">
              <MediaPreview url={url} />
              <div className="flex flex-1 flex-col items-start gap-1">
                {i === 0 ? (
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-200">
                    Capa (página principal)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                  >
                    Tornar capa
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs font-semibold text-red-400 hover:text-red-300"
                  onClick={() => remove(i)}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AdminImageAddButton label="" onAdd={(url) => onChange([...urls, url])} cropAspect={cropAspect} />
    </div>
  );
}
