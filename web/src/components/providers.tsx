'use client';

import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { PaymentProvider } from '@/context/payment-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <PaymentProvider>{children}</PaymentProvider>
      </CartProvider>
    </AuthProvider>
  );
}
