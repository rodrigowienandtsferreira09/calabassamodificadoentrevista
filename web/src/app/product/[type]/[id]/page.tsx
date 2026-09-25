'use client';

import { Spinner } from '@/components/spinner';
import { useCart } from '@/context/cart-context';
import { useApi } from '@/hooks/use-api';
import { formatBRL } from '@/lib/format';
import { ITEM_TYPE_LABEL } from '@/lib/orders';
import { COVERAGE_CONTRACT_CLAUSES, COVERAGE_CONTRACT_CLOSING } from '@/lib/coverage-contract';
import { findCatalogItem, type CatalogItem } from '@/lib/products';
import type { ProductItemType, ProductsResponse } from '@/types';
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const typeParam = (params?.type || '').toUpperCase();
  const itemType = typeParam in ITEM_TYPE_LABEL ? (typeParam as ProductItemType) : null;
  const id = params?.id || '';
  const { data: products, loading } = useApi<ProductsResponse>('/products');
  const product = products && itemType ? findCatalogItem(products, itemType, id) : null;

  if (loading) return <Spinner className='min-h-screen' />;

  if (!product) {
    return (
      <div className='mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center'>
        <p className='text-lg font-bold text-zinc-100'>Produto não encontrado</p>
        <p className='mt-2 text-zinc-500'>Ele pode ter sido removido do catálogo.</p>
        <Link href='/' className='mt-5 rounded-xl bg-zinc-200 px-4 py-2 font-bold text-zinc-900'>
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: CatalogItem }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [addedConfirmOpen, setAddedConfirmOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const selectedPhoto = product.photos[activePhotoIndex] ?? null;

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6 md:px-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="grid gap-6 md:grid-cols-[1.15fr,0.85fr] md:items-start">
        <div className="overflow-hidden rounded-2xl bg-zinc-900 p-4 shadow-xl shadow-black/30 md:p-5">
          <div className="h-72 overflow-hidden rounded-xl bg-zinc-800 md:h-[30rem]">
            {selectedPhoto ? (
              <img src={selectedPhoto} alt={product.title} className="h-full w-full object-contain p-2" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🛍</div>
            )}
          </div>

          {product.photos.length > 1 && (
            <div className="mt-3">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((idx) => (idx === 0 ? product.photos.length - 1 : idx - 1))
                  }
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 transition hover:bg-zinc-800"
                  aria-label="Foto anterior do produto"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((idx) => (idx === product.photos.length - 1 ? 0 : idx + 1))
                  }
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 transition hover:bg-zinc-800"
                  aria-label="Próxima foto do produto"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.photos.map((photo, idx) => (
                  <button
                    key={`${photo}-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`overflow-hidden rounded-lg border ${
                      idx === activePhotoIndex ? 'border-brand' : 'border-zinc-700'
                    }`}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <img src={photo} alt="" className="h-16 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Sobre este produto</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {product.description ||
                'Produto oficial do Haras Exemplo. Seleção com foco em qualidade, identidade da marca e experiência premium para quem vive o mundo equestre.'}
            </p>
          </div>

          {product.itemType === 'COVERAGE' && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Cláusulas do contrato de cobertura
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-400 marker:text-zinc-600">
                {COVERAGE_CONTRACT_CLAUSES.map((clause, idx) => (
                  <li key={idx} className="pl-1">
                    {clause}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{COVERAGE_CONTRACT_CLOSING}</p>
            </div>
          )}
        </div>

        <div className="md:sticky md:top-24">
          <div className="overflow-hidden rounded-2xl bg-zinc-900 p-5 shadow-xl shadow-black/30 md:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{ITEM_TYPE_LABEL[product.itemType]}</p>
            <h1 className="mt-2 text-2xl font-bold text-zinc-100 md:text-3xl">{product.title}</h1>
            <p className="mt-2 font-sans text-sm font-normal text-zinc-500">{product.subtitle}</p>
            <p className="mt-5 text-3xl font-extrabold text-white">
              {formatBRL(product.price)}
            </p>

            {product.itemType === 'APPAREL' && (
              <div className="mt-6 space-y-5">
                {product.colors.length > 0 && (
                  <div>
                    <p className="mb-2 font-sans text-sm font-semibold text-zinc-300">Cor</p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`rounded-lg border px-3 py-1.5 font-sans text-sm ${
                            selectedColor === color
                              ? 'border-brand bg-brand/20 text-brand-lighter'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes.length > 0 && (
                  <div>
                    <p className="mb-2 font-sans text-sm font-semibold text-zinc-300">Tamanho</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-lg border px-3 py-1.5 font-sans text-sm ${
                            selectedSize === size
                              ? 'border-brand bg-brand/20 text-brand-lighter'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <p className="mb-2 font-sans text-sm font-semibold text-zinc-300">Quantidade</p>
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-zinc-300 hover:bg-zinc-700"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-12 px-3 text-center font-sans text-sm font-bold text-zinc-100">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="px-3 py-2 text-zinc-300 hover:bg-zinc-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                addToCart({
                  id: crypto.randomUUID(),
                  itemId: product.id,
                  itemType: product.itemType,
                  title: product.title,
                  subtitle: product.subtitle,
                  image: selectedPhoto,
                  price: product.price,
                  quantity,
                  selectedColor: product.itemType === 'APPAREL' ? selectedColor || undefined : undefined,
                  selectedSize: product.itemType === 'APPAREL' ? selectedSize || undefined : undefined,
                });
                setAddedConfirmOpen(true);
              }}
              disabled={
                product.itemType === 'APPAREL' &&
                ((product.colors.length > 0 && !selectedColor) || (product.sizes.length > 0 && !selectedSize))
              }
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-200 text-zinc-900 px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag className="h-5 w-5" />
              Adicionar na sacola
            </button>

            <p className="mt-3 font-sans text-xs text-zinc-500">
              Compra segura. Você pode revisar todos os itens na sacola antes do pagamento.
            </p>
          </div>
        </div>
      </div>

      {addedConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 md:items-center md:p-6">
          <div className="w-full max-w-md rounded-t-2xl bg-zinc-900 p-5 shadow-2xl shadow-black/50 md:rounded-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Produto adicionado</p>
            <h3 className="mt-2 text-xl font-bold text-zinc-100">Item adicionado na sacola com sucesso.</h3>
            <p className="mt-2 font-sans text-sm text-zinc-400">Você deseja ir para a sacola agora?</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAddedConfirmOpen(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 font-sans font-semibold text-zinc-200"
              >
                Continuar
              </button>
              <Link
                href="/cart"
                className="rounded-xl bg-zinc-200 px-4 py-3 text-center font-sans font-bold text-zinc-900"
              >
                Ir para sacola
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
