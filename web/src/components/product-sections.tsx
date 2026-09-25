import { Spinner } from '@/components/spinner';
import { formatBRL } from '@/lib/format';
import { apparelToItem, coverageToItem, horseToItem, productHref, type CatalogItem } from '@/lib/products';
import type { ProductsResponse } from '@/types';
import Link from 'next/link';

export type ProductSection = { title: string; items: CatalogItem[] };

export function buildProductSections(data: ProductsResponse): ProductSection[] {
  const apparel = data.apparel ?? [];
  return [
    { title: 'Cavalos', items: (data.horses ?? []).map(horseToItem) },
    { title: 'Coberturas', items: (data.coverage ?? []).map(coverageToItem) },
    { title: 'Bonés', items: apparel.filter((p) => p.type === 'CAP').map(apparelToItem) },
    { title: 'Camisetas', items: apparel.filter((p) => p.type === 'SHIRT').map(apparelToItem) },
  ];
}

export function ProductSections({
  sections,
  loading,
  emptyText = 'Nenhum produto cadastrado ainda.',
}: {
  sections: ProductSection[];
  loading: boolean;
  emptyText?: string;
}) {
  const visible = sections.filter((section) => section.items.length > 0);

  if (loading) return <Spinner className="py-16" />;
  if (visible.length === 0) {
    return <div className="py-16 text-center text-zinc-500">{emptyText}</div>;
  }
  return (
    <div className="space-y-8">
      {visible.map((section) => (
        <section key={section.title}>
          <h3 className="mb-3 border-l-2 border-brand pl-3 text-lg font-bold text-zinc-100">{section.title}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            {section.items.map((product) => (
              <Link
                key={`${product.itemType}:${product.id}`}
                href={productHref(product)}
                className="group block overflow-hidden rounded-2xl bg-zinc-900 p-4 text-left shadow-lg shadow-black/20 transition hover:bg-zinc-900/95"
              >
                <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-900">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className={`h-full w-full object-contain object-center ${
                        product.hoverImage ? 'transition-opacity duration-200 group-hover:opacity-0' : ''
                      }`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-3xl">🛍</span>
                    </div>
                  )}
                  {product.hoverImage && (
                    <img
                      src={product.hoverImage}
                      alt=""
                      className="absolute inset-0 h-full w-full object-contain object-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    />
                  )}
                </div>
                <p className="truncate text-lg font-bold text-zinc-100">{product.title}</p>
                <p className="mt-0.5 line-clamp-2 font-sans text-sm font-normal text-zinc-500">{product.cardSubtitle}</p>
                <div className="mt-3 text-base font-bold text-white">
                  {formatBRL(product.price)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
