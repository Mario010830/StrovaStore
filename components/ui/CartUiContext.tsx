"use client";

import { createContext, useContext } from "react";

export type CartUiValue = {
  openCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
};

const CartUiContext = createContext<CartUiValue | null>(null);

export function CartUiProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CartUiValue;
}) {
  return <CartUiContext.Provider value={value}>{children}</CartUiContext.Provider>;
}

export function useCartUi(): CartUiValue | null {
  return useContext(CartUiContext);
}

/** Abre el panel del carrito (no-op si no hay provider). */
export function useOpenCart(): () => void {
  const ctx = useContext(CartUiContext);
  return ctx?.openCart ?? (() => {});
}
