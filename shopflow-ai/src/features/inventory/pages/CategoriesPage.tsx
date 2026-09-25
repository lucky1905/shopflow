import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, FolderOpen, Layers, Pencil, Plus, Tags, Trash, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { formatCurrency, formatNumber } from '@/utils/format';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../api';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { InventoryHeader } from '../components/InventoryHeader';
import { MiniStats } from '../components/MiniStats';
import { RowActionsMenu } from '../components/RowActionsMenu';
import type { CategoryFormValues } from '../schemas';
import type { CategoryWithCount } from '../types';

function toErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

interface CategoryCardProps {
  category: CategoryWithCount;
  index: number;
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
}

/** Single category tile: color accent, aggregates and row actions. */
function CategoryCard({ category, index, onEdit, onDelete }: CategoryCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-card/85 p-5 backdrop-blur-xl',
        'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_20px_50px_-30px_rgba(76,29,149,0.35)]',
        'transition-shadow hover:shadow-[0_2px_4px_rgba(15,10,40,0.05),0_30px_70px_-30px_rgba(147,51,234,0.45)]',
        'dark:border-white/[0.07]',
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.14] blur-3xl transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: category.color }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: category.color }}
          >
            <Tags className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-tight">{category.name}</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {category.productCount} product{category.productCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <RowActionsMenu
          actions={[
            { label: 'Edit category', icon: Pencil, onSelect: () => onEdit(category) },
            {
              label: 'Delete category',
              icon: Trash,
              onSelect: () => onDelete(category),
              danger: true,
            },
          ]}
        />
      </div>

      <p className="relative mt-3 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
        {category.description || 'No description yet.'}
      </p>

      <dl className="relative mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
        <div className="bg-card px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Units
          </dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums">{formatNumber(category.units)}</dd>
        </div>
        <div className="bg-card px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Retail value
          </dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums">{formatCurrency(category.value)}</dd>
        </div>
      </dl>
    </motion.article>
  );
}

/** Category directory with inline CRUD. */
export function CategoriesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [form, setForm] = useState<{
    open: boolean;
    category: CategoryWithCount | null;
    instance: number;
  }>({ open: false, category: null, instance: 0 });
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const totals = useMemo(
    () =>
      categories.reduce(
        (acc, category) => ({
          products: acc.products + category.productCount,
          units: acc.units + category.units,
          value: acc.value + category.value,
        }),
        { products: 0, units: 0, value: 0 },
      ),
    [categories],
  );

  const openCreate = () =>
    setForm((previous) => ({ open: true, category: null, instance: previous.instance + 1 }));
  const openEdit = (category: CategoryWithCount) =>
    setForm((previous) => ({ open: true, category, instance: previous.instance + 1 }));
  const closeForm = () => setForm((previous) => ({ ...previous, open: false }));

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      if (form.category) {
        await updateCategory.mutateAsync({ id: form.category.id, input: values });
        toast.success(`${values.name} updated`);
      } else {
        await createCategory.mutateAsync(values);
        toast.success(`${values.name} category created`);
      }
    } catch (error) {
      throw new Error(toErrorMessage(error), { cause: error });
    }
    closeForm();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
    } catch (error) {
      toast.fromError(error);
    }
    setDeleteTarget(null);
  };

  return (
    <PageContainer maxWidth="full">
      <InventoryHeader
        icon={<FolderOpen className="h-6 w-6" />}
        title="Categories"
        description="Group products, drive table filters and color the inventory analytics."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.INVENTORY)}
              leftIcon={<Boxes className="h-3.5 w-3.5" />}
            >
              Back to inventory
            </Button>
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              New category
            </Button>
          </>
        }
      />

      <MiniStats
        items={[
          {
            label: 'Categories',
            value: formatNumber(categories.length),
            hint: 'Across the catalog',
            icon: <Layers className="h-4 w-4" />,
          },
          {
            label: 'Products assigned',
            value: formatNumber(totals.products),
            hint: 'Linked to a category',
            icon: <Tags className="h-4 w-4" />,
          },
          {
            label: 'Units on hand',
            value: formatNumber(totals.units),
            hint: 'All categories',
            icon: <Boxes className="h-4 w-4" />,
          },
          {
            label: 'Retail value',
            value: formatCurrency(totals.value),
            hint: 'At current prices',
            icon: <Wallet className="h-4 w-4" />,
          },
        ]}
      />

      {categoriesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : categoriesQuery.isError ? (
        <ErrorState
          title="Could not load categories"
          message={toErrorMessage(categoriesQuery.error)}
          onRetry={() => void categoriesQuery.refetch()}
          className="rounded-2xl border border-black/[0.06] bg-card/85 backdrop-blur-xl dark:border-white/[0.07]"
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title="No categories yet"
          description="Categories keep the catalog navigable and power the inventory filters."
          action={
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Create your first category
            </Button>
          }
          className="rounded-2xl border border-black/[0.06] bg-card/85 backdrop-blur-xl dark:border-white/[0.07]"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <CategoryFormModal
        key={form.instance}
        open={form.open}
        onClose={closeForm}
        mode={form.category ? 'edit' : 'create'}
        category={form.category}
        productCount={form.category?.productCount}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        tone="danger"
        title={`Delete ${deleteTarget?.name ?? 'category'}?`}
        description={
          deleteTarget && deleteTarget.productCount > 0
            ? `${deleteTarget.productCount} product(s) still use this category — move them first or the delete will be rejected.`
            : 'This category will be removed permanently.'
        }
        confirmLabel="Delete category"
        isLoading={deleteCategory.isPending}
      />
    </PageContainer>
  );
}

export default CategoriesPage;
