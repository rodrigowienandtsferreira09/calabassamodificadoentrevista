'use client';

import { usePayment } from '@/context/payment-context';
import api from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { CreditCard, Home, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Spinner } from '@/components/spinner';

function PaymentInner() {
  const searchParams = useSearchParams();
  const mp = searchParams.get('mp');
  const { pendingPayment, clearPendingPayment } = usePayment();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const [confirmed, setConfirmed] = useState(false);
  const returning = mp === 'success' || mp === 'pending';
  const msg =
    mp === 'failure'
      ? 'Pagamento não foi concluído.'
      : returning
        ? confirmed
          ? 'Pagamento confirmado! Confira em Meus pedidos.'
          : 'Pagamento recebido. Confirmando o pedido...'
        : null;

  useEffect(() => {
    if (mp) clearPendingPayment();
  }, [mp, clearPendingPayment]);

  useEffect(() => {
    if (!returning || !orderId) return;
    let attempts = 0;
    const poll = window.setInterval(async () => {
      attempts += 1;
      try {
        const { data } = await api.get<{ status: string }>(`/buyer/orders/${orderId}`);
        if (data.status === 'PAID') {
          window.clearInterval(poll);
          setConfirmed(true);
        }
      } catch {}
      if (attempts >= 15) window.clearInterval(poll);
    }, 2000);
    return () => window.clearInterval(poll);
  }, [returning, orderId]);

  useEffect(() => {
    if (!pendingPayment && !mp) {
      router.replace('/');
    }
  }, [pendingPayment, mp, router]);

  useEffect(() => {
    if (msg && (mp === 'success' || mp === 'pending' || mp === 'failure')) {
      const t = setTimeout(() => router.replace('/buyer/orders'), 2500);
      return () => clearTimeout(t);
    }
  }, [msg, mp, router]);

  if (!pendingPayment && !mp) return null;

  function openMp() {
    if (pendingPayment?.initPoint) {
      window.location.href = pendingPayment.initPoint;
    }
  }

  if (msg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
        <p className="text-center text-zinc-300">{msg}</p>
        <Link href="/buyer/orders" className="mt-6 text-zinc-100">
          Ir para meus pedidos
        </Link>
      </div>
    );
  }

  if (!pendingPayment) return null;

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8">
      <div className="relative mb-8 flex flex-col items-center">
        <Link href="/cart" className="absolute left-0 top-0 p-2 text-zinc-400 hover:text-zinc-100">
          ←
        </Link>
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-accent/40 bg-zinc-200 text-zinc-900">
          <CreditCard className="h-9 w-9 text-zinc-100" />
        </div>
        <h1 className="text-center text-2xl font-bold text-zinc-100">Checkout</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Finalize o pagamento do seu pedido de forma segura
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Resumo do pedido</p>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-500">Pedido</span>
          <span className="font-mono text-zinc-100">#{pendingPayment.orderId.slice(0, 8)}</span>
        </div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-500">Itens</span>
          <span className="text-zinc-100">
            {pendingPayment.itemCount} {pendingPayment.itemCount === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <div className="mt-3 flex justify-between border-t border-zinc-800 pt-3">
          <span className="font-medium text-zinc-400">Total</span>
          <span className="text-xl font-bold text-zinc-100">{formatBRL(pendingPayment.total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={openMp}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#009ee3] bg-[#009ee3] py-4 font-bold text-zinc-100"
      >
        <span className="text-lg">↗</span>
        Pagar com Mercado Pago
      </button>

      <p className="mb-6 text-center text-sm leading-relaxed text-zinc-500">
        Você será levado ao site do Mercado Pago. Lá você pode escolher{' '}
        <span className="font-medium text-zinc-400">PIX</span>, cartão, boleto e outras formas.
      </p>

      <Link
        href="/buyer/orders"
        className="mb-2 flex items-center justify-center gap-2 py-3 text-zinc-500 hover:text-zinc-300"
      >
        <Package className="h-4 w-4" />
        Ver meus pedidos
      </Link>
      <button
        type="button"
        onClick={() => {
          clearPendingPayment();
          router.replace('/');
        }}
        className="flex w-full items-center justify-center gap-2 py-3 text-zinc-500 hover:text-zinc-300"
      >
        <Home className="h-4 w-4" />
        Voltar ao início
      </button>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <Spinner className="min-h-screen bg-zinc-950" />
      }
    >
      <PaymentInner />
    </Suspense>
  );
}
