'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export interface PendingPayment {
  orderId: string;
  initPoint: string;
  total: number;
  itemCount: number;
}

const STORAGE_KEY = 'pendingPayment';

interface PaymentContextData {
  pendingPayment: PendingPayment | null;
  setPendingPayment: (data: PendingPayment | null) => void;
  clearPendingPayment: () => void;
}

const PaymentContext = createContext<PaymentContextData>({} as PaymentContextData);

function readStoredPayment(): PendingPayment | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingPayment) : null;
  } catch {
    return null;
  }
}

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [pendingPayment, setPendingPaymentState] = useState<PendingPayment | null>(readStoredPayment);

  const setPendingPayment = useCallback((data: PendingPayment | null) => {
    setPendingPaymentState(data);
    if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearPendingPayment = useCallback(() => setPendingPayment(null), [setPendingPayment]);

  return (
    <PaymentContext.Provider value={{ pendingPayment, setPendingPayment, clearPendingPayment }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  return useContext(PaymentContext);
}
