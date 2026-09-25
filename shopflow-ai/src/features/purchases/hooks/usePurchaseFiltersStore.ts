import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_PAYMENT_FILTERS, DEFAULT_PURCHASE_FILTERS } from '../constants';
import type { PaymentFilters, PurchaseOrderFilters } from '../types';

/* -------------------------------------------------------------------------- */
/*  Purchase order table filters (persisted)                                  */
/* -------------------------------------------------------------------------- */

interface PurchaseFiltersState extends PurchaseOrderFilters {
  patch: (values: Partial<PurchaseOrderFilters>) => void;
  reset: () => void;
}

export const usePurchaseFiltersStore = create<PurchaseFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_PURCHASE_FILTERS,
      patch: (values) =>
        set((state) => ({ ...state, ...values, page: values.page ?? state.page })),
      reset: () => set({ ...DEFAULT_PURCHASE_FILTERS }),
    }),
    { name: STORAGE_KEYS.PURCHASE_FILTERS },
  ),
);

/* -------------------------------------------------------------------------- */
/*  Supplier payment table filters                                            */
/* -------------------------------------------------------------------------- */

interface PaymentFiltersState extends PaymentFilters {
  patch: (values: Partial<PaymentFilters>) => void;
  reset: () => void;
}

export const usePaymentFiltersStore = create<PaymentFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_PAYMENT_FILTERS,
      patch: (values) =>
        set((state) => ({ ...state, ...values, page: values.page ?? state.page })),
      reset: () => set({ ...DEFAULT_PAYMENT_FILTERS }),
    }),
    { name: `${STORAGE_KEYS.PURCHASE_FILTERS}-payments` },
  ),
);