'use client';

import { AdminMediaGallery } from '@/app/admin/products/admin-image-upload';
import { parseMoneyInput } from '@/lib/format';
import type { ApparelProduct, CoverageProduct, HorseProduct } from '@/types';
import { useState } from 'react';
import { ActiveCheckbox, Field, FieldArea, ProductFormShell, type BuildResult } from './form-fields';

const INVALID = { error: 'Preencha nome e preço válidos.' };
const MISSING_PHOTOS = { error: 'Envie ao menos uma imagem (arquivo) do produto.' };
const GALLERY_HINT =
  'A primeira foto/vídeo enviado aparece na página principal da loja; os demais aparecem só na página do produto.';

function validPrice(raw: string): number | null {
  const price = parseMoneyInput(raw);
  return price != null && price > 0 ? price : null;
}

function splitCsv(s: string) {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function initialPhotos(p?: { photos?: string[]; imageUrl?: string | null }): string[] {
  if (p?.photos?.length) return [...p.photos];
  return p?.imageUrl ? [p.imageUrl] : [];
}

export function CoverageForm({ product }: { product?: CoverageProduct }) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [photos, setPhotos] = useState(() => initialPhotos(product));
  const [active, setActive] = useState(product?.isActive ?? true);

  function build(): BuildResult {
    const parsedPrice = validPrice(price);
    if (!name.trim() || parsedPrice == null) return INVALID;
    if (!product && photos.length === 0) return MISSING_PHOTOS;
    return {
      body: {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        imageUrl: photos[0] || null,
        photos,
        isActive: active,
      },
    };
  }

  return (
    <ProductFormShell kind="coverage" id={product?.id ?? null} build={build}>
      <Field label="Nome" value={name} onChange={setName} required />
      <FieldArea label="Descrição" value={description} onChange={setDescription} />
      <Field label="Preço (R$)" value={price} onChange={setPrice} required placeholder="Ex: 1500 ou 1500,50" />
      <AdminMediaGallery
        label="Imagem"
        hint={`${GALLERY_HINT} Requer Cloudflare R2 configurado no servidor.`}
        urls={photos}
        onChange={setPhotos}
      />
      <ActiveCheckbox checked={active} onChange={setActive} />
    </ProductFormShell>
  );
}

export function HorseForm({ product }: { product?: HorseProduct }) {
  const [name, setName] = useState(product?.name ?? '');
  const [breed, setBreed] = useState(product?.breed ?? '');
  const [sire, setSire] = useState(product?.sire ?? '');
  const [dam, setDam] = useState(product?.dam ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [photos, setPhotos] = useState(() => initialPhotos(product));
  const [active, setActive] = useState(product?.isActive ?? true);

  function build(): BuildResult {
    const parsedPrice = validPrice(price);
    if (!name.trim() || !breed.trim() || !sire.trim() || !dam.trim() || parsedPrice == null) return INVALID;
    if (!product && photos.length === 0) return MISSING_PHOTOS;
    return {
      body: {
        name: name.trim(),
        breed: breed.trim(),
        sire: sire.trim(),
        dam: dam.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        isActive: active,
        ...(photos.length ? { photos } : {}),
      },
    };
  }

  return (
    <ProductFormShell kind="horse" id={product?.id ?? null} build={build}>
      <Field label="Nome" value={name} onChange={setName} required />
      <Field label="Raça" value={breed} onChange={setBreed} required />
      <Field label="Pai (garanhão)" value={sire} onChange={setSire} required />
      <Field label="Mãe" value={dam} onChange={setDam} required />
      <FieldArea label="Descrição" value={description} onChange={setDescription} />
      <Field label="Preço (R$)" value={price} onChange={setPrice} required />
      <AdminMediaGallery
        label="Imagem"
        hint={`${GALLERY_HINT} No cadastro novo é obrigatório pelo menos uma foto.`}
        urls={photos}
        onChange={setPhotos}
      />
      <ActiveCheckbox checked={active} onChange={setActive} />
    </ProductFormShell>
  );
}

export function ApparelForm({ product }: { product?: ApparelProduct }) {
  const [type, setType] = useState<ApparelProduct['type']>(product?.type ?? 'SHIRT');
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [sizes, setSizes] = useState((product?.sizes ?? []).join(', '));
  const [colors, setColors] = useState((product?.colors ?? []).join(', '));
  const [photos, setPhotos] = useState(() => initialPhotos(product));
  const [active, setActive] = useState(product?.isActive ?? true);

  function build(): BuildResult {
    const parsedPrice = validPrice(price);
    if (!name.trim() || parsedPrice == null) return INVALID;
    if (!product && photos.length === 0) return MISSING_PHOTOS;
    return {
      body: {
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        stock: parseInt(stock.replace(/\D/g, ''), 10) || 0,
        sizes: splitCsv(sizes),
        colors: splitCsv(colors),
        imageUrl: photos[0] || undefined,
        photos: photos.length ? photos : undefined,
        isActive: active,
      },
    };
  }

  return (
    <ProductFormShell kind="apparel" id={product?.id ?? null} build={build}>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Tipo</label>
        <select
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
          value={type}
          onChange={(e) => setType(e.target.value as ApparelProduct['type'])}
        >
          <option value="SHIRT">Camiseta</option>
          <option value="CAP">Boné</option>
        </select>
      </div>
      <Field label="Nome" value={name} onChange={setName} required />
      <FieldArea label="Descrição" value={description} onChange={setDescription} />
      <Field label="Preço (R$)" value={price} onChange={setPrice} required />
      <Field label="Estoque" value={stock} onChange={setStock} />
      <Field label="Tamanhos (separados por vírgula)" value={sizes} onChange={setSizes} placeholder="P, M, G, GG" />
      <Field label="Cores (separadas por vírgula)" value={colors} onChange={setColors} placeholder="Preto, Branco" />
      <AdminMediaGallery
        label="Imagem"
        hint={`${GALLERY_HINT} Proporção 4:3 como na loja. Obrigatória pelo menos uma foto.`}
        urls={photos}
        onChange={setPhotos}
      />
      <ActiveCheckbox checked={active} onChange={setActive} />
    </ProductFormShell>
  );
}
