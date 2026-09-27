import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Clock,
  CreditCard,
  Package,
  QrCode,
  Truck,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/utils/format';
import { OWNER_METRICS } from '../data';
import { GlassCard, Reveal, SectionHead } from './primitives';

interface OwnerMetricsOverviewProps {
  pendingPurchasesCount?: number;
  className?: string;
}

const METHOD_CONFIG: Record<
  string,
  { label: string; icon: typeof Wallet; color: string; bg: string }
> = {
  cash: {
    label: 'Cash Tender',
    icon: Wallet,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  upi: {
    label: 'UPI QR Pay',
    icon: QrCode,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  card: {
    label: 'Card POS',
    icon: CreditCard,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  credit: {
    label: 'Store Credit (Udhar)',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
};

export function OwnerMetricsOverview({
  pendingPurchasesCount = 0,
  className,
}: OwnerMetricsOverviewProps) {
  const { todayRevenue, todaySales, outstandingCredit, paymentBreakdown, lowStockItems } =
    OWNER_METRICS;

  const totalBreakdownRevenue = useMemo(
    () => paymentBreakdown.reduce((sum, item) => sum + item.revenue, 0),
    [paymentBreakdown],
  );

  return (
    <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-12', className)}>
      <Reveal delay={0.12} className="lg:col-span-7">
        <GlassCard className="flex h-full flex-col p-6 sm:p-7">
          <SectionHead
            title="Today's Performance & Payment Mix"
            sub="Live revenue, checkout volume and tender breakdown across counters"
            right={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Today
              </span>
            }
          />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-black/[0.02] p-4 dark:bg-white/[0.02]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Today's Revenue
              </span>
              <p className="mt-1 text-2xl font-black tracking-tight text-foreground tabular-nums">
                {formatCurrency(todayRevenue)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">From open counters</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-black/[0.02] p-4 dark:bg-white/[0.02]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Today's Checkouts
              </span>
              <p className="mt-1 text-2xl font-black tracking-tight text-foreground tabular-nums">
                {formatNumber(todaySales)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Completed tickets</p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Outstanding Credit
              </span>
              <p className="mt-1 text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(outstandingCredit)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Customer udhar due</p>
            </div>
          </div>

          <div className="mt-6 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Payment Method Breakdown
            </h4>

            {paymentBreakdown.length === 0 ? (
              <div className="mt-4 flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                <span>No checkout payment data recorded yet today.</span>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {paymentBreakdown.map((item) => {
                  const key = item.method.toLowerCase();
                  const config = METHOD_CONFIG[key] ?? {
                    label: item.method.toUpperCase(),
                    icon: Wallet,
                    color: 'text-primary',
                    bg: 'bg-muted/40 border-border',
                  };
                  const Icon = config.icon;
                  const sharePct =
                    totalBreakdownRevenue > 0
                      ? Math.round((item.revenue / totalBreakdownRevenue) * 100)
                      : 0;

                  return (
                    <div
                      key={item.method}
                      className="rounded-2xl border border-border/50 bg-background/60 p-3.5 transition-all hover:border-primary/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                              config.bg,
                              config.color,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{config.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatNumber(item.sales)} sale{item.sales === 1 ? '' : 's'} · {sharePct}% of total
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black tabular-nums text-foreground">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sharePct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      </Reveal>

      <Reveal delay={0.18} className="lg:col-span-5">
        <GlassCard className="flex h-full flex-col p-6 sm:p-7">
          <SectionHead
            title="Stock & Procurement Alerts"
            sub="Immediate inventory risks requiring owner review"
            right={
              <Link
                to={ROUTES.INVENTORY}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Catalog <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />

          <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-sm">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Pending Supplier POs</p>
                  <p className="text-[11px] text-muted-foreground">
                    Awaiting goods receipt or delivery
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-violet-600 dark:text-violet-400 tabular-nums">
                  {formatNumber(pendingPurchasesCount)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Link
                to={ROUTES.PURCHASES}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-background px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:bg-violet-500/10"
              >
                Open Purchases Module <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                Low Stock Critical Alerts ({lowStockItems.length})
              </h4>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="mt-3 flex h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                <span>All active products are above their reorder thresholds.</span>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                {lowStockItems.slice(0, 5).map((item) => {
                  const outOfStock = item.stock <= 0;
                  return (
                    <li
                      key={item.productId}
                      className="flex items-center justify-between p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                            outOfStock
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          <Package className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-foreground">
                            {item.productName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Min stock par: {item.minStock} units
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-black tabular-nums',
                            outOfStock
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {item.stock} left
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </GlassCard>
      </Reveal>
    </div>
  );
}

export default OwnerMetricsOverview;