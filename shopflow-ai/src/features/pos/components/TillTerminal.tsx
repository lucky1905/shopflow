import { useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';
import {
  Banknote,
  BookUser,
  CreditCard,
  FilePlus2,
  Files,
  Minus,
  Pause,
  Percent,
  Plus,
  ScanBarcode,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { useKeyboardShortcut } from '@/hooks';
import { cn } from '@/lib/utils';
import { formatINR } from '@/utils/inr';
import { computeGst } from '../gst';
import { computeCartTotals, lineNet, sortCatalog } from '../utils';
import type { CartItem, OrderDiscount, PaymentMethod, PosProduct } from '../types';

export interface TillTerminalProps {
  products: PosProduct[];
  items: CartItem[];
  search: string;
  onSearchChange: (value: string) => void;
  /** Adds a product (or increments it when already in the bill). */
  onAdd: (product: PosProduct) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  /** Opens the tender pad pre-selected with the pressed payment method. */
  onCharge: (method?: PaymentMethod) => void;
  onNewBill: () => void;
  onHold?: () => void;
  onHolds?: () => void;
  onDiscount?: () => void;
  categories: Array<{ id: string; name: string }>;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  /**
   * Search input ref supplied by the page so shortcuts (F1 / Ctrl+B) can
   * move focus back to the scanner field.
   */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Order-level discount held in the cart store. */
  orderDiscount: OrderDiscount;
  /** Tax rate held in the cart store (matches the payment modal). */
  taxRatePct: number;
  isLoading?: boolean;
  /** Disabled while any dialog is open so F-keys never act behind a modal. */
  shortcutsEnabled?: boolean;
  className?: string;
}

const isInterState = false;

/**
 * Tender bar: exactly the four tenders a counter till collects. UPI leads
 * because it dominates Indian retail; every button opens the tender pad
 * pre-selected, so "tap product → tap UPI → confirm" is a three-tap sale.
 */
const TILL_TENDERS: ReadonlyArray<{
  method: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof Smartphone;
  primary?: boolean;
}> = [
  { method: 'mobile', label: 'UPI', hint: 'GPay · PhonePe · Paytm', icon: Smartphone, primary: true },
  { method: 'cash', label: 'Cash', hint: 'Notes & coins', icon: Banknote },
  { method: 'card', label: 'Card', hint: 'Debit · Credit', icon: CreditCard },
  { method: 'credit', label: 'Credit', hint: 'Udhar — pay later', icon: BookUser },
];

const SKELETON_TILES = 8;

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-medium tabular-nums',
          muted ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * TillTerminal — the Phase 11 retail POS surface for counter staff.
 *
 * Built for a supermarket billing desk on a 15–17" monitor:
 *   1. scan / search / tap products (large tiles, one tap adds)
 *   2. adjust quantity only if needed (oversized steppers)
 *   3. tap a tender → confirm → next customer
 *
 * Layout: full-width scanner bar → category chips → product grid (60%) +
 * Current Bill (40%) → oversized tender row → sticky full-width
 * Complete Bill. Zero analytics, AI cards or KPI widgets — billing only.
 */
export function TillTerminal({
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
  onHolds,
  onDiscount,
  categories,
  selectedCategory,
  onSelectCategory,
  inputRef,
  orderDiscount,
  taxRatePct,
  isLoading = false,
  shortcutsEnabled = true,
  className,
}: TillTerminalProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const searchRef = inputRef ?? localRef;

  const focusSearch = () => searchRef.current?.focus();

  // Barcode / SKU exact matches win over name matches, so Enter after a
  // scan always adds the product that was actually scanned.
  const matches = useMemo(() => sortCatalog(products, search), [products, search]);

  const totals = useMemo(
    () => computeCartTotals(items, orderDiscount, taxRatePct),
    [items, orderDiscount, taxRatePct],
  );
  const gst = useMemo(
    () => computeGst(totals.taxableAmount, taxRatePct, isInterState),
    [totals.taxableAmount, taxRatePct],
  );

  const cartQuantities = useMemo(
    () => new Map(items.map((item) => [item.productId, item.quantity])),
    [items],
  );

  const hasItems = items.length > 0;


  // The scanner keeps typing into this field — always return focus here.
  useEffect(() => {
    if (!isLoading) searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, items.length]);

  useKeyboardShortcut(
    'F1',
    (event) => {
      event.preventDefault();
      focusSearch();
    },
    { enabled: shortcutsEnabled },
  );
  useKeyboardShortcut(
    'b',
    (event) => {
      event.preventDefault();
      focusSearch();
    },
    { mod: true, enabled: shortcutsEnabled },
  );
  useKeyboardShortcut(
    'F2',
    (event) => {
      event.preventDefault();
      if (hasItems) onCharge('cash');
    },
    { enabled: shortcutsEnabled && hasItems },
  );
  useKeyboardShortcut(
    'F3',
    (event) => {
      event.preventDefault();
      onHold?.();
    },
    { enabled: shortcutsEnabled && hasItems && Boolean(onHold) },
  );
  useKeyboardShortcut(
    'n',
    (event) => {
      event.preventDefault();
      onNewBill();
    },
    { mod: true, enabled: shortcutsEnabled },
  );

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const query = search.trim();
      if (query && matches[0]) {
        event.preventDefault();
        onAdd(matches[0]);
        onSearchChange('');
      }
    }
    if (event.key === 'Escape' && search) {
      event.preventDefault();
      onSearchChange('');
    }
  };

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors active:scale-95',
      active
        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
        : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
    );


  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-background', className)}>
      {/* ── Scanner bar: full width, oversized, always focused ─────────── */}
      <div className="shrink-0 border-b border-border bg-card px-4 pt-3 pb-2.5">
        <div className="relative">
          <ScanBarcode className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-primary" />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Scan barcode or search product / SKU…"
            aria-label="Scan barcode or search product"
            autoComplete="off"
            className="h-14 w-full rounded-xl border-2 border-border bg-background pl-12 pr-28 text-lg font-semibold text-foreground shadow-sm outline-none transition-colors placeholder:font-medium placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs font-semibold text-muted-foreground sm:flex">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              F1
            </kbd>
            <span>·</span>
            <span>Enter adds</span>
          </span>
        </div>

        {/* Category chips for one-touch filtering */}
        {categories.length > 0 && (
          <div className="no-scrollbar -mx-1 mt-2.5 flex items-center gap-2 overflow-x-auto px-1">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={chipClass(selectedCategory === null)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={chipClass(selectedCategory === category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>


      {/* ── Products (60%) + Current Bill (40%) ────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_40%]">
        {/* Product grid — large, high-contrast, one tap adds */}
        <section className="flex min-h-0 flex-col overflow-y-auto bg-background">
          <div className="flex items-center justify-between px-4 pt-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Products
            </h2>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {matches.length} shown
            </span>
          </div>

          <div className="p-4 pt-2.5">
            {isLoading && matches.length === 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: SKELETON_TILES }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full rounded-2xl" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No product matched"
                description="Scan the barcode or type a few letters of the product name."
                compact
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {matches.map((product) => {
                  const out = product.stock <= 0;
                  const low = !out && product.stock <= 5;
                  const inCart = cartQuantities.get(product.id) ?? 0;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={out}
                      onClick={() => onAdd(product)}
                      className={cn(
                        'flex min-h-[112px] flex-col items-stretch gap-2 rounded-2xl border-2 bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
                        inCart > 0 && 'border-primary bg-primary/5 shadow-md',
                        out && 'border-border/60',
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
                          {product.name}
                        </span>
                        {out ? (
                          <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-destructive">
                            Out
                          </span>
                        ) : low ? (
                          <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            {product.stock} left
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto flex w-full items-end justify-between gap-2">
                        <span className="text-xl font-black tabular-nums leading-none text-foreground">
                          {formatINR(product.price)}
                          {product.unit !== 'pc' && (
                            <span className="ml-0.5 text-xs font-bold text-muted-foreground">
                              /{product.unit}
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors',
                            inCart > 0 && 'text-base font-black',
                          )}
                          aria-hidden="true"
                        >
                          {inCart > 0 ? inCart : <Plus className="h-5 w-5" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>


        {/* Current Bill — 40% width, always visible, oversized controls */}
        <aside className="flex min-h-0 flex-col border-l-2 border-border bg-card">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-border px-4 py-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-black tracking-tight text-foreground">
                Current Bill
              </h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black tabular-nums text-primary">
                {totals.units} {totals.units === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={!hasItems}
                onClick={() => onDiscount?.()}
              >
                <Percent className="h-3.5 w-3.5" />
                Discount
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={!hasItems || !onHold}
                onClick={() => onHold?.()}
              >
                <Pause className="h-3.5 w-3.5" />
                Hold
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => onHolds?.()}
              >
                <Files className="h-3.5 w-3.5" />
                Holds
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs font-bold"
                onClick={onNewBill}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
          </div>

          {/* Lines */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {!hasItems ? (
              <EmptyState
                icon={<ShoppingBag className="h-5 w-5" />}
                title="No items yet"
                description="Scan a barcode or tap a product to start the bill."
                compact
                className="py-10"
              />
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="rounded-xl border border-border bg-background p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemove(item.productId)}
                        aria-label={`Remove ${item.name} from bill`}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDecrement(item.productId)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/60 hover:bg-accent active:scale-95"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-9 text-center text-base font-black tabular-nums text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrement(item.productId)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/60 hover:bg-accent active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
                          × {formatINR(item.unitPrice)}
                        </span>
                      </div>
                      <span className="text-sm font-black tabular-nums text-foreground">
                        {formatINR(lineNet(item))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>


          {/* Totals + grand total */}
          <div className="shrink-0 space-y-1.5 border-t-2 border-border bg-muted/40 px-4 py-3">
            <Row label="Subtotal" value={formatINR(totals.subtotal)} />
            {totals.discountTotal > 0 && (
              <Row label="Discount" value={`− ${formatINR(totals.discountTotal)}`} muted />
            )}
            <Row
              label={isInterState ? `IGST @ ${taxRatePct}%` : `CGST + SGST @ ${taxRatePct}%`}
              value={formatINR(totals.taxAmount)}
            />
            {!isInterState && totals.taxAmount > 0 && (
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>
                  CGST {formatINR(gst.cgst)} · SGST {formatINR(gst.sgst)}
                </span>
              </div>
            )}
            <div className="flex items-end justify-between border-t border-border pt-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Grand Total
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {totals.lines} {totals.lines === 1 ? 'line' : 'lines'} · tax incl.
                </p>
              </div>
              <span className="text-3xl font-black tabular-nums leading-none text-foreground">
                {formatINR(totals.total)}
              </span>
            </div>
          </div>
        </aside>
      </div>


      {/* ── Tender bar + sticky full-width Complete Bill ───────────────── */}
      <footer className="shrink-0 border-t-2 border-border bg-card px-4 py-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TILL_TENDERS.map((tender) => {
            const Icon = tender.icon;
            return (
              <button
                key={tender.method}
                type="button"
                disabled={!hasItems}
                onClick={() => onCharge(tender.method)}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 2xl:h-[76px]',
                  tender.primary
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90'
                    : 'border-border bg-background text-foreground hover:border-primary/60 hover:bg-accent',
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-base font-black leading-none">{tender.label}</span>
                <span
                  className={cn(
                    'hidden text-[10px] font-semibold leading-none sm:block',
                    tender.primary ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {tender.hint}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!hasItems}
          onClick={() => onCharge('cash')}
          className="mt-2.5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 2xl:h-16"
        >
          <span className="text-xl font-black tracking-wide">COMPLETE BILL</span>
          <span className="rounded-xl bg-primary-foreground/20 px-3 py-1 text-lg font-black tabular-nums">
            {formatINR(totals.total)}
          </span>
        </button>
      </footer>
    </div>
  );
}

export default TillTerminal;

