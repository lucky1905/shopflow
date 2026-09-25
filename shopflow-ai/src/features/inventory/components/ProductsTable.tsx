import { useMemo } from 'react';
import { Download, Eye, PackageOpen, Pencil, Scale, Search, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DataTable } from '@/components/ui/DataTable';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PRODUCT_SORT_OPTIONS, STOCK_STATUS_OPTIONS, PRODUCT_STATUS_OPTIONS } from '../constants';
import type { ProductSortValue } from '../constants';
import type { CategoryWithCount, Product, StockStatus, SupplierWithCount } from '../types';
import { downloadCsv, productsToCsv } from '../utils';
import { CodeChip } from './CodeChip';
import { ProductThumb } from './ProductThumb';
import { RowActionsMenu } from './RowActionsMenu';
import { StatusBadge } from './StatusBadge';
import { StockCell } from './StockCell';

export interface ProductsTableFilterState {
  search: string;
  status: Product['status'] | 'all';
  stockStatus: StockStatus | 'all';
  categoryId: string;
  supplierId: string;
  sortValue: ProductSortValue;
}

export interface ProductsTableProps {
  products: Product[];
  categories: CategoryWithCount[];
  suppliers: SupplierWithCount[];
  search: string;
  onSearchChange: (value: string) => void;
  status: Product['status'] | 'all';
  stockStatus: StockStatus | 'all';
  categoryId: string;
  supplierId: string;
  sortValue: ProductSortValue;
  onFiltersChange: (patch: Partial<ProductsTableFilterState>) => void;
  onClearFilters: () => void;
  /** Are non-search filters active? Drives the "no match" empty state. */
  filtersActive: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds: ReadonlySet<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onDelete: (product: Product) => void;
  /** Emphasizes stock columns (inventory page) vs pricing (products page). */
  variant: 'inventory' | 'catalog';
  /** Primary actions rendered in the table toolbar (e.g. "Add product"). */
  toolbarActions?: React.ReactNode;
  emptyAction?: React.ReactNode;
  /** Renders skeleton rows while the first page loads. */
  isLoading?: boolean;
  isFetching?: boolean;
  className?: string;
}

