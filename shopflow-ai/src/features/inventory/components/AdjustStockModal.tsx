import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { MOVEMENT_REASONS } from '../constants';
import { adjustStockSchema, type AdjustStockFormValues } from '../schemas';
import type { Product, StockAdjustmentMode } from '../types';
import { describeAdjustment } from '../utils';
import { ProductThumb } from './ProductThumb';

export interface StockAdjustmentSubmission {
  mode: StockAdjustmentMode;
  quantity: number;
  reason: string;
  note: string;
}

export interface AdjustStockModalProps {
  open: boolean;
  onClose: () => void;
  /** One product = single adjustment; several = bulk adjustment. */
  products: Product[];
  /** Persists the change. Reject with a message to surface it in the form. */
  onSubmit: (values: StockAdjustmentSubmission) => Promise<void>;
}

const FORM_ID = 'adjust-stock-form';

const MODE_META: Record<
  StockAdjustmentMode,
  { label: string; description: string; icon: typeof Scale }
> = {
  in: {
    label: 'Stock in',
    description: 'Receive units from a purchase or return.',
    icon: ArrowDownToLine,
  },
  out: {
    label: 'Stock out',
    description: 'Remove units sold, damaged or transferred.',
    icon: ArrowUpFromLine,
  },
  set: {
    label: 'Set count',
    description: 'Overwrite on-hand quantity with an exact count.',
    icon: SlidersHorizontal,
  },
};

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while adjusting stock. Please try again.';
}

/**
 * Stock adjustment dialog used for both single products (from the table or the
 * details drawer) and bulk selections. Every change becomes a stock movement.
 */
export function AdjustStockModal({ open, onClose, products, onSubmit }: AdjustStockModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isBulk = products.length > 1;
  const isSingle = products.length === 1;
  const target = isSingle ? products[0] : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { mode: 'in', quantity: '', reason: MOVEMENT_REASONS.in[0], note: '' },
  });

  const mode = watch('mode');
  const quantity = watch('quantity');
  const availableModes: StockAdjustmentMode[] = isBulk ? ['in', 'out'] : ['in', 'out', 'set'];
  const reasons = MOVEMENT_REASONS[mode] ?? [];

  /** Switching direction swaps the reason list and picks its first entry. */
  const selectMode = (option: StockAdjustmentMode) => {
    setValue('mode', option, { shouldValidate: true });
    setValue('reason', MOVEMENT_REASONS[option][0], { shouldValidate: false });
  };

  const hasQuantity = /^\d+$/.test(quantity) && quantity.length > 0;

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit({
        mode: values.mode,
        quantity: Number(values.quantity),
        reason: values.reason,
        note: values.note,
      });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<Scale className="h-4 w-4" />}
      title={isBulk ? `Adjust stock · ${products.length} products` : 'Adjust stock'}
      description={
        isSingle && target
          ? `${target.name} · ${target.stock} ${target.unit} on hand`
          : 'Apply the same movement to every selected product.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSubmitting} disabled={!hasQuantity}>
            Apply adjustment
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={(event) => void submit(event)} className="space-y-5">
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
          >
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          {availableModes.map((option) => {
            const meta = MODE_META[option];
            const Icon = meta.icon;
            const active = mode === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => selectMode(option)}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-violet-400/60 bg-violet-500/5'
                    : 'border-border hover:border-violet-300/50 hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    active
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-bold">{meta.label}</span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {meta.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input
            label={mode === 'set' ? 'New on-hand count' : 'Quantity'}
            inputMode="numeric"
            placeholder="0"
            autoFocus
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          <Select
            label="Reason"
            options={reasons.map((reason) => ({ value: reason, label: reason }))}
            error={errors.reason?.message}
            {...register('reason')}
          />
        </div>

        <Input
          label="Note (optional)"
          placeholder="Add context for the audit trail"
          error={errors.note?.message}
          {...register('note')}
        />

        {isSingle && target && (
          <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <ProductThumb product={target} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{target.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {hasQuantity
                  ? describeAdjustment(mode, Number(quantity), target.stock)
                  : `${target.stock} ${target.unit} on hand`}
              </p>
            </div>
          </div>
        )}

        {isBulk && (
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[13px] font-bold">{products.length} products selected</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {products
                .slice(0, 3)
                .map((product) => product.name)
                .join(', ')}
              {products.length > 3 ? ` +${products.length - 3} more` : ''}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default AdjustStockModal;
