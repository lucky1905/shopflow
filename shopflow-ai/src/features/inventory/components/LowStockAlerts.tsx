import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCheck, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';
import { LOW_STOCK_ALERTS_LIMIT } from '../constants';
import type { Product, Supplier } from '../types';
import { getStockStatus } from '../utils';
import { ProductThumb } from './ProductThumb';

export interface LowStockAlertsProps {
  products: Product[];
  suppliers: Supplier[];
  onAdjustStock: (product: Product) => void;
  onViewAll?: () => void;
  className?: string;
}

const TONE = {
  out_of_stock: { stripe: 'bg-rose-500', pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', label: 'Out' },
  low_stock: { stripe: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'Low' },
  in_stock: { stripe: 'bg-emerald-500', pill: '', label: '' },
} as const;

/** Urgency-striped reorder queue, ranked most critical first. */
export function LowStockAlerts({ products, suppliers, onAdjustStock, onViewAll, className }: LowStockAlertsProps) {
  const critical = products.filter(
    (product) => getStockStatus(product.stock, product.reorderPoint) === 'out_of_stock',
  ).length;
  const visible = products.slice(0, LOW_STOCK_ALERTS_LIMIT);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-black/[0.06] bg-card/85 text-card-foreground backdrop-blur-xl',
        'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_24px_60px_-24px_rgba(76,29,149,0.25)]',
        'dark:border-white/[0.07]',
        className,
      )}
      aria-label="Low stock alerts"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-0 sm:p-7 sm:pb-0">
        <div>
          <h3 className="text-base font-bold tracking-tight">Low stock alerts</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Ranked by remaining units</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold',
            critical > 0
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          )}
        >
          {critical > 0 && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
            </span>
          )}
          {critical > 0 ? `${critical} critical` : 'All good'}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          compact
          icon={<CheckCheck className="h-5 w-5" />}
          title="All stocked up"
          description="Nothing is below its reorder point right now."
          className="mx-auto max-w-xs"
        />
      ) : (
        <ul className="mt-4 space-y-2.5 p-4 sm:p-5">
          {visible.map((product, index) => {
            const status = getStockStatus(product.stock, product.reorderPoint);
            const tone = TONE[status];
            const supplier = suppliers.find((item) => item.id === product.supplierId);
            const coverPct = Math.min(
              100,
              Math.round((product.stock / Math.max(product.reorderPoint * 2, 1)) * 100),
            );

            return (
              <motion.li
                key={product.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3 pl-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', tone.stripe)} />

                <ProductThumb product={product} size="sm" className="ml-1" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold leading-tight">{product.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {product.sku}
                    {supplier ? ` · ${supplier.name}` : ''}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                      <div className={cn('h-full rounded-full', tone.stripe)} style={{ width: `${coverPct}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                      {product.stock} / par {product.reorderPoint}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                      tone.pill,
                    )}
                  >
                    {tone.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustStock(product)}
                    className="inline-flex items-center gap-0.5 rounded-lg border border-black/[0.07] px-2 py-1 text-[11px] font-bold transition-all hover:border-violet-400/50 hover:text-violet-500 dark:border-white/[0.09]"
                  >
                    <Scale className="h-3 w-3" /> Restock
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      {onViewAll && products.length > visible.length && (
        <div className="border-t border-black/[0.06] p-4 dark:border-white/[0.06] sm:px-6">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-black/[0.06] px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-violet-400/40 hover:text-foreground dark:border-white/[0.08]"
          >
            Review all {products.length} in the table <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}

export default LowStockAlerts;
