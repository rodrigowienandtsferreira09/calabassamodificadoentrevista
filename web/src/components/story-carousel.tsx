'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORY_PHOTOS = ['/story-1.svg', '/story-2.svg', '/story-3.svg', '/story-4.svg'];

export function StoryCarousel() {
  const [storyPhotoIndex, setStoryPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  function prevStoryPhoto() {
    setStoryPhotoIndex((idx) => (idx === 0 ? STORY_PHOTOS.length - 1 : idx - 1));
  }

  function nextStoryPhoto() {
    setStoryPhotoIndex((idx) => (idx === STORY_PHOTOS.length - 1 ? 0 : idx + 1));
  }

  useEffect(() => {
    if (isLightboxOpen) return;
    const timer = setInterval(nextStoryPhoto, 3000);
    return () => clearInterval(timer);
  }, [isLightboxOpen]);

  return (
    <>
      <div className="group/photo relative mt-6 aspect-[4/3] w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-zinc-900/40 shadow-lg shadow-black/30 md:aspect-[16/9] md:max-w-3xl">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="group h-full w-full cursor-zoom-in"
        >
          <img
            src={STORY_PHOTOS[storyPhotoIndex]}
            alt={`Imagem ilustrativa ${storyPhotoIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevStoryPhoto();
          }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/50 bg-black/40 p-2 text-white backdrop-blur-md opacity-0 transition duration-200 group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 hover:bg-black/60"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextStoryPhoto();
          }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/50 bg-black/40 p-2 text-white backdrop-blur-md opacity-0 transition duration-200 group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 hover:bg-black/60"
          aria-label="Próxima foto"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          {storyPhotoIndex + 1} / {STORY_PHOTOS.length}
        </div>
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
        >
          <div className="relative h-full w-full max-w-7xl flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              className="absolute right-0 top-0 z-[210] rounded-full bg-zinc-800/80 p-3 text-white hover:bg-zinc-700 transition"
              aria-label="Fechar modal de imagem"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevStoryPhoto();
              }}
              className="absolute left-0 top-1/2 z-[210] -translate-y-1/2 rounded-full border border-zinc-700/50 bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60 md:p-3"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <img
              src={STORY_PHOTOS[storyPhotoIndex]}
              alt={`Imagem ilustrativa ${storyPhotoIndex + 1}`}
              className="h-full w-full object-contain cursor-auto"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextStoryPhoto();
              }}
              className="absolute right-0 top-1/2 z-[210] -translate-y-1/2 rounded-full border border-zinc-700/50 bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60 md:p-3"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
