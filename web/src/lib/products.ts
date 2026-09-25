import type { ApparelProduct, CoverageProduct, HorseProduct, ProductItemType, ProductsResponse } from '@/types';

export type CatalogItem = {
  id: string;
  itemType: ProductItemType;
  title: string;
  subtitle: string;
  cardSubtitle: string;
  description: string | null;
  photos: string[];
  image: string | null;
  hoverImage: string | null;
  price: number;
  sizes: string[];
  colors: string[];
  searchText: string[];
};

export function apparelTypeLabel(type: ApparelProduct['type']): string {
  return type === 'SHIRT' ? 'Camiseta' : 'Boné';
}

function photosOf(p: { photos?: string[]; imageUrl?: string | null }): string[] {
  if (p.photos?.length) return p.photos;
  return p.imageUrl ? [p.imageUrl] : [];
}

export function coverageToItem(p: CoverageProduct): CatalogItem {
  const photos = photosOf(p);
  const description = p.description?.trim() || null;
  return {
    id: p.id,
    itemType: 'COVERAGE',
    title: p.name,
    subtitle: 'Cobertura',
    cardSubtitle: description || 'Cobertura',
    description,
    photos,
    image: photos[0] ?? null,
    hoverImage: null,
    price: p.price,
    sizes: [],
    colors: [],
    searchText: [p.name, description ?? ''],
  };
}

export function horseToItem(p: HorseProduct): CatalogItem {
  const photos = p.photos ?? [];
  return {
    id: p.id,
    itemType: 'HORSE',
    title: p.name,
    subtitle: p.breed,
    cardSubtitle: p.breed,
    description: p.description || null,
    photos,
    image: photos[0] ?? null,
    hoverImage: photos[1] ?? null,
    price: p.price,
    sizes: [],
    colors: [],
    searchText: [p.name, p.breed, p.sire, p.dam, p.description ?? ''],
  };
}

export function apparelToItem(p: ApparelProduct): CatalogItem {
  const photos = photosOf(p);
  const label = apparelTypeLabel(p.type);
  return {
    id: p.id,
    itemType: 'APPAREL',
    title: p.name,
    subtitle: label,
    cardSubtitle: label,
    description: p.description || null,
    photos,
    image: photos[0] ?? null,
    hoverImage: p.type === 'SHIRT' ? (photos[1] ?? null) : null,
    price: p.price,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    searchText: [p.name, label, p.description ?? ''],
  };
}

export function catalogItems(data: ProductsResponse): CatalogItem[] {
  return [
    ...(data.coverage ?? []).map(coverageToItem),
    ...(data.horses ?? []).map(horseToItem),
    ...(data.apparel ?? []).map(apparelToItem),
  ];
}

export function findCatalogItem(data: ProductsResponse, itemType: ProductItemType, id: string): CatalogItem | null {
  if (itemType === 'COVERAGE') {
    const p = data.coverage.find((x) => x.id === id);
    return p ? coverageToItem(p) : null;
  }
  if (itemType === 'HORSE') {
    const p = data.horses.find((x) => x.id === id);
    return p ? horseToItem(p) : null;
  }
  const p = data.apparel.find((x) => x.id === id);
  return p ? apparelToItem(p) : null;
}

export function productHref(item: Pick<CatalogItem, 'itemType' | 'id'>): string {
  return `/product/${item.itemType.toLowerCase()}/${item.id}`;
}

export type ProductKind = 'coverage' | 'horse' | 'apparel';

export const ADMIN_PRODUCT_ENDPOINT: Record<ProductKind, string> = {
  coverage: '/admin/products/coverage',
  horse: '/admin/products/horses',
  apparel: '/admin/products/apparel',
};
