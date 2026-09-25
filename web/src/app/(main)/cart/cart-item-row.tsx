import type { CartItem } from '@/context/cart-context';
import { formatBRL } from '@/lib/format';
import { ImageIcon, Minus, Plus, Trash2 } from 'lucide-react';

type Props = {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartItemRow({ item, onQuantityChange, onRemove }: Props) {
  const quantity = item.quantity ?? 1;
  const variant = [item.selectedColor && `Cor: ${item.selectedColor}`, item.selectedSize && `Tam: ${item.selectedSize}`]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="flex gap-3 rounded-2xl bg-zinc-900/90 p-3 shadow-md shadow-black/25">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
        {item.image ? (
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-6 w-6 text-zinc-600" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="truncate text-lg font-bold text-zinc-100">{item.title}</p>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{item.subtitle || item.itemType}</p>
        {variant && <p className="mt-1 text-xs text-zinc-400">{variant}</p>}
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
            <button
              type="button"
              onClick={() => onQuantityChange(quantity - 1)}
              className="p-2 text-zinc-300 hover:bg-zinc-700"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-8 px-2 text-center text-sm font-bold text-zinc-100">{quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="p-2 text-zinc-300 hover:bg-zinc-700"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <p className="text-base font-bold text-zinc-100">{formatBRL(item.price)}</p>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20"
              aria-label="Remover item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
