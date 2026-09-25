import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Barcode as BarcodeIcon,
  Loader2,
  Package,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { inventoryService } from '../api';
import { PRODUCT_STATUS_META, UNIT_OPTIONS } from '../constants';
import { productFormSchema, type ProductFormValues } from '../schemas';
import type { CategoryWithCount, Product, ProductStatus, SupplierWithCount } from '../types';
import { computeMarginPct, isValidBarcodeFormat } from '../utils';
import { Barcode } from './Barcode';
import { ImageUpload } from './ImageUpload';

export interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Drives the copy (titles, submit label, helper text). */
  mode: 'create' | 'edit';
  /** Existing product when editing; ignored when creating. */
  product?: Product | null;
  categories: CategoryWithCount[];
  suppliers: SupplierWithCount[];
  /** Pre-selects a category when creating from a filtered list. */
  defaultCategoryId?: string;
  /** Persists the product. Reject with a message to surface it in the form. */
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

const FORM_ID = 'product-form';

function numberFromInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while saving. Please try again.';
}

/** Maps a product (or a blank draft) into the string-based form model. */
function toFormValues(product?: Product | null, defaultCategoryId = ''): ProductFormValues {
  if (!product) {
    return {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: defaultCategoryId,
      supplierId: '',
      price: '',
      cost: '',
      stock: '0',
      reorderPoint: '10',
      unit: 'pc',
      status: 'active',
      imageUrl: '',
      isFeatured: false,
    };
  }

  return {
    name: product.name,
    description: product.description,
    sku: product.sku,
    barcode: product.barcode,
    categoryId: product.categoryId,
    supplierId: product.supplierId ?? '',
    price: product.price.toFixed(2),
    cost: product.cost.toFixed(2),
    stock: String(product.stock),
    reorderPoint: String(product.reorderPoint),
    unit: product.unit,
    status: product.status,
    imageUrl: product.imageUrl ?? '',
    isFeatured: product.isFeatured,
  };
}

/** Titled group of form fields inside the modal body. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="space-y-0.5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Small inline banner for server-side failures (unique SKU / barcode, …). */
function ServerError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

const STATUS_OPTIONS = (Object.keys(PRODUCT_STATUS_META) as ProductStatus[]).map((status) => ({
  value: status,
  label: PRODUCT_STATUS_META[status].label,
}));

const UNIT_SELECT_OPTIONS = UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit }));

/**
 * Add / edit product dialog — the single write path for the catalog.
 *
 * The form model is string based (react-hook-form friendly) and validated with
 * the shared zod schema, so the same rules apply to API payloads later.
 * Callers remount the dialog with a `key` per open, so every open starts clean.
 */
