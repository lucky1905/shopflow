import { useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks';
import {
  DiscountModal,
  HoldCartModal,
  HeldCartsDrawer,
  PaymentModal,
  ReceiptModal,
  ReturnModal,
  TillTerminal,
} from '../components';
import { useCatalogSearch, usePosCatalogCategories } from '../api';
import { useCartStore } from '../hooks';
import type { PaymentMethod, PosProduct, Sale } from '../types';

/**
 * CashierBillingPage — the Phase 11 retail POS till for counter staff.
 *
 * A purpose-built supermarket billing terminal:
 *   - Full-width barcode scanner field (autofocused, Enter adds best match)
 *   - Category chips for one-touch filtering
 *   - Large product tiles (left 60%) — one tap adds to the bill
 *   - Large Current Bill panel (right 40%) with oversized steppers
 *   - Oversized tender buttons (UPI / Cash / Card / Credit)
 *   - Sticky full-width Complete Bill button showing the amount
 *
 * Deliberately contains zero analytics, AI cards, revenue widgets, smart
 * nudges, graphs or business KPIs — billing speed only. All cart, checkout
 * and modal business logic is unchanged from Phase 9/10.
 */
export function CashierBillingPage() {
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdsOpen, setHoldsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const orderDiscount = useCartStore((state) => state.orderDiscount);
  const taxRatePct = useCartStore((state) => state.taxRatePct);

  // Live products filtered by active category chip
  const { data: rawProducts = [], isLoading } = useCatalogSearch({
    query: '',
    categoryId: selectedCategory ?? 'all',
  });
  const { data: rawCategories = [] } = usePosCatalogCategories();

  const categories = useMemo(
    () => rawCategories.map((c) => ({ id: c.id, name: c.name })),
    [rawCategories],
  );

  // F-keys must never act behind an open dialog.
  const anyDialogOpen =
    paymentOpen || receiptOpen || returnOpen || discountOpen || holdModalOpen || holdsOpen;

  const handleAddProduct = (product: PosProduct) => {
    const result = addItem(product);
    if (!result.ok) {
      if (result.reason === 'out_of_stock') {
        toast.error(`${product.name} is out of stock.`);
      } else {
        toast.warning(`Cannot add more: only ${product.stock} available.`);
      }
    }
  };

  const startNewBill = () => {
    clearCart();
    setSearch('');
    setSelectedCategory(null);
    searchRef.current?.focus();
  };

  const openReceipt = (sale: Sale) => {
    setReceiptSale(sale);
    setReceiptOpen(true);
  };

  return (
    <div className="h-full w-full">
      <TillTerminal
        products={rawProducts}
        items={items}
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAddProduct}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={removeItem}
        onCharge={(method) => {
          setPaymentMethod(method);
          setPaymentOpen(true);
        }}
        onNewBill={startNewBill}
        onHold={() => setHoldModalOpen(true)}
        onHolds={() => setHoldsOpen(true)}
        onDiscount={() => setDiscountOpen(true)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        inputRef={searchRef}
        orderDiscount={orderDiscount}
        taxRatePct={taxRatePct}
        isLoading={isLoading}
        shortcutsEnabled={!anyDialogOpen}
        className="h-full"
      />

      <PaymentModal
        open={paymentOpen}
        initialMethod={paymentMethod}
        onClose={() => setPaymentOpen(false)}
        onComplete={(sale) => {
          setPaymentOpen(false);
          openReceipt(sale);
        }}
      />

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        sale={receiptSale}
        onNewSale={startNewBill}
        onStartReturn={() => {
          setReceiptOpen(false);
          setReturnOpen(true);
        }}
      />

      <DiscountModal open={discountOpen} onClose={() => setDiscountOpen(false)} />
      <HoldCartModal open={holdModalOpen} onClose={() => setHoldModalOpen(false)} />
      <HeldCartsDrawer open={holdsOpen} onClose={() => setHoldsOpen(false)} />
      <ReturnModal open={returnOpen} onClose={() => setReturnOpen(false)} initialSale={receiptSale} />
    </div>
  );
}

export default CashierBillingPage;
