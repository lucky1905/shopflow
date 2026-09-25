import { useMemo, useRef, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks';
import {
  AiRecommendations,
  CartPanel,
  CustomerPickerModal,
  DiscountModal,
  ExpressBilling,
  HeldCartsDrawer,
  HoldCartModal,
  PaymentModal,
  PosHeader,
  ProductBrowser,
  ReceiptModal,
  ReturnModal,
  SalesHistoryDrawer,
} from '../components';
import { useCatalogSearch, usePosRecommendations } from '../api';
import { useExpressShortcuts, usePosShortcuts, useCartStore } from '../hooks';
import type { PosProduct, Sale } from '../types';

/**
 * Smart POS â€” split-screen checkout: catalog + AI picks on the left,
 * live cart on the right, payment / receipt / returns as overlays.
 */
export function POSPage() {
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  // Express Billing is the default: it is the fastest path for a cashier.
  const [expressMode, setExpressMode] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [holdsOpen, setHoldsOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const orderDiscount = useCartStore((state) => state.orderDiscount);
  const taxRatePct = useCartStore((state) => state.taxRatePct);

  // Catalog powers the Express product grid.
  const { data: expressProducts = [] } = useCatalogSearch({ query: '', categoryId: 'all' });
  const { data: recommendations = [] } = usePosRecommendations([]);

  /**
   * Passive nudges for the Express side rail. Derived from live stock levels
   * so they stay accurate, and never modal â€” the cashier keeps billing.
   */
  const expressTips = useMemo(() => {
    const tips: string[] = [];

    const outOfStock = expressProducts.filter((p) => p.stock <= 0);
    if (outOfStock.length > 0) {
      tips.push(
        outOfStock.length === 1
          ? `${outOfStock[0].name} is out of stock.`
          : `${outOfStock.length} products are out of stock, starting with ${outOfStock[0].name}.`,
      );
    }

    const low = expressProducts.filter((p) => p.stock > 0 && p.stock <= 5).slice(0, 3);
    for (const product of low) {
      tips.push(`Only ${product.stock} units of ${product.name} left.`);
    }

    for (const rec of recommendations.slice(0, 2)) {
      tips.push(rec.reason);
    }

    tips.push('UPI is the most used payment method today â€” it is the first button on the payment bar.');

    return tips.slice(0, 5);
  }, [expressProducts, recommendations]);

  const focusSearch = (): void => searchRef.current?.focus();
  const cartHasItems = items.length > 0;

  const startNewBill = (): void => {
    clearCart();
    setSearch('');
  };

  usePosShortcuts({
    focusSearch,
    onCharge: () => setPaymentOpen(true),
    onHold: () => setHoldModalOpen(true),
    enabled: cartHasItems,
  });

  useExpressShortcuts({
    focusSearch,
    onCharge: () => setPaymentOpen(true),
    onHold: () => setHoldModalOpen(true),
    onCustomer: () => setCustomerOpen(true),
    onNewBill: startNewBill,
    onCancel: () => setExpressMode(false),
    enabled: expressMode,
  });

  const handleAddProduct = (product: PosProduct): void => {
    const result = addItem(product);
    if (!result.ok) {
      toast.error(
        result.reason === 'out_of_stock'
          ? `${product.name} is out of stock.`
          : `Only ${product.stock} of ${product.name} available.`,
      );
    }
  };

  const openReceipt = (sale: Sale): void => {
    setReceiptSale(sale);
    setReceiptOpen(true);
  };

  const startReturn = (sale: Sale): void => {
    setReceiptOpen(false);
    setHistoryOpen(false);
    setReturnSale(sale);
    setReturnOpen(true);
  };

  return (
    <PageContainer maxWidth="full">
      <PosHeader
        onOpenHolds={() => setHoldsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        expressMode={expressMode}
        onToggleExpress={() => setExpressMode((mode) => !mode)}
      />

      {expressMode ? (
        <ExpressBilling
          products={expressProducts}
          items={items}
          search={search}
          onSearchChange={setSearch}
          onAdd={handleAddProduct}
          onIncrement={increment}
          onDecrement={decrement}
          onRemove={removeItem}
          onCharge={() => setPaymentOpen(true)}
          onNewBill={startNewBill}
          onHold={() => setHoldModalOpen(true)}
          onCancel={() => setExpressMode(false)}
          aiTips={expressTips}
          inputRef={searchRef}
          orderDiscount={orderDiscount}
          taxRatePct={taxRatePct}
        />
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <ProductBrowser searchRef={searchRef} />
            <AiRecommendations onAddProduct={handleAddProduct} />
          </div>

          <CartPanel
            onCharge={() => setPaymentOpen(true)}
            onHold={() => setHoldModalOpen(true)}
            onOpenDiscount={() => setDiscountOpen(true)}
            onOpenCustomer={() => setCustomerOpen(true)}
            onClearRequest={() => setClearOpen(true)}
          />
        </div>
      )}

      <PaymentModal
        open={paymentOpen}
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
        onNewSale={focusSearch}
        onStartReturn={startReturn}
      />

      <DiscountModal open={discountOpen} onClose={() => setDiscountOpen(false)} />
      <CustomerPickerModal open={customerOpen} onClose={() => setCustomerOpen(false)} />
      <HoldCartModal open={holdModalOpen} onClose={() => setHoldModalOpen(false)} />
      <HeldCartsDrawer open={holdsOpen} onClose={() => setHoldsOpen(false)} />

      <SalesHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onViewReceipt={openReceipt}
        onStartReturn={startReturn}
      />

      <ReturnModal open={returnOpen} onClose={() => setReturnOpen(false)} initialSale={returnSale} />

      <ConfirmationDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clearCart();
          setClearOpen(false);
          toast.success('Cart cleared.');
        }}
        tone="danger"
        title="Clear the cart?"
        description="All items, discounts and notes for this basket will be removed."
        confirmLabel="Clear cart"
      />
    </PageContainer>
  );
}

export default POSPage;