export function ProductFormModal({
  open,
  onClose,
  mode,
  product,
  categories,
  suppliers,
  defaultCategoryId,
  onSubmit,
}: ProductFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<'sku' | 'barcode' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product, defaultCategoryId),
  });

  const imageUrl = watch('imageUrl');
  const barcodeValue = watch('barcode');
  const price = watch('price');
  const cost = watch('cost');
  const isFeatured = watch('isFeatured');

  const marginPct = computeMarginPct(numberFromInput(price), numberFromInput(cost));

  const generateCode = async (field: 'sku' | 'barcode') => {
    setGenerating(field);
    setServerError(null);
    try {
      if (field === 'sku') {
        const categoryName =
          categories.find((category) => category.id === getValues('categoryId'))?.name ?? 'General';
        const sku = await inventoryService.products.suggestSku(categoryName);
        setValue('sku', sku, { shouldValidate: true, shouldDirty: true });
      } else {
        const barcode = await inventoryService.products.suggestBarcode();
        setValue('barcode', barcode, { shouldValidate: true, shouldDirty: true });
      }
    } catch {
      setServerError('Could not generate a code right now. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  const isEdit = mode === 'edit';
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Package className="h-4 w-4" />}
      title={isEdit ? `Edit ${product?.name ?? 'product'}` : 'Add product'}
      description={
        isEdit
          ? 'Update catalog details. Stock quantities are changed from the stock adjuster.'
          : 'Create a catalog item and record its opening stock.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
          >
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="space-y-6"
        aria-busy={isSubmitting}
      >
        {serverError && <ServerError message={serverError} />}

        <FormSection title="Basics">
          <div className="sm:col-span-2">
            <Input
              label="Product name"
              placeholder="e.g. Whole Milk 1L"
              autoFocus
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Description"
              placeholder="Short shelf-facing description"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
          <Select
            label="Category"
            options={[{ value: '', label: 'Select a category' }, ...categoryOptions]}
            error={errors.categoryId?.message}
            {...register('categoryId')}
          />
          <Select
            label="Supplier"
            options={[{ value: '', label: 'Unassigned' }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]}
            error={errors.supplierId?.message}
            {...register('supplierId')}
          />
        </FormSection>

        <FormSection
          title="Codes"
          description="SKUs must be unique across the catalog. Barcodes are optional, but must be unique when set."
        >
          <Input
            label="SKU"
            placeholder="GRO-482"
            className="font-mono uppercase"
            error={errors.sku?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => void generateCode('sku')}
                disabled={generating === 'sku'}
                aria-label="Generate a SKU"
                title="Generate a SKU"
                className="text-muted-foreground transition-colors hover:text-violet-500 disabled:opacity-50"
              >
                {generating === 'sku' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
              </button>
            }
            {...register('sku')}
          />

          <div className="space-y-2">
            <Input
              label="Barcode (EAN-8 / EAN-13)"
              placeholder="5012345678900"
              className="font-mono"
              leftIcon={<BarcodeIcon className="h-3.5 w-3.5" />}
              error={errors.barcode?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => void generateCode('barcode')}
                  disabled={generating === 'barcode'}
                  aria-label="Generate a barcode"
                  title="Generate a barcode"
                  className="text-muted-foreground transition-colors hover:text-violet-500 disabled:opacity-50"
                >
                  {generating === 'barcode' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                </button>
              }
              {...register('barcode')}
            />
            {barcodeValue && isValidBarcodeFormat(barcodeValue) && (
              <Barcode value={barcodeValue} height={40} className="rounded-lg bg-white p-2" />
            )}
          </div>
        </FormSection>

        <FormSection title="Pricing & stock">
          <Input
            label="Retail price"
            inputMode="decimal"
            placeholder="12.99"
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label="Unit cost"
            inputMode="decimal"
            placeholder="8.40"
            error={errors.cost?.message}
            {...register('cost')}
          />

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-2.5 text-xs sm:col-span-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <span className="font-bold text-muted-foreground">Margin preview</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums',
                marginPct >= 30
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : marginPct > 0
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              )}
            >
              {marginPct > 0 ? formatPercent(marginPct) : 'No margin'}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatCurrency(numberFromInput(price))} retail · {formatCurrency(numberFromInput(cost))} cost
            </span>
          </div>

          {!isEdit && (
            <Input
              label="Opening stock"
              inputMode="numeric"
              placeholder="0"
              hint="Recorded as the first stock movement."
              error={errors.stock?.message}
              {...register('stock')}
            />
          )}
          <Input
            label="Reorder point"
            inputMode="numeric"
            placeholder="10"
            hint="Alert when stock reaches this level."
            error={errors.reorderPoint?.message}
            {...register('reorderPoint')}
          />
          <Select
            label="Sale unit"
            options={UNIT_SELECT_OPTIONS}
            error={errors.unit?.message}
            {...register('unit')}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        </FormSection>

        <FormSection
          title="Media & visibility"
          description="Images are stored as data URLs for now; the API phase swaps this for an upload endpoint."
        >
          <div className="sm:col-span-2">
            <ImageUpload
              value={imageUrl}
              onChange={(dataUrl) =>
                setValue('imageUrl', dataUrl, { shouldValidate: true, shouldDirty: true })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Switch
              label="Feature this product"
              description="Highlight in reports, POS suggestions and the catalog."
              checked={isFeatured}
              onChange={(event) =>
                setValue('isFeatured', event.target.checked, { shouldDirty: true })
              }
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
