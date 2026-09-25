'use client';

import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  id: string;
  itemId?: string;
  itemType?: 'COVERAGE' | 'HORSE' | 'APPAREL';
  title?: string;
  subtitle?: string;
  image: string | null;
  price: number;
  quantity?: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextData {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addToCart(item: CartItem) {
    setItems((current) => {
      const idx = current.findIndex(
        (i) =>
          (i.itemId || i.id) === (item.itemId || item.id) &&
          (i.itemType || 'APPAREL') === (item.itemType || 'APPAREL') &&
          (i.selectedSize || '') === (item.selectedSize || '') &&
          (i.selectedColor || '') === (item.selectedColor || '')
      );
      if (idx < 0) return [...current, item];
      const clone = [...current];
      const currentItem = clone[idx]!;
      clone[idx] = { ...currentItem, quantity: (currentItem.quantity ?? 1) + (item.quantity ?? 1) };
      return clone;
    });
  }

  function removeFromCart(itemId: string) {
    setItems((current) => current.filter((i) => i.id !== itemId));
  }

  function updateQuantity(itemId: string, quantity: number) {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  }

  function clearCart() {
    setItems([]);
  }

  const total = items.reduce((acc, item) => acc + item.price * (item.quantity ?? 1), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
