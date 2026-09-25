import { useState, type ReactNode } from 'react';
import { PackagePlus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks';
import {
  useAdjustStock,
  useBulkAdjustStock,
  useBulkDeleteProducts,
  useBulkUpdateStatus,
  useCategories,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useSuppliers,
  useUpdateProduct,
} from '../api';
import { useProductFilters, useRowSelection } from '../hooks';
import type { ProductFormValues } from '../schemas';
import type { Product, ProductInput, ProductStatus, ProductUpdateInput, StockStatus } from '../types';
import { AdjustStockModal, type StockAdjustmentSubmission } from './AdjustStockModal';
import { BulkActionsBar } from './BulkActionsBar';
import { InventoryAnalyticsSection } from './InventoryAnalyticsSection';
import { ProductDetailsDrawer } from './ProductDetailsDrawer';
import { ProductFormModal } from './ProductFormModal';
import { ProductsTable } from './ProductsTable';

/** Scroll target so analytics shortcuts can reveal the table. */
const TABLE_ANCHOR_ID = 'inventory-product-table';

export interface ProductWorkspaceProps {
  /** Inventory emphasizes stock columns; catalog emphasizes pricing. */
  variant: 'inventory' | 'catalog';
  /** Rendered between the page header and the table (analytics, alerts, …). */
  children?: ReactNode;
  /** Empty-state action supplied by the page (e.g. "Import products"). */
  emptyAction?: ReactNode;
  className?: string;
}

interface ProductFormState {
  open: boolean;
  mode: 'create' | 'edit';
  product: Product | null;
  /** Bumped on every open so the dialog remounts with fresh form state. */
  instance: number;
}

/** Targets + mount token for the (bulk) stock adjuster. */
interface StockFormState {
  targets: Product[];
  instance: number;
}

function toErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const maybe = error as { message?: string } | null;
  return maybe?.message ?? 'Something went wrong. Please try again.';
}

function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    sku: values.sku.trim().toUpperCase(),
    barcode: values.barcode.trim(),
    categoryId: values.categoryId,
    supplierId: values.supplierId,
    price: Number(values.price),
    cost: Number(values.cost),
    stock: Number(values.stock || 0),
    reorderPoint: Number(values.reorderPoint),
    unit: values.unit,
    status: values.status,
    imageUrl: values.imageUrl,
    isFeatured: values.isFeatured,
  };
}

/** Stock is intentionally excluded — quantity changes go through adjustments. */
function toProductUpdateInput(values: ProductFormValues): ProductUpdateInput {
  const input = toProductInput(values);
  return {
    name: input.name,
    description: input.description,
    sku: input.sku,
    barcode: input.barcode,
    categoryId: input.categoryId,
    supplierId: input.supplierId,
    price: input.price,
    cost: input.cost,
    reorderPoint: input.reorderPoint,
    unit: input.unit,
    status: input.status,
    imageUrl: input.imageUrl,
    isFeatured: input.isFeatured,
  };
}

/**
 * The interactive core of the Inventory module: filtering, pagination, bulk
 * selection, CRUD dialogs, the details drawer and stock adjustments.
 *
 * Both the Inventory screen and the Products (catalog) screen render this with
 * a different `variant`, so behaviour stays identical while emphasis changes.
 */
