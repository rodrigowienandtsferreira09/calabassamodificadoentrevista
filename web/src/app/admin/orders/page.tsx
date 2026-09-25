'use client';

import { Spinner } from '@/components/spinner';
import api from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/orders';
import type { Order, OrderStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/use-api';
import { useState } from 'react';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<Order[]>('/admin/orders');
  const orders = data ?? [];
  const [toast, setToast] = useState<string | null>(null);
  const [shipFor, setShipFor] = useState<string | null>(null);
  const [carrierInput, setCarrierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');

  async function updateStatus(
    orderId: string,
    status: OrderStatus,
    extra?: { carrier?: string; trackingCode?: string }
  ) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status, ...(extra ?? {}) });
      await reload();
      setToast('Pedido atualizado.');
      setTimeout(() => setToast(null), 1800);
    } catch {
      setToast('Falha ao atualizar pedido.');
    }
  }

  function deliveryBlock(order: Order) {
    const method = order.deliveryMethod === 'DELIVERY' ? 'Entrega em domicílio' : 'Retirada no local';
    const shipAmt = Number(order.shippingAmount ?? 0);
    return (
      <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-light">Entrega (dados do comprador no checkout)</p>
        <p className="font-medium text-zinc-200">{method}</p>
        {order.recipientName ? (
          <p className="mt-2 text-zinc-300">
            <span className="text-zinc-500">Destinatário: </span>
            {order.recipientName}
          </p>
        ) : null}
        {order.recipientPhone ? (
          <p className="mt-0.5 text-zinc-300">
            <span className="text-zinc-500">Telefone: </span>
            {order.recipientPhone}
          </p>
        ) : null}
        {order.recipientDocument ? (
          <p className="mt-0.5 text-zinc-300">
            <span className="text-zinc-500">Documento: </span>
            {order.recipientDocument}
          </p>
        ) : null}
        {order.deliveryMethod === 'DELIVERY' && (order.deliveryStreet || order.deliveryZipCode) ? (
          <div className="mt-3 border-t border-zinc-800 pt-3 text-zinc-300">
            <p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Endereço</p>
            {order.deliveryStreet ? (
              <p>
                {order.deliveryStreet}
                {order.deliveryNumber ? `, ${order.deliveryNumber}` : ''}
                {order.deliveryComplement ? ` — ${order.deliveryComplement}` : ''}
              </p>
            ) : null}
            <p>
              {[order.deliveryNeighborhood, order.deliveryCity].filter(Boolean).join(' — ')}
              {order.deliveryState ? ` / ${order.deliveryState}` : ''}
            </p>
            {order.deliveryZipCode ? <p className="text-zinc-500">CEP {order.deliveryZipCode}</p> : null}
          </div>
        ) : order.deliveryMethod === 'DELIVERY' ? (
          <p className="mt-2 text-xs text-zinc-500">Endereço não preenchido neste pedido.</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          {order.shippingService ? <span>Serviço: {order.shippingService}</span> : null}
          {shipAmt > 0 ? <span>Frete: {formatBRL(shipAmt)}</span> : null}
          {order.shippingEstimatedDays != null ? <span>Prazo est.: {order.shippingEstimatedDays} dia(s)</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <button type="button" onClick={() => router.back()} className="text-zinc-100">
          ←
        </button>
        <h1 className="text-xl font-bold text-zinc-100">Gerenciar entregas</h1>
      </header>

      {error && !toast ? (
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-center text-sm text-red-400">
          Não foi possível carregar os pedidos.
        </div>
      ) : null}
      {toast ? (
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-center text-sm text-accent">{toast}</div>
      ) : null}

      <div className="px-5 py-6">
        {loading ? (
          <Spinner className="py-16" />
        ) : orders.length === 0 ? (
          <p className="text-center text-zinc-500">Nenhum pedido encontrado.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-3">
                  <p className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</p>
                  <span className={`text-xs font-bold uppercase ${ORDER_STATUS_COLOR[order.status]}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>

                <div className="mb-3 rounded-xl bg-zinc-950 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-zinc-500">Conta no site</p>
                  <p className="text-zinc-300">{order.buyer?.fullName ?? 'Comprador'}</p>
                  <p className="text-zinc-500">{order.buyer?.email}</p>
                  {order.buyer?.phoneNumber ? (
                    <p className="mt-1 text-zinc-500">Tel. cadastro: {order.buyer.phoneNumber}</p>
                  ) : null}
                </div>

                {deliveryBlock(order)}

                <div className="space-y-1">
                  {order.items.map((item) => (
                    <p key={item.id} className="text-sm text-zinc-300">
                      {item.quantity}x {item.product.name}
                    </p>
                  ))}
                </div>

                {(order.carrier || order.trackingCode) && (
                  <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
                    {order.carrier ? <p>Transportadora: {order.carrier}</p> : null}
                    {order.trackingCode ? <p>Rastreio: {order.trackingCode}</p> : null}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-zinc-100">{formatBRL(order.totalAmount)}</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {order.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => void updateStatus(order.id, 'PAID')}
                        className="rounded-lg border border-sky-700/60 bg-sky-900/30 px-3 py-2 text-xs font-bold text-sky-200"
                      >
                        Marcar pago
                      </button>
                    ) : null}
                    {order.status === 'PAID' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShipFor(order.id);
                          setCarrierInput(order.carrier ?? '');
                          setTrackingInput(order.trackingCode ?? '');
                        }}
                        className="rounded-lg bg-zinc-200 px-3 py-2 text-xs font-bold text-zinc-900"
                      >
                        Marcar enviado
                      </button>
                    ) : null}
                    {order.status === 'SHIPPED' ? (
                      <button
                        type="button"
                        onClick={() => void updateStatus(order.id, 'DELIVERED')}
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-zinc-100"
                      >
                        Marcar entregue
                      </button>
                    ) : null}
                    {(order.status === 'PENDING' || order.status === 'PAID' || order.status === 'SHIPPED') && (
                      <button
                        type="button"
                        onClick={() => void updateStatus(order.id, 'CANCELED')}
                        className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-bold text-red-300"
                      >
                        Cancelar
                      </button>
                    )}
                    {(order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                      <button
                        type="button"
                        onClick={() => void updateStatus(order.id, 'REFUNDED')}
                        className="rounded-lg border border-fuchsia-900/60 bg-fuchsia-950/30 px-3 py-2 text-xs font-bold text-fuchsia-200"
                      >
                        Reembolsar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {shipFor ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-1 text-lg font-bold text-zinc-100">Informar envio</h2>
            <p className="mb-4 text-sm text-zinc-500">Esses dados aparecem para o cliente em “Meus pedidos”.</p>
            <label className="mb-1 block text-xs uppercase text-zinc-500">Transportadora</label>
            <input
              value={carrierInput}
              onChange={(e) => setCarrierInput(e.target.value)}
              className="mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100"
              placeholder="Ex.: Correios"
            />
            <label className="mb-1 block text-xs uppercase text-zinc-500">Código de rastreio</label>
            <input
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="mb-5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100"
              placeholder="Cole o código"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShipFor(null)}
                className="flex-1 rounded-xl bg-zinc-800 py-3 font-bold text-zinc-100"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const orderId = shipFor;
                  setShipFor(null);
                  void updateStatus(orderId, 'SHIPPED', {
                    carrier: carrierInput.trim() || undefined,
                    trackingCode: trackingInput.trim() || undefined,
                  });
                }}
                className="flex-1 rounded-xl bg-zinc-200 py-3 font-bold text-zinc-900"
              >
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
