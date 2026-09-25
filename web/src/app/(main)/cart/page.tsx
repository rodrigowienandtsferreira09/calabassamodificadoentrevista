'use client';

import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { usePayment } from '@/context/payment-context';
import api, { getApiError } from '@/lib/api';
import { cepDigits, formatCepDisplay } from '@/lib/viacep';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CartItemRow } from './cart-item-row';
import { OrderSummary, type AppliedDiscount } from './order-summary';
import {
  DELIVERY_FEE_BRL,
  EMPTY_ADDRESS,
  ShippingSection,
  validateShipping,
  type Address,
  type DeliveryMethod,
  type Recipient,
} from './shipping-section';

type OrderCreateResponse = {
  order?: { id: string; totalAmount: number };
  initPoint?: string;
};

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, total: subtotal } = useCart();
  const { user } = useAuth();
  const { setPendingPayment } = usePayment();
  const router = useRouter();

  const [method, setMethod] = useState<DeliveryMethod>('DELIVERY');
  const [recipientEdits, setRecipientEdits] = useState<Partial<Recipient>>({});
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const recipient: Recipient = {
    name: recipientEdits.name ?? user?.name ?? '',
    phone: recipientEdits.phone ?? user?.phoneNumber ?? '',
    document: recipientEdits.document ?? (user?.document?.startsWith('DOC-') ? '' : (user?.document ?? '')),
  };
  const freight = method === 'DELIVERY' ? DELIVERY_FEE_BRL : 0;
  const total = Math.max(0, subtotal + freight - (discount?.discountAmount ?? 0));

  function changeQuantity(itemId: string, quantity: number) {
    updateQuantity(itemId, quantity);
    setDiscount(null);
  }

  function removeItem(itemId: string) {
    removeFromCart(itemId);
    setDiscount(null);
  }

  function changeMethod(next: DeliveryMethod) {
    setMethod(next);
    setDiscount(null);
  }

  function buildShipping() {
    const base = {
      deliveryMethod: method,
      recipientName: recipient.name.trim(),
      recipientPhone: recipient.phone.trim(),
      recipientDocument: recipient.document.trim() || undefined,
    };
    if (method === 'PICKUP') return { ...base, freightService: 'Retirada', estimatedDeliveryDays: 0 };
    return {
      ...base,
      freightService: 'Frete fixo',
      estimatedDeliveryDays: 7,
      address: {
        zipCode: formatCepDisplay(cepDigits(address.zipCode)),
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement.trim() || undefined,
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state,
      },
    };
  }

  async function handleCheckout() {
    if (!user) {
      setErr('Faça login para finalizar a compra.');
      return;
    }
    const invalid = validateShipping(method, recipient, address);
    if (invalid) {
      setErr(invalid);
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const { data } = await api.post<OrderCreateResponse>('/orders', {
        items: items.map((item) => ({ itemType: item.itemType, itemId: item.itemId, quantity: item.quantity })),
        shipping: buildShipping(),
        discountCode: discount?.code,
      });
      if (!data.order || !data.initPoint) {
        setErr('Pagamento online indisponível no momento.');
        return;
      }
      setPendingPayment({
        orderId: data.order.id,
        initPoint: data.initPoint,
        total: data.order.totalAmount,
        itemCount: items.length,
      });
      clearCart();
      router.push('/payment');
    } catch (e) {
      setErr(getApiError(e, 'Não foi possível finalizar.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="pb-8 pt-4 md:pt-6">
        <h1 className="text-2xl font-bold text-zinc-100">Minha Sacola</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {items.length} {items.length === 1 ? 'item adicionado' : 'itens adicionados'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-10 py-24">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 shadow-inner shadow-black/40">
            <ShoppingBag className="h-10 w-10 text-zinc-600" />
          </div>
          <p className="mb-2 text-center text-xl font-bold text-zinc-100">Sua sacola está vazia</p>
          <p className="text-center leading-relaxed text-zinc-500">Explore o catálogo do Haras Exemplo.</p>
          <Link
            href="/"
            className="mt-8 rounded-xl bg-zinc-800 px-8 py-3 font-bold text-zinc-100 shadow-lg shadow-black/30 hover:bg-zinc-700"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 pb-[26rem] pt-6 md:pb-80">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantityChange={(quantity) => changeQuantity(item.id, quantity)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
            <ShippingSection
              method={method}
              onMethodChange={changeMethod}
              recipient={recipient}
              onRecipientChange={(field, value) => setRecipientEdits((prev) => ({ ...prev, [field]: value }))}
              address={address}
              onAddressChange={setAddress}
            />
          </div>

          <OrderSummary
            subtotal={subtotal}
            freight={freight}
            total={total}
            signedIn={!!user}
            discount={discount}
            onDiscountChange={setDiscount}
            error={err}
            submitting={submitting}
            onCheckout={() => void handleCheckout()}
          />
        </>
      )}
    </div>
  );
}
