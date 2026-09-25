import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ScanBarcode, Search, Sparkles, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatINR } from '@/utils/inr';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { computeGst } from '../gst';
import { computeCartTotals } from '../utils';
import { EXPRESS_PAYMENT_OPTIONS, EXPRESS_SHORTCUTS } from '../expressConstants';
import type { CartItem, OrderDiscount, PaymentMethod, PosProduct } from '../types';

export interface ExpressBillingProps {
  products: PosProduct[];
  items: CartItem[];
  search: string;
  onSearchChange: (value: string) => void;
  /** Adds a product (or increments it when already in the cart). */
  onAdd: (product: PosProduct) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCharge: (method: PaymentMethod) => void;
  onNewBill: () => void;
  onHold?: () => void;
  onCancel?: () => void;
  /** Non-blocking nudges shown in the side rail. */
  aiTips?: string[];
  /**
   * Search input ref supplied by the page so global shortcuts (F1 / Ctrl+B)
   * can move focus here. Falls back to an internal ref when omitted.
   */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Order-level discount held in the cart store. */
  orderDiscount: OrderDiscount;
  /** Tax rate held in the cart store (matches the payment modal). */
  taxRatePct: number;
  isLoading?: boolean;
  className?: string;
}

const isInterState = false;

/** Filtered by name, SKU or barcode — the scanner writes into the same field. */
function useProductMatches(products: PosProduct[], search: string, cartIds: string[]) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.includes(q),
        )
      : products;

    // Already-in-cart items sink; the cashier wants the next item to sell.
    return [...list].sort((a, b) => {
      const aIn = cartIds.includes(a.id) ? 1 : 0;
      const bIn = cartIds.includes(b.id) ? 1 : 0;
      return aIn - bIn;
    });
  }, [products, search, cartIds]);
}

/**
 * Express Billing — the speed-first billing surface for Indian retail.
 *
 * Designed so a cashier finishes a sale in three actions:
 *   1. scan / search / tap a product
 *   2. adjust quantity only if the customer changed their mind
 *   3. press the payment button (UPI first)
 *
 * The search field stays focused at all times, the cart never collapses, and
 * the payment bar is pinned to the bottom.
 */
