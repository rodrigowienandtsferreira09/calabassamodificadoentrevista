'use client';

import api, { getApiError } from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { Check, Tag, X } from 'lucide-react';
import { useState } from 'react';

export type AppliedDiscount = {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  discountAmount: number;
  includeFreight: boolean;
};

type Props = {
  subtotal: number;
  freight: number;
  total: number;
  signedIn: boolean;
  discount: AppliedDiscount | null;
  onDiscountChange: (discount: AppliedDiscount | null) => void;
  error: string | null;
  submitting: boolean;
  onCheckout: () => void;
};

export function OrderSummary({
  subtotal,
  freight,
  total,
  signedIn,
  discount,
  onDiscountChange,
  error,
  submitting,
  onCheckout,
}: Props) {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [couponErr, setCouponErr] = useState<string | null>(null);

  async function applyCoupon() {
    const trimmed = code.trim();
    if (!trimmed) return;
    if (!signedIn) {
      setCouponErr('Faça login para usar um cupom.');
      return;
    }
    setApplying(true);
    setCouponErr(null);
    try {
      const { data } = await api.post<AppliedDiscount>('/discounts/validate', { code: trimmed, subtotal, freight });
      onDiscountChange(data);
      setCode('');
    } catch (e) {
      setCouponErr(getApiError(e, 'Cupom inválido.'));
      onDiscountChange(null);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-zinc-950/95 p-6 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.9)] backdrop-blur md:bottom-6 md:left-1/2 md:w-[min(36rem,calc(100%-2rem))] md:-translate-x-1/2 md:rounded-2xl md:shadow-2xl md:shadow-black/60">
      {error && <p className="mb-2 text-center text-sm text-red-400">{error}</p>}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Subtotal</span>
          <span className="text-zinc-200">{formatBRL(subtotal)}</span>
        </div>
        {discount && (
          <div className="flex justify-between text-emerald-400">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Desconto ({discount.code})
            </span>
            <span>-{formatBRL(discount.discountAmount)}</span>
          </div>
        )}
        {freight > 0 && (
          <div className="flex justify-between text-zinc-400">
            <span>Frete</span>
            <span className="text-zinc-200">{formatBRL(freight)}</span>
          </div>
        )}

        {discount ? (
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Cupom <span className="font-mono font-bold">{discount.code}</span> aplicado
            </span>
            <button
              type="button"
              onClick={() => onDiscountChange(null)}
              className="rounded-lg p-1 text-zinc-500 hover:text-red-400"
              title="Remover cupom"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-t border-zinc-800 pt-3">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs uppercase text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setCouponErr(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && void applyCoupon()}
                placeholder="Código de desconto"
                maxLength={50}
              />
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={applying || !code.trim()}
                className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-100 disabled:opacity-40"
              >
                {applying ? '…' : 'Aplicar'}
              </button>
            </div>
            {couponErr && <p className="mt-1 text-xs text-red-400">{couponErr}</p>}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
          <span className="font-medium text-zinc-300">Total</span>
          <span className="text-2xl font-bold text-zinc-100">{formatBRL(total)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        disabled={submitting}
        className={`w-full rounded-2xl py-4 font-bold tracking-wide shadow-lg ${
          submitting ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-200 text-zinc-900 shadow-black/20'
        }`}
      >
        {submitting ? 'Processando…' : 'FINALIZAR COMPRA'}
      </button>
    </div>
  );
}
