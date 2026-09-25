import { useState } from 'react';
import { CalendarClock, Pencil, Scale, Trash } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { Badge } from '@/components/common/Badge';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useProductDetail } from '../api';
import { DETAIL_MOVEMENTS_LIMIT, STOCK_STATUS_META } from '../constants';
import type { CategoryWithCount, Product, SupplierWithCount } from '../types';
import { computeMarginPct, computeStockValue, getStockStatus } from '../utils';
import { Barcode } from './Barcode';
import { CodeChip } from './CodeChip';
import { ProductStatsGrid } from './ProductStatsGrid';
import { ProductThumb } from './ProductThumb';
import { StatusBadge } from './StatusBadge';
import { StockTimeline } from './StockTimeline';

export interface ProductDetailsDrawerProps {
  /** Product to display; `null` keeps the drawer idle. */
  productId: string | null;
  open: boolean;
  onClose: () => void;
  categories: CategoryWithCount[];
  suppliers: SupplierWithCount[];
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onDelete: (product: Product) => void;
}

/** Read-only product inspector with live stock history — opened by row clicks. */
export function ProductDetailsDrawer({
  productId,
  open,
  onClose,
  categories,
  suppliers,
  onEdit,
  onAdjustStock,
  onDelete,
}: ProductDetailsDrawerProps) {
  const { data, isLoading, isError, error, refetch } = useProductDetail(productId);
  const [showAllMovements, setShowAllMovements] = useState(false);

  const product = data?.product;
  const movements = data?.movements ?? [];

  const category = product ? categories.find((item) => item.id === product.categoryId) : undefined;
  const supplier = product ? suppliers.find((item) => item.id === product.supplierId) : undefined;
  const stockStatus = product ? getStockStatus(product.stock, product.reorderPoint) : 'in_stock';
  const stockMeta = STOCK_STATUS_META[stockStatus];
  const { costValue, retailValue } = product
    ? computeStockValue(product)
    : { costValue: 0, retailValue: 0 };
  const marginPct = product ? computeMarginPct(product.price, product.cost) : 0;
  const visibleMovements = showAllMovements
    ? movements
    : movements.slice(0, DETAIL_MOVEMENTS_LIMIT);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      title={product?.name ?? 'Product details'}
      description={
        product
          ? `${product.sku}${category ? ` · ${category.name}` : ''}`
          : 'Loading the latest catalog data…'
      }
      footer={
        product && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(product)}
              leftIcon={<Trash className="h-3.5 w-3.5" />}
              className="text-destructive hover:bg-destructive/10 sm:mr-auto"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
            >
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => onAdjustStock(product)}
              leftIcon={<Scale className="h-3.5 w-3.5" />}
            >
              Adjust stock
            </Button>
          </>
        )
      }
    >
      {isLoading && !product ? (
        <LoadingSkeleton variant="list" rows={6} />
      ) : isError ? (
        <ErrorState
          compact
          title="Could not load this product"
          message={(error as { message?: string } | null)?.message}
          onRetry={() => void refetch()}
        />
      ) : product ? (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ProductThumb product={product} size="lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={product.status} />
                <Badge variant={stockMeta.badge} size="sm" dot={stockMeta.pulse}>
                  {stockMeta.label}
                </Badge>
                {product.isFeatured && (
                  <Badge variant="warning" size="sm">
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.description || 'No description added yet.'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  Updated {formatDate(product.updatedAt)}
                </span>
                <span>Created {formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Commercials */}
          <ProductStatsGrid
            stats={[
              { label: 'Retail price', value: formatCurrency(product.price) },
              { label: 'Unit cost', value: formatCurrency(product.cost) },
              {
                label: 'Margin',
                value: `${marginPct.toFixed(1)}%`,
                accent: marginPct >= 30 ? 'text-emerald-600 dark:text-emerald-400' : undefined,
              },
              {
                label: `On hand (${product.unit})`,
                value: formatNumber(product.stock),
                accent: stockMeta.text,
              },
              { label: 'Stock at cost', value: formatCurrency(costValue) },
              { label: 'Stock at retail', value: formatCurrency(retailValue) },
            ]}
          />

          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <div className="bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Supplier
              </p>
              <p className="mt-1 text-sm font-semibold">{supplier?.name ?? 'Unassigned'}</p>
              {supplier && (
                <p className="text-[11px] text-muted-foreground">
                  {supplier.leadTimeDays} day lead time
                </p>
              )}
            </div>
            <div className="bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Category
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                {category && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                {category?.name ?? 'Uncategorised'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                reorder at {product.reorderPoint} {product.unit}
              </p>
            </div>
          </div>

          {/* Codes */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Codes
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">SKU</p>
                <CodeChip value={product.sku} variant="sku" copyable />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Barcode</p>
                <CodeChip value={product.barcode} variant="barcode" copyable />
              </div>
            </div>
            {product.barcode && (
              <Barcode
                value={product.barcode}
                height={52}
                className="rounded-lg border border-border bg-white p-2"
              />
            )}
          </section>

          {/* Stock history */}
          <section className="space-y-3">
            <header className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Stock history
              </h3>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                {movements.length} event{movements.length === 1 ? '' : 's'}
              </span>
            </header>
            <StockTimeline movements={visibleMovements} />
            {movements.length > visibleMovements.length && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAllMovements(true)}
              >
                Show all {movements.length} events
              </Button>
            )}
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

export default ProductDetailsDrawer;
