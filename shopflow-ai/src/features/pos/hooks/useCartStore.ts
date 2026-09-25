import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_TAX_RATE_PCT } from '../constants';
import { clampQuantity, computeCartTotals } from '../utils';
import type { CartItem, CartTotals, HeldCart, OrderDiscount, PosProduct } from '../types';

export type AddToCartResult =
  | { ok: true; added: number }
  | { ok: false; reason: 'out_of_stock' | 'stock_limit' };

export const WALK_IN_CUSTOMER = 'Walk-in customer';

interface CartStoreState {
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  orderDiscount: OrderDiscount;
  taxRatePct: number;
  note: string;

  addItem: (product: PosProduct, quantity?: number) => AddToCartResult;
  increment: (productId: string) => AddToCartResult;
  decrement: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => AddToCartResult;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (id: string | null, name: string) => void;
  setOrderDiscount: (discount: OrderDiscount) => void;
  setTaxRate: (ratePct: number) => void;
  setNote: (note: string) => void;
  /** Replaces the whole cart with a previously held one. */
  loadHeldCart: (held: HeldCart) => void;
  /** Post-checkout reset: empties the basket and returns to walk-in. */
  resetAfterSale: () => void;
}

function toCartItem(product: PosProduct, quantity: number): CartItem {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    categoryId: product.categoryId,
    unitPrice: product.price,
    cost: product.cost,
    quantity,
    unit: product.unit,
    imageUrl: product.imageUrl,
    stockOnHand: product.stock,
    discountPct: 0,
  };
}

const EMPTY_DISCOUNT: OrderDiscount = { type: 'percent', value: 0 };

/**
 * Smart POS cart — the cashier's working state.
 * Persisted to localStorage so a refresh mid-sale never loses the basket;
 * hold/resume goes through the API layer so other terminals can pick it up.
 */
export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      customerName: WALK_IN_CUSTOMER,
      orderDiscount: EMPTY_DISCOUNT,
      taxRatePct: DEFAULT_TAX_RATE_PCT,
      note: '',

      addItem: (product, quantity = 1) => {
        if (product.stock <= 0) return { ok: false, reason: 'out_of_stock' };

        const existing = get().items.find((item) => item.productId === product.id);
        if (existing) {
          const next = clampQuantity(existing.quantity + quantity, product.stock);
          if (next <= existing.quantity) return { ok: false, reason: 'stock_limit' };
          set({
            items: get().items.map((item) =>
              item.productId === product.id ? { ...item, quantity: next } : item,
            ),
          });
          return { ok: true, added: next - existing.quantity };
        }

        const added = clampQuantity(quantity, product.stock);
        set({ items: [...get().items, toCartItem(product, added)] });
        return { ok: true, added };
      },

      increment: (productId) => {
        const item = get().items.find((line) => line.productId === productId);
        if (!item) return { ok: false, reason: 'stock_limit' };
        const next = clampQuantity(item.quantity + 1, item.stockOnHand);
        if (next <= item.quantity) return { ok: false, reason: 'stock_limit' };
        set({
          items: get().items.map((line) =>
            line.productId === productId ? { ...line, quantity: next } : line,
          ),
        });
        return { ok: true, added: 1 };
      },

      decrement: (productId) => {
        set({
          items: get()
            .items.map((line) =>
              line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line,
            )
            .filter((line) => line.quantity > 0),
        });
      },

      setQuantity: (productId, quantity) => {
        const item = get().items.find((line) => line.productId === productId);
        if (!item) return { ok: false, reason: 'stock_limit' };
        if (quantity <= 0) {
          set({ items: get().items.filter((line) => line.productId !== productId) });
          return { ok: true, added: 0 };
        }
        const next = clampQuantity(quantity, item.stockOnHand);
        if (next <= item.quantity) return { ok: false, reason: 'stock_limit' };
        set({
          items: get().items.map((line) =>
            line.productId === productId ? { ...line, quantity: next } : line,
          ),
        });
        return { ok: true, added: next - item.quantity };
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((line) => line.productId !== productId) });
      },

      clearCart: () => set({ items: [], orderDiscount: EMPTY_DISCOUNT, note: '' }),

      setCustomer: (customerId, customerName) => set({ customerId, customerName }),

      setOrderDiscount: (orderDiscount) => set({ orderDiscount }),

      setTaxRate: (taxRatePct) => set({ taxRatePct }),

      setNote: (note) => set({ note }),

      loadHeldCart: (held) =>
        set({
          items: held.items,
          customerId: held.customerId,
          customerName: held.customerName,
          orderDiscount: held.orderDiscount,
          taxRatePct: held.taxRatePct,
          note: held.note,
        }),

      resetAfterSale: () =>
        set({
          items: [],
          customerId: null,
          customerName: WALK_IN_CUSTOMER,
          orderDiscount: EMPTY_DISCOUNT,
          taxRatePct: DEFAULT_TAX_RATE_PCT,
          note: '',
        }),
    }),
    {
      name: STORAGE_KEYS.POS_CART,
      /** Totals are derived — never persisted. */
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        customerName: state.customerName,
        orderDiscount: state.orderDiscount,
        taxRatePct: state.taxRatePct,
        note: state.note,
      }),
    },
  ),
);

/** Convenience selector: live totals for the current basket. */
export function selectCartTotals(state: {
  items: CartItem[];
  orderDiscount: OrderDiscount;
  taxRatePct: number;
}): CartTotals {
  return computeCartTotals(state.items, state.orderDiscount, state.taxRatePct);
}