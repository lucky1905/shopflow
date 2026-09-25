import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CATEGORY_COLOR_PALETTE } from '../constants';
import { categoryFormSchema, type CategoryFormValues } from '../schemas';
import type { Category } from '../types';

export interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  category?: Category | null;
  /** Number of products already in the category (shown as context when editing). */
  productCount?: number;
  /** Persists the category. Reject with a message to surface it in the form. */
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

const FORM_ID = 'category-form';

function toFormValues(category?: Category | null): CategoryFormValues {
  if (!category) {
    return { name: '', description: '', color: CATEGORY_COLOR_PALETTE[0] };
  }
  return { name: category.name, description: category.description, color: category.color };
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while saving. Please try again.';
}

/** Create / rename a category and pick its accent color. */
export function CategoryFormModal({
  open,
  onClose,
  mode,
  category,
  productCount,
  onSubmit,
}: CategoryFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: toFormValues(category),
  });

  const color = watch('color');
  const name = watch('name');

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  const isEdit = mode === 'edit';
  const activeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : CATEGORY_COLOR_PALETTE[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<FolderOpen className="h-4 w-4" />}
      title={isEdit ? `Edit ${category?.name ?? 'category'}` : 'New category'}
      description={
        isEdit && productCount !== undefined
          ? `${productCount} product${productCount === 1 ? '' : 's'} currently in this category.`
          : 'Categories group products, drive filters and color the analytics cards.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
          >
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <Input
          label="Name"
          placeholder="e.g. Beverages"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Description"
          placeholder="What belongs in this category?"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="space-y-2">
          <span className="block text-sm font-medium text-foreground">Accent color</span>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_COLOR_PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setValue('color', swatch, { shouldValidate: true, shouldDirty: true })}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                  color === swatch ? 'border-foreground' : 'border-transparent',
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
            <input
              type="color"
              aria-label="Custom accent color"
              value={activeColor}
              onChange={(event) =>
                setValue('color', event.target.value, { shouldValidate: true, shouldDirty: true })
              }
              className="h-7 w-9 cursor-pointer rounded-lg border border-border bg-background p-0.5"
            />
          </div>
          {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-2.5 text-xs dark:border-white/[0.06] dark:bg-white/[0.03]">
          <span className="font-bold text-muted-foreground">Preview</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] px-2.5 py-1 font-semibold dark:border-white/[0.08]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            {name || 'Category name'}
          </span>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
