'use client';

import { Spinner } from '@/components/spinner';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { formatBRL, formatDateTime } from '@/lib/format';
import { ITEM_TYPE_LABEL, ORDER_STATUS_LABEL } from '@/lib/orders';
import type { Order } from '@/types';
import { useParams, useRouter } from 'next/navigation';

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: order, loading: fetching, error: failed } = useApi<Order>(user && id ? `/buyer/orders/${id}` : null);
  const loading = authLoading || fetching;
  const error = failed ? 'Não foi possível carregar o pedido.' : null;

  if (loading) return <Spinner className="min-h-screen bg-zinc-950" />;

  if (error || !order) {
    return (
      <div className="min-h-screen bg-zinc-950 px-6">
        <div className="flex items-center gap-3 border-b border-zinc-900 py-4">
          <button type="button" onClick={() => router.back()} className="text-zinc-100">
            ←
          </button>
          <h1 className="text-xl font-bold text-zinc-100">Pedido</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <p className="text-center text-zinc-500">{error ?? 'Pedido não encontrado.'}</p>
        </div>
      </div>
    );
  }

  const st = order.status;
  const paidOk = ['PAID', 'SHIPPED', 'DELIVERED'].includes(st);
  const shipOk = st === 'SHIPPED' || st === 'DELIVERED';

  const timeline: { key: string; title: string; subtitle: string | null; done: boolean }[] = [
    { key: 'created', title: 'Pedido realizado', subtitle: formatDateTime(order.createdAt), done: true },
    {
      key: 'paid',
      title: 'Pagamento confirmado',
      subtitle: formatDateTime(order.paidAt) ?? (paidOk ? 'Pagamento confirmado' : null),
      done: paidOk,
    },
    {
      key: 'ship',
      title: 'Em envio',
      subtitle: shipOk ? formatDateTime(order.shippedAt) ?? 'Despachado pela loja' : null,
      done: shipOk,
    },
    {
      key: 'done',
      title: 'Entregue',
      subtitle: formatDateTime(order.deliveredAt),
      done: st === 'DELIVERED',
    },
  ];

  const showTrackingBox = shipOk;

  return (
    <div className="min-h-screen bg-zinc-950 pb-12">
      <div className="flex items-center gap-3 border-b border-zinc-900 px-6 py-4">
        <button type="button" onClick={() => router.back()} className="p-2 text-zinc-100">
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-100">Pedido</h1>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</p>
        </div>
        <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-100">
          {ORDER_STATUS_LABEL[st].toUpperCase()}
        </span>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Acompanhar envio</p>
          {timeline.map((step, index) => (
            <div key={step.key} className="flex">
              <div className="mr-3 flex flex-col items-center">
                <span className={`h-3 w-3 rounded-full ${step.done ? 'bg-accent' : 'bg-zinc-700'}`} />
                {index < timeline.length - 1 ? (
                  <span
                    className={`min-h-[36px] w-0.5 flex-1 ${step.done ? 'bg-zinc-200 text-zinc-900/40' : 'bg-zinc-800'}`}
                  />
                ) : null}
              </div>
              <div className="flex-1 pb-6">
                <p className={`font-bold ${step.done ? 'text-zinc-100' : 'text-zinc-600'}`}>{step.title}</p>
                {step.subtitle ? <p className="mt-0.5 text-sm text-zinc-500">{step.subtitle}</p> : null}
                {step.key === 'ship' && showTrackingBox ? (
                  <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                    {order.carrier ? (
                      <p className="text-sm text-zinc-300">
                        <span className="text-zinc-500">Transportadora: </span>
                        {order.carrier}
                      </p>
                    ) : null}
                    {order.trackingCode ? (
                      <p className="mt-1 text-sm text-zinc-300">
                        <span className="text-zinc-500">Código de rastreio: </span>
                        {order.trackingCode}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        A loja ainda não informou o código de rastreio. Você pode falar com o vendedor.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Entrega</p>
          {order.deliveryMethod === 'DELIVERY' ? (
            <div className="space-y-1 text-sm text-zinc-300">
              {order.recipientName ? <p className="font-medium text-zinc-100">{order.recipientName}</p> : null}
              {order.recipientPhone ? <p className="text-zinc-400">{order.recipientPhone}</p> : null}
              {order.recipientDocument ? (
                <p className="text-xs text-zinc-500">Doc.: {order.recipientDocument}</p>
              ) : null}
              {order.deliveryStreet ? (
                <p className="pt-2 text-zinc-200">
                  {order.deliveryStreet}
                  {order.deliveryNumber ? `, ${order.deliveryNumber}` : ''}
                  {order.deliveryComplement ? ` — ${order.deliveryComplement}` : ''}
                </p>
              ) : (
                <p className="pt-2 text-zinc-500">Endereço não informado neste pedido.</p>
              )}
              <p>
                {[order.deliveryNeighborhood, order.deliveryCity].filter(Boolean).join(' — ')}
                {order.deliveryState ? `/${order.deliveryState}` : ''}
              </p>
              {order.deliveryZipCode ? <p className="text-zinc-500">CEP {order.deliveryZipCode}</p> : null}
              {Number(order.shippingAmount ?? 0) > 0 ? (
                <p className="pt-1 text-xs text-zinc-500">
                  Frete ({order.shippingService ?? 'entrega'}): {formatBRL(order.shippingAmount)}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Retirada no local</p>
              <p className="mt-1 text-zinc-400">
                {order.recipientName ? (
                  <>
                    Contato: {order.recipientName}
                    {order.recipientPhone ? ` — ${order.recipientPhone}` : ''}
                  </>
                ) : (
                  'Combine a retirada com a loja após o pagamento.'
                )}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Itens</p>
          {order.items.map((orderItem) => {
            const photo = orderItem.product.imageUrl;
            return (
              <div
                key={orderItem.id}
                className="mb-4 flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {photo ? (
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">—</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-zinc-100">{orderItem.product.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {orderItem.quantity}x{' '}
                    {ITEM_TYPE_LABEL[orderItem.itemType]}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{formatBRL(orderItem.unitPrice)} / un.</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="text-zinc-400">Total</span>
          <span className="text-xl font-bold text-zinc-100">{formatBRL(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
