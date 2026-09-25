'use client';

import { Spinner } from '@/components/spinner';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { formatBRL, formatDate } from '@/lib/format';
import { ITEM_TYPE_LABEL, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/orders';
import type { Order } from '@/types';
import { ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading } = useApi<Order[]>(user ? '/buyer/orders' : null);
  const orders = data ?? [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-zinc-100"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-zinc-100">Minhas Compras</h1>
      </header>

      <div className="px-5 py-6">
        {!user?.id ? (
          <p className="text-center text-zinc-500">
            <Link href="/auth" className="text-zinc-100">
              Entre
            </Link>{' '}
            para ver seus pedidos.
          </p>
        ) : loading ? (
          <Spinner className="py-16" />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16">
            <Package className="h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-center text-zinc-500">Você ainda não fez compras.</p>
            <Link href="/" className="mt-4 rounded-xl bg-zinc-800 px-6 py-3 font-bold text-zinc-100">
              Ir para lojas
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((item) => (
              <Link
                key={item.id}
                href={`/buyer/order/${item.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-bold text-zinc-500">{formatDate(item.createdAt)}</span>
                  <span className={`flex items-center gap-1 text-xs font-bold ${ORDER_STATUS_COLOR[item.status]}`}>
                    {ORDER_STATUS_LABEL[item.status].toUpperCase()}
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </span>
                </div>
                {item.items.map((orderItem) => (
                  <div key={orderItem.id} className="mb-3 flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      {orderItem.product.imageUrl ? (
                        <img
                          src={orderItem.product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-100">{orderItem.product.name}</p>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-600">
                        {ITEM_TYPE_LABEL[orderItem.itemType]}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatBRL(orderItem.unitPrice)} × {orderItem.quantity}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end border-t border-zinc-800 pt-3">
                  <span className="font-bold text-zinc-100">{formatBRL(item.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
