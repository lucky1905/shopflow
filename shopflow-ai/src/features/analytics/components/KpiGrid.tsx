import { motion } from 'framer-motion';
import {
  Banknote,
  Boxes,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { percentLabel } from '../utils';
import type { AnalyticsKpis } from '../types';

interface Kpi {
  key: string;
  label: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
}

export interface KpiGridProps {
  kpis?: AnalyticsKpis;
  isLoading?: boolean;
  className?: string;
}

/** Headline KPI row: revenue, orders, profit, inventory, AOV and growth. */
export function KpiGrid({ kpis, isLoading, className }: KpiGridProps) {
  if (isLoading || !kpis) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6', className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-6 w-24" />
            <Skeleton className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const items: Kpi[] = [
    { key: 'revenue', label: 'Revenue', value: formatCurrency(kpis.revenue, 'USD', { notation: 'compact', maximumFractionDigits: 0 }), change: kpis.revenueChange, icon: Banknote },
    { key: 'orders', label: 'Orders', value: formatNumber(kpis.orders), change: kpis.ordersChange, icon: ShoppingCart },
    { key: 'profit', label: 'Profit', value: formatCurrency(kpis.profit, 'USD', { notation: 'compact', maximumFractionDigits: 0 }), change: kpis.profitChange, icon: Wallet },
    { key: 'inventory', label: 'Inventory value', value: formatCurrency(kpis.inventoryValue, 'USD', { notation: 'compact', maximumFractionDigits: 0 }), change: kpis.inventoryValueChange, icon: Boxes },
    { key: 'aov', label: 'Avg order value', value: formatCurrency(kpis.avgOrderValue), change: kpis.avgOrderValueChange, icon: Receipt },
    { key: 'growth', label: 'Growth', value: percentLabel(kpis.growth), change: kpis.growthChange, icon: Percent },
  ];

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const positive = item.change >= 0;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
                positive ? 'text-success' : 'text-destructive',
              )}
            >
              <TrendingUp className={cn('h-3 w-3', !positive && '-scale-x-100')} />
              {percentLabel(item.change)}
              <span className="text-muted-foreground">vs prev period</span>
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
