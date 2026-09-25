import { CreditCard, Pause, ShoppingCart, Tag, Trash2, UserRound } from 'lucide-react';
import { useToast } from '@/hooks';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TAX_RATE_OPTIONS } from '../constants';
import { useCartStore } from '../hooks';
import { computeCartTotals } from '../utils';
import { CartLineItem } from './CartLineItem';
import { formatCurrency } from '@/utils/format';

export interface CartPanelProps {
  onCharge: () => void;
  onHold: () => void;
  onOpenDiscount: () => void;
  onOpenCustomer: () => void;
  onClearRequest: () => void;
}

/**
 * Right pane of the split screen — live cart, customer, discounts, totals and
 * the Hold / Charge actions. State lives in the persisted cart store.
 */
export function CartPanel({
  onCharge,
  onHold,
  onOpenDiscount,
  onOpenCustomer,
  onClearRequest,
}: CartPanelProps) {
  const toast = useToast();

  const items = useCartStore((state) => state.items);
  const customerId = useCartStore((state) => state.customerId);
  const customerName = useCartStore((state) => state.customerName);
  const orderDiscount = useCartStore((state) => state.orderDiscount);
  const taxRatePct = useCartStore((state) => state.taxRatePct);
  const note = useCartStore((state) => state.note);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const setTaxRate = useCartStore((state) => state.setTaxRate);
  const setNote = useCartStore((state) => state.setNote);

  const totals = computeCartTotals(items, orderDiscount, taxRatePct);
  const discountActive = orderDiscount.value > 0;
  const isWalkIn = customerId === null;

  const handleIncrement = (productId: string): void => {
    const result = increment(productId);
    if (!result.ok) toast.warning('Stock limit reached for this item.');
  };

  const discountLabel = discountActive
    ? orderDiscount.type === 'percent'
      ? `Discount −${orderDiscount.value}%`
      : `Discount −${formatCurrency(orderDiscount.value)}`
    : 'Discount';

  return (
    <aside className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)]">
      <header className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingCart className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Current cart</h2>
          <Badge variant="secondary" size="sm">
            {totals.lines} / {totals.units} units
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          aria-label="Clear cart"
          disabled={items.length === 0}
          onClick={onClearRequest}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      <button
        type="button"
        onClick={onOpenCustomer}
        className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-left transition-colors hover:bg-accent/40"
      >
        <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm text-foreground">{customerName}</span>
        <span className="ml-auto shrink-0 text-xs font-medium text-primary">
          {isWalkIn ? 'Add customer' : 'Change'}
        </span>
      </button>

      <div className="min-h-44 flex-1 space-y-2 overflow-y-auto p-4">
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Cart is empty"
            description="Scan a barcode or tap a product to start a sale."
          />
        ) : (
          items.map((item) => (
            <CartLineItem
              key={item.productId}
              item={item}
              onIncrement={handleIncrement}
              onDecrement={decrement}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={discountActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={onOpenDiscount}
            leftIcon={<Tag className="h-3.5 w-3.5" />}
          >
            {discountLabel}
          </Button>
          <div className="ml-auto w-36">
            <Select
              aria-label="Tax rate"
              value={String(taxRatePct)}
              onChange={(event) => setTaxRate(Number(event.target.value))}
              options={TAX_RATE_OPTIONS}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Order note (optional)"
          className="h-8 text-xs"
          maxLength={120}
        />

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(totals.subtotal)}</dd>
          </div>
          {totals.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <dt>Discounts</dt>
              <dd className="tabular-nums">−{formatCurrency(totals.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <dt>Tax ({taxRatePct}%)</dt>
            <dd className="tabular-nums">{formatCurrency(totals.taxAmount)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
            <dt className="text-base font-semibold text-foreground">Total</dt>
            <dd className="text-xl font-bold tabular-nums text-foreground">
              {formatCurrency(totals.total)}
            </dd>
          </div>
        </dl>
      </div>

      <footer className="space-y-2 border-t border-border bg-muted/30 p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={onHold}
          disabled={items.length === 0}
          leftIcon={<Pause className="h-4 w-4" />}
        >
          Hold cart
          <kbd className="ml-1 rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
            F4
          </kbd>
        </Button>
        <Button
          variant="default"
          size="lg"
          className="w-full"
          onClick={onCharge}
          disabled={items.length === 0}
          leftIcon={<CreditCard className="h-4 w-4" />}
        >
          Charge {formatCurrency(totals.total)}
          <kbd className="ml-1 rounded border border-primary-foreground/30 bg-primary-foreground/15 px-1 py-0.5 font-mono text-[10px]">
            F9
          </kbd>
        </Button>
      </footer>
    </aside>
  );
}

export default CartPanel;