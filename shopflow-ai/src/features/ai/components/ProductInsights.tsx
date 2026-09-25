import { motion } from 'framer-motion';
import { Boxes, TrendingDown, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { SIGNAL_META, riskTone, scoreWidth, sortedProducts } from '../utils';
import type { ProductInsight } from '../types';

export interface ProductInsightsProps {
  products?: ProductInsight[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Product Insights — demand score, margin, cover and a growth signal. */
export function ProductInsights({
  products,
  isLoading,
  error,
  onRetry,
  className,
}: ProductInsightsProps) {
  const isEmpty = !isLoading && !error && (products?.length ?? 0) === 0;

  return (
    <SectionCard
      title="Product insights"
      description="Demand scoring per SKU with margin and stock-cover context."
      icon={<Boxes className="h-4 w-4" />}
      className={className}
      action={
        products && products.length > 0 ? (
          <Badge variant="outline" size="sm">
            {formatCurrency(products.reduce((sum, p) => sum + p.revenue, 0))} revenue
          </Badge>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState
          title="Product insights unavailable"
          message="We could not score your catalogue right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !products ? (
        <LoadingSkeleton variant="list" rows={5} />
      ) : isEmpty ? (
        <EmptyState
          icon={<Boxes className="h-5 w-5" />}
          title="No products to analyse"
          description="Add products and record a few sales to unlock demand scoring."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {sortedProducts(products).map((product, index) => (
            <ProductRow key={product.id} product={product} index={index} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ProductRow({ product, index }: { product: ProductInsight; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{product.name}</h3>
            <Badge variant={SIGNAL_META[product.signal].variant} size="sm" dot>
              {product.signal}
            </Badge>
            <Badge variant="outline" size="sm">
              {product.category}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{product.sku}</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold tabular-nums text-foreground">
            {formatCurrency(product.revenue)}
          </p>
          <p
            className={cn(
              'flex items-center justify-end gap-1 text-xs tabular-nums',
              product.growth >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {product.growth >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {product.growth > 0 ? '+' : ''}
            {product.growth.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Demand score</span>
          <span className="font-semibold tabular-nums text-foreground">{product.demandScore}/100</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: scoreWidth(product.demandScore) }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
            className={cn(
              'h-full rounded-full',
              product.signal === 'Rising'
                ? 'bg-success'
                : product.signal === 'Declining'
                  ? 'bg-destructive'
                  : 'bg-primary',
            )}
          />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Margin</dt>
          <dd className="font-semibold tabular-nums text-foreground">{product.margin.toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Units sold</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatNumber(product.unitsSold)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stock cover</dt>
          <dd className={cn('font-semibold tabular-nums', riskTone(product.stockCoverDays))}>
            {product.stockCoverDays} days
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Category</dt>
          <dd className="truncate font-semibold text-foreground">{product.category}</dd>
        </div>
      </dl>

      <p className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
        {product.recommendation}
      </p>
    </motion.li>
  );
}