export function ExpressBilling({
  products,
  items,
  search,
  onSearchChange,
  onAdd,
  onIncrement,
  onDecrement,
  onRemove,
  onCharge,
  onNewBill,
  onHold,
  onCancel,
  aiTips = [],
  isLoading,
  orderDiscount,
  inputRef,
  taxRatePct,
  className,
}: ExpressBillingProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const searchRef = inputRef ?? localRef;

  const cartIds = useMemo(() => items.map((item) => item.productId), [items]);
  const matches = useProductMatches(products, search, cartIds);

  // Same engine as the standard cart and the payment modal, so the amount
  // shown here is always the amount actually collected.
  const totals = useMemo(
    () => computeCartTotals(items, orderDiscount, taxRatePct),
    [items, orderDiscount, taxRatePct],
  );

  // GST split for display only (CGST+SGST intra-state, IGST inter-state).
  const gst = useMemo(
    () => computeGst(totals.taxableAmount, taxRatePct, isInterState),
    [totals.taxableAmount, taxRatePct],
  );

  // Keep the scanner/search target focused so typing "just works".
  useEffect(() => {
    if (!isLoading) searchRef.current?.focus();
  }, [isLoading, items.length]);

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-background', className)}>
      {/* Top bar: brand, bill actions, shortcuts */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            Express
          </span>
          <h1 className="text-base font-semibold text-foreground">New Bill</h1>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {onHold && (
            <Button variant="outline" size="sm" onClick={onHold}>
              Hold (F3)
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onNewBill}>
            New Bill (Ctrl+N)
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_400px_260px]">
        {/* Product picker */}
        <section className="flex min-h-0 flex-col border-r border-border">
          <div className="shrink-0 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  // Enter adds the first match — the scanner "returns" behave.
                  if (event.key === 'Enter' && matches[0]) {
                    event.preventDefault();
                    onAdd(matches[0]);
                    onSearchChange('');
                  }
                }}
                placeholder="Scan barcode or type product name / SKU…"
                aria-label="Search or scan product"
                className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-28 text-base font-medium text-foreground shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                F1 · Ctrl+B
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {matches.length === 0 ? (
              <EmptyState
                icon={<ScanBarcode className="h-5 w-5" />}
                title="No product matched"
                description="Scan the barcode or type a few letters of the name."
                compact
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {matches.map((product, index) => {
                  const low = product.stock > 0 && product.stock <= 5;
                  const out = product.stock <= 0;
                  return (
                    <motion.button
                      key={product.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.2) }}
                      onClick={() => onAdd(product)}
                      disabled={out}
                      className={cn(
                        'group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50',
                        out && 'pointer-events-none',
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                          {product.name}
                        </span>
                        {out ? (
                          <Badge variant="danger" size="sm">
                            Out
                          </Badge>
                        ) : low ? (
                          <Badge variant="warning" size="sm">
                            {product.stock} left
                          </Badge>
                        ) : null}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {product.description.split(' - ')[0]}
                      </p>

                      <div className="mt-auto flex w-full items-end justify-between gap-2">
                        <span className="text-lg font-bold tabular-nums text-primary">
                          {formatINR(product.price)}
                        </span>
                        <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          ADD
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Cart - always visible */}
        <section className="flex min-h-0 flex-col border-r border-border bg-card">
          <div className="shrink-0 border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Cart{items.length > 0 && ` (${formatNumber(items.length)})`}
              </h2>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onNewBill}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            {items.length === 0 ? (
              <EmptyState
                icon={<ScanBarcode className="h-5 w-5" />}
                title="Cart is empty"
                description="Scan a barcode or tap a product to begin."
                compact
              />
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="rounded-lg border border-border bg-background p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-medium text-foreground">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDecrement(item.productId)}
                          aria-label="Decrease quantity"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent active:scale-95"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold tabular-nums text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrement(item.productId)}
                          aria-label="Increase quantity"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totals */}
          <div className="shrink-0 space-y-1.5 border-t border-border bg-muted/30 px-4 py-3 text-sm">
            <Row label="Subtotal" value={formatINR(totals.subtotal)} />
            <Row label="Discount" value={formatINR(totals.discountTotal)} />
            <Row
              label={isInterState ? `IGST @${taxRatePct}%` : `CGST+SGST @${taxRatePct}%`}
              value={formatINR(totals.taxAmount)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {isInterState ? (
                <>
                  <span>IGST @${taxRatePct}%</span>
                  <span>{formatINR(gst.igst)}</span>
                </>
              ) : (
                <>
                  <span>CGST</span>
                  <span>{formatINR(gst.cgst)}</span>
                  <span>SGST</span>
                  <span>{formatINR(gst.sgst)}</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-semibold text-foreground">Grand Total</span>
              <span className="text-xl font-bold tabular-nums text-primary">
                {formatINR(totals.total)}
              </span>
            </div>
          </div>
        </section>

        {/* AI nudges - passive, never modal */}
        <aside className="hidden min-h-0 flex-col overflow-y-auto bg-card p-4 xl:flex">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-highlight" />
            <h2 className="text-sm font-semibold text-foreground">Smart nudges</h2>
          </div>
          <ul className="space-y-2">
            {aiTips.length === 0 ? (
              <li className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                No alerts right now.
              </li>
            ) : (
              aiTips.map((tip, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground"
                >
                  {tip}
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      {/* Fixed payment bar - the final action */}
      <footer className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {EXPRESS_PAYMENT_OPTIONS.map((option) => {
            const disabled = items.length === 0;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onCharge(option.id)}
                className={cn(
                  'flex min-w-[112px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-3 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
                  option.primary
                    ? 'border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                    : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent',
                )}
              >
                <span className="text-lg leading-none">{option.emoji}</span>
                <span className="text-sm font-bold leading-tight">{option.label}</span>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    option.primary ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {option.hint}
                </span>
              </button>
            );
          })}

          {onCancel && (
            <Button variant="ghost" size="lg" onClick={onCancel} aria-label="Cancel bill (Esc)">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            Grand Total {formatINR(totals.total)}
          </span>
          {EXPRESS_SHORTCUTS.map((shortcut) => (
            <span key={shortcut.keys}>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
                {shortcut.keys}
              </kbd>{' '}
              {shortcut.action}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}




