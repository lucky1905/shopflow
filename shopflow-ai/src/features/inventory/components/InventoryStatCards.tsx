import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Banknote, Boxes, CircleAlert, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { InventorySummary, StockStatus } from '../types';

const CARD_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  skus: Boxes,
  value: Banknote,
  low: TriangleAlert,
  out: CircleAlert,
};

export interface InventoryStatCardsProps {
  summary: InventorySummary;
  /** Clicking the low/out cards applies the matching table filter. */
  onSelectStockFilter?: (status: StockStatus) => void;
  className?: string;
}

interface CardConfig {
  id: string;
  label: string;
  value: string;
  caption: string;
  orb: string;
  glow: string;
  /** Makes the card a filter shortcut with a "View ->" affordance. */
  filterTo?: StockStatus;
  /** Ambient pulse on the value for critical counts. */
  pulse?: boolean;
}

/**
 * The module's analytics cards — Total SKUs, inventory value, low & out of
 * stock counters, rendered as KPI-style glass cards with gradient orbs.
 */
export function InventoryStatCards({ summary, onSelectStockFilter, className }: InventoryStatCardsProps) {
  const { stats } = summary;

  const cards: CardConfig[] = [
    {
      id: 'skus',
      label: 'Active SKUs',
      value: formatNumber(stats.activeSkus),
      caption: `${formatNumber(stats.totalUnits)} units on hand · ${stats.stockHealthPct}% healthy`,
      orb: 'from-violet-500 to-fuchsia-500',
      glow: 'bg-violet-500',
    },
    {
      id: 'value',
      label: 'Inventory value',
      value: formatCurrency(stats.retailValue),
      caption: `${formatCurrency(stats.inventoryValue)} at cost`,
      orb: 'from-cyan-500 to-sky-500',
      glow: 'bg-cyan-500',
    },
    {
      id: 'low',
      label: 'Low stock',
      value: formatNumber(stats.lowStockCount),
      caption: 'At or below reorder point',
      orb: 'from-amber-400 to-orange-500',
      glow: 'bg-amber-500',
      filterTo: 'low_stock',
      pulse: stats.lowStockCount > 0,
    },
    {
      id: 'out',
      label: 'Out of stock',
      value: formatNumber(stats.outOfStockCount),
      caption: 'Needs immediate reorder',
      orb: 'from-rose-500 to-red-500',
      glow: 'bg-rose-500',
      filterTo: 'out_of_stock',
      pulse: stats.outOfStockCount > 0,
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {cards.map((card, index) => {
        const Icon = CARD_ICONS[card.id] ?? Boxes;
        const clickable = Boolean(card.filterTo && onSelectStockFilter);

        return (
          <motion.article
            key={card.id}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
            whileHover={clickable ? { y: -4 } : undefined}
            onClick={
              clickable && card.filterTo
                ? () => onSelectStockFilter?.(card.filterTo as StockStatus)
                : undefined
            }
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              clickable && card.filterTo
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      onSelectStockFilter?.(card.filterTo as StockStatus);
                    }
                  }
                : undefined
            }
            className={cn(
              'group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-card/85 p-6 backdrop-blur-xl',
              'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_24px_60px_-24px_rgba(76,29,149,0.25)]',
              'transition-shadow hover:shadow-[0_2px_4px_rgba(15,10,40,0.05),0_36px_80px_-24px_rgba(147,51,234,0.4)]',
              'dark:border-white/[0.07]',
              clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {/* Ambient gradient wash */}
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-[0.16] blur-3xl transition-opacity duration-500 group-hover:opacity-30',
                card.glow,
              )}
            />

            <div className="relative flex items-start justify-between">
              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                  card.orb,
                )}
              >
                <Icon className="h-5.5 w-5.5" />
              </span>

              {card.filterTo && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowUpRight className="h-3 w-3" />
                </span>
              )}
            </div>

            <p className="relative mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {card.label}
            </p>
            <p className="relative mt-1 flex items-center gap-2 text-[38px] font-black leading-none tracking-tighter tabular-nums">
              {card.value}
              {card.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current opacity-70" />
                </span>
              )}
            </p>
            <p className="relative mt-2 text-xs text-muted-foreground">{card.caption}</p>
          </motion.article>
        );
      })}
    </div>
  );
}

export default InventoryStatCards;