export function ProductWorkspace({
  variant,
  children,
  emptyAction,
  className,
}: ProductWorkspaceProps) {
  const toast = useToast();
  const filters = useProductFilters();
  const selection = useRowSelection();

  const productsQuery = useProducts(filters.filters);
  const categoriesQuery = useCategories();
  const suppliersQuery = useSuppliers();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const adjustStock = useAdjustStock();
  const bulkAdjustStock = useBulkAdjustStock();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkDelete = useBulkDeleteProducts();

  const [productForm, setProductForm] = useState<ProductFormState>({
    open: false,
    mode: 'create',
    product: null,
    instance: 0,
  });
  const [stockForm, setStockForm] = useState<StockFormState>({ targets: [], instance: 0 });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const items = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;
  const categories = categoriesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const openCreate = () =>
    setProductForm((previous) => ({
      open: true,
      mode: 'create',
      product: null,
      instance: previous.instance + 1,
    }));
  const openEdit = (product: Product) =>
    setProductForm((previous) => ({
      open: true,
      mode: 'edit',
      product,
      instance: previous.instance + 1,
    }));
  const closeProductForm = () =>
    setProductForm((previous) => ({ ...previous, open: false }));

  const openStockAdjust = (targets: Product[]) =>
    setStockForm((previous) => ({ targets, instance: previous.instance + 1 }));
  const closeStockAdjust = () => setStockForm((previous) => ({ ...previous, targets: [] }));

  /** Selected rows that are visible on the current page (used for previews). */
  const selectedProducts = items.filter((product) => selection.selectedIds.has(product.id));

  const isBusy =
    bulkAdjustStock.isPending ||
    bulkUpdateStatus.isPending ||
    bulkDelete.isPending ||
    deleteProduct.isPending;

  const handleSubmitProduct = async (values: ProductFormValues) => {
    try {
      if (productForm.mode === 'edit' && productForm.product) {
        await updateProduct.mutateAsync({
          id: productForm.product.id,
          input: toProductUpdateInput(values),
        });
        toast.success(`${values.name.trim()} updated`);
      } else {
        await createProduct.mutateAsync(toProductInput(values));
        toast.success(`${values.name.trim()} added to the catalog`);
      }
    } catch (error) {
      // Re-thrown so the modal can surface the message inline.
      throw new Error(toErrorMessage(error), { cause: error });
    }
    closeProductForm();
  };

  const handleAdjustStock = async (values: StockAdjustmentSubmission) => {
    const { targets } = stockForm;
    try {
      if (targets.length > 1) {
        const updated = await bulkAdjustStock.mutateAsync({
          productIds: targets.map((product) => product.id),
          mode: values.mode === 'set' ? 'in' : values.mode,
          quantity: values.quantity,
          reason: values.reason,
          note: values.note,
        });
        toast.success(`Stock adjusted on ${updated} product${updated === 1 ? '' : 's'}`);
      } else if (targets.length === 1) {
        const target = targets[0];
        await adjustStock.mutateAsync({
          productId: target.id,
          mode: values.mode,
          quantity: values.quantity,
          reason: values.reason,
          note: values.note,
        });
        toast.success(`${target.name} stock updated`);
      }
    } catch (error) {
      throw new Error(toErrorMessage(error), { cause: error });
    }
    closeStockAdjust();
    selection.clear();
  };

  const handleSetStatus = async (status: ProductStatus) => {
    try {
      const updated = await bulkUpdateStatus.mutateAsync({
        productIds: [...selection.selectedIds],
        status,
      });
      toast.success(
        updated > 0
          ? `${updated} product${updated === 1 ? '' : 's'} marked as ${status}`
          : 'No status changes were needed',
      );
      selection.clear();
    } catch (error) {
      toast.fromError(error);
    }
  };

  /** Applies a stock-status filter from the analytics cards / alerts. */
  const handleApplyStockFilter = (status: StockStatus) => {
    filters.patch({ stockStatus: status });
    document
      .getElementById(TABLE_ANCHOR_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleConfirmDelete = async () => {
    try {
      if (bulkDeleteOpen) {
        const removed = await bulkDelete.mutateAsync([...selection.selectedIds]);
        toast.success(`${removed} product${removed === 1 ? '' : 's'} deleted`);
        selection.clear();
      } else if (deleteTarget) {
        await deleteProduct.mutateAsync(deleteTarget.id);
        toast.success(`${deleteTarget.name} deleted`);
      }
    } catch (error) {
      toast.fromError(error);
    }
    setDeleteTarget(null);
    setBulkDeleteOpen(false);
    setDetailId(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {variant === 'inventory' && (
        <InventoryAnalyticsSection
          onStockFilterChange={handleApplyStockFilter}
          onAdjustStock={(product) => openStockAdjust([product])}
          onViewAllLowStock={() => handleApplyStockFilter('low_stock')}
        />
      )}

      {children}

      <div id={TABLE_ANCHOR_ID}>
        {productsQuery.isError && items.length === 0 ? (
        <ErrorState
          title="Could not load products"
          message={toErrorMessage(productsQuery.error)}
          onRetry={() => void productsQuery.refetch()}
          className="rounded-2xl border border-black/[0.06] bg-card/85 backdrop-blur-xl dark:border-white/[0.07]"
        />
      ) : (
        <ProductsTable
          products={items}
          categories={categories}
          suppliers={suppliers}
          search={filters.ui.search}
          onSearchChange={(value) => filters.patch({ search: value })}
          status={filters.ui.status}
          stockStatus={filters.ui.stockStatus}
          categoryId={filters.ui.categoryId}
          supplierId={filters.ui.supplierId}
          sortValue={filters.ui.sortValue}
          onFiltersChange={filters.patch}
          onClearFilters={filters.clear}
          filtersActive={filters.isFiltered}
          page={filters.ui.page}
          pageSize={filters.ui.pageSize}
          total={total}
          onPageChange={filters.setPage}
          onPageSizeChange={filters.setPageSize}
          selectedIds={selection.selectedIds}
          onToggleRow={selection.toggle}
          onToggleAll={() => selection.toggleAll(items.map((product) => product.id))}
          onView={(product) => setDetailId(product.id)}
          onEdit={openEdit}
          onAdjustStock={(product) => openStockAdjust([product])}
          onDelete={setDeleteTarget}
          variant={variant}
          isLoading={productsQuery.isLoading || categoriesQuery.isLoading}
          isFetching={productsQuery.isFetching}
          emptyAction={emptyAction}
          toolbarActions={
            <>
              <Button
                variant="ghost"
                size="sm"
                isLoading={productsQuery.isFetching}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => void productsQuery.refetch()}
              >
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={openCreate}
                leftIcon={<PackagePlus className="h-3.5 w-3.5" />}
              >
                Add product
              </Button>
            </>
          }
        />
      )}

      </div>

      <BulkActionsBar
        selectedCount={selection.selectedCount}
        disabled={isBusy}
        onSetStatus={(status) => void handleSetStatus(status)}
        onAdjustStock={() => openStockAdjust(selectedProducts)}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={selection.clear}
      />

      <ProductFormModal
        key={productForm.instance}
        open={productForm.open}
        onClose={closeProductForm}
        mode={productForm.mode}
        product={productForm.product}
        categories={categories}
        suppliers={suppliers}
        onSubmit={handleSubmitProduct}
      />

      <AdjustStockModal
        key={stockForm.instance}
        open={stockForm.targets.length > 0}
        onClose={closeStockAdjust}
        products={stockForm.targets}
        onSubmit={handleAdjustStock}
      />

      <ProductDetailsDrawer
        open={detailId !== null}
        productId={detailId}
        onClose={() => setDetailId(null)}
        categories={categories}
        suppliers={suppliers}
        onEdit={(product) => {
          setDetailId(null);
          openEdit(product);
        }}
        onAdjustStock={(product) => {
          setDetailId(null);
          openStockAdjust([product]);
        }}
        onDelete={(product) => setDeleteTarget(product)}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        tone="danger"
        title={`Delete ${deleteTarget?.name ?? 'this product'}?`}
        description="The product and its stock history will be removed permanently. This action cannot be undone."
        confirmLabel="Delete product"
        isLoading={deleteProduct.isPending}
      />

      <ConfirmationDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        tone="danger"
        title={`Delete ${selection.selectedCount} product${selection.selectedCount === 1 ? '' : 's'}?`}
        description="Selected products and their stock history will be removed permanently. This action cannot be undone."
        confirmLabel="Delete products"
        isLoading={bulkDelete.isPending}
      />
    </div>
  );
}

export default ProductWorkspace;