/** Glass table card containing search, filters, bulk-aware rows & pagination. */
export function ProductsTable({
  products,
  categories,
  suppliers,
  search,
  onSearchChange,
  status,
  stockStatus,
  categoryId,
  supplierId,
  sortValue,
  onFiltersChange,
  onClearFilters,
  filtersActive,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onView,
  onEdit,
  onAdjustStock,
  onDelete,
  variant,
  toolbarActions,
  emptyAction,
  isLoading = false,
  className,
}: ProductsTableProps) {
  const categoryName = (product: Product) =>
    categories.find((category) => category.id === product.categoryId)?.name ?? '—';
  const supplierName = (product: Product) =>
    suppliers.find((supplier) => supplier.id === product.supplierId)?.name ?? 'Unassigned';

  const pageIds = useMemo(() => products.map((product) => product.id), [products]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const handleExportCsv = () => {
    const csv = productsToCsv(products, {
      categoryNameOf: categoryName,
      supplierNameOf: supplierName,
    });
    downloadCsv(`shopflow-products-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          aria-label="Select all rows on this page"
          checked={allSelected}
          onChange={() => onToggleAll()}
        />
      ),
      headerClassName: 'w-10',
      className: 'w-10',
      render: (product) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Checkbox
            aria-label={`Select ${product.name}`}
            checked={selectedIds.has(product.id)}
            onChange={() => onToggleRow(product.id)}
          />
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Product',
      render: (product) => (
        <div className="flex min-w-[13rem] items-center gap-3">
          <ProductThumb product={product} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold">
              <span className="truncate">{product.name}</span>
              {product.isFeatured && (
                <span className="rounded bg-amber-400/15 px-1 py-px text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Featured
                </span>
              )}
            </p>
            <p className="mt-0.5 flex items-center gap-2">
              <CodeChip value={product.sku} variant="sku" />
              {product.barcode && (
                <CodeChip value={product.barcode} variant="barcode" className="hidden xl:inline-flex" />
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideOnMobile: true,
      render: (product) => {
        const category = categories.find((item) => item.id === product.categoryId);
        if (!category) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px]">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </span>
        );
      },
    },
    {
      key: 'supplier',
      header: 'Supplier',
      hideOnMobile: true,
      render: (product) => (
        <span className="text-[13px] text-muted-foreground">{supplierName(product)}</span>
      ),
    },
    {
      key: 'price',
      header: variant === 'inventory' ? 'Price' : 'Price / Margin',
      align: 'right',
      hideOnMobile: true,
      render: (product) => (
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-bold tabular-nums">{formatCurrency(product.price)}</span>
          {variant === 'catalog' && product.price > 0 && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {Math.round(((product.price - product.cost) / product.price) * 100)}% margin
            </span>
          )}
          {variant === 'inventory' && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatCurrency(product.stock * product.price)} value
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product) => (
        <StockCell stock={product.stock} reorderPoint={product.reorderPoint} unit={product.unit} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      hideOnMobile: true,
      render: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      hideOnMobile: true,
      render: (product) => (
        <span className="text-xs text-muted-foreground">{formatDate(product.updatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`View ${product.name}`}
            onClick={() => onView(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 sm:inline-flex"
            aria-label={`Edit ${product.name}`}
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {variant === 'inventory' && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 md:inline-flex"
              aria-label={`Adjust stock for ${product.name}`}
              onClick={() => onAdjustStock(product)}
            >
              <Scale className="h-4 w-4" />
            </Button>
          )}
          <RowActionsMenu
            actions={[
              { label: 'View details', icon: Eye, onSelect: () => onView(product) },
              { label: 'Edit product', icon: Pencil, onSelect: () => onEdit(product) },
              ...(variant === 'inventory'
                ? [{ label: 'Adjust stock', icon: Scale, onSelect: () => onAdjustStock(product) }]
                : []),
              { label: 'Delete product', icon: Trash, onSelect: () => onDelete(product), danger: true },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-black/[0.06] bg-card/85 text-card-foreground backdrop-blur-xl',
        'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_24px_60px_-24px_rgba(76,29,149,0.25)]',
        'dark:border-white/[0.07]',
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-black/[0.05] p-4 dark:border-white/[0.06]">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, SKU or barcode…"
              leftIcon={<Search className="h-4 w-4" />}
              aria-label="Search products"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <Select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(event) => onFiltersChange({ categoryId: event.target.value })}
              options={[
                { value: '', label: 'All categories' },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
              className="h-9 text-xs"
            />
            <Select
              aria-label="Filter by supplier"
              value={supplierId}
              onChange={(event) => onFiltersChange({ supplierId: event.target.value })}
              options={[
                { value: '', label: 'All suppliers' },
                ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
              ]}
              className="h-9 text-xs"
            />
            <Select
              aria-label="Filter by stock level"
              value={stockStatus}
              onChange={(event) =>
                onFiltersChange({ stockStatus: event.target.value as StockStatus | 'all' })
              }
              options={[...STOCK_STATUS_OPTIONS]}
              className="h-9 text-xs"
            />
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(event) =>
                onFiltersChange({ status: event.target.value as Product['status'] | 'all' })
              }
              options={[...PRODUCT_STATUS_OPTIONS]}
              className="h-9 text-xs"
            />
            <Select
              aria-label="Sort products"
              value={sortValue}
              onChange={(event) => onFiltersChange({ sortValue: event.target.value as ProductSortValue })}
              options={[...PRODUCT_SORT_OPTIONS]}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `${total} product${total === 1 ? '' : 's'}` : 'No products'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {toolbarActions}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={handleExportCsv}
              disabled={products.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        loadingRows={pageSize > 10 ? 8 : pageSize}
        rowKey={(product) => product.id}
        onRowClick={onView}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange,
          onPageSizeChange,
        }}
        emptyIcon={<PackageOpen className="h-6 w-6" />}
        emptyTitle={filtersActive ? 'No products match your filters' : 'No products yet'}
        emptyDescription={
          filtersActive
            ? 'Try adjusting the search or clearing a filter to see more results.'
            : 'Add your first product to start tracking stock, pricing and history.'
        }
        emptyAction={
          filtersActive ? (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            emptyAction
          )
        }
        className="rounded-none border-0 bg-transparent shadow-none"
      />
    </div>
  );
}

export default ProductsTable;
