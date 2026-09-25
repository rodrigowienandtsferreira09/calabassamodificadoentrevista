'use client';

import { getCroppedImg } from '@/lib/crop-image';
import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

type Props = {
  open: boolean;
  imageSrc: string;
  aspect: number;
  title: string;
  onClose: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
};

export function ImageCropModal({ open, imageSrc, aspect, title, onClose, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function apply() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await Promise.resolve(onCropped(blob));
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
          Cancelar
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid
        />
      </div>

      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <label className="mb-3 flex items-center gap-3">
          <span className="w-14 text-xs text-zinc-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 flex-1 accent-accent"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void apply()}
          className="w-full rounded-xl bg-zinc-200 text-zinc-900 py-3.5 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? 'Gerando…' : 'Usar este enquadramento'}
        </button>
      </div>
    </div>
  );
}
