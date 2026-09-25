import type { OrderStatus, ProductItemType } from '@/types';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'text-yellow-400',
  PAID: 'text-sky-400',
  SHIPPED: 'text-violet-400',
  DELIVERED: 'text-emerald-400',
  CANCELED: 'text-red-400',
  REFUNDED: 'text-fuchsia-400',
};

export const ITEM_TYPE_LABEL: Record<ProductItemType, string> = {
  COVERAGE: 'Cobertura',
  HORSE: 'Cavalo',
  APPAREL: 'Vestuário',
};
