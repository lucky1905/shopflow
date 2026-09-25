import { useState } from 'react';
import { Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks';
import { QUICK_DISCOUNT_PRESETS } from '../constants';
import { useCartStore } from '../hooks';
import type { DiscountType } from '../types';

export interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
}

/** Order-level discount (percent or fixed amount) applied before tax. */
export function DiscountModal({ open, onClose }: DiscountModalProps) {
  const toast = useToast();
  const orderDiscount = useCartStore((state) => state.orderDiscount);
  const setOrderDiscount = useCartStore((state) => state.setOrderDiscount);

  const [type, setType] = useState<DiscountType>(orderDiscount.type);
  const [value, setValue] = useState(String(orderDiscount.value || ''));

  // Prefill from the current discount whenever the dialog opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setType(orderDiscount.type);
      setValue(orderDiscount.value > 0 ? String(orderDiscount.value) : '');
    }
  }

  const apply = (): void => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Enter a valid discount value.');
      return;
    }
    if (type === 'percent' && parsed > 100) {
      toast.error('Percentage cannot exceed 100.');
      return;
    }
    setOrderDiscount({ type, value: parsed });
    onClose();
  };

  const clear = (): void => {
    setOrderDiscount({ type: 'percent', value: 0 });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Order discount"
      description="Applied to the whole basket before tax."
      icon={<Tag className="h-4 w-4" />}
      footer={
        <>
          <Button variant="ghost" onClick={clear}>
            Remove discount
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={apply}>
            Apply
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['percent', 'amount'] as const).map((value_) => (
            <button
              key={value_}
              type="button"
              onClick={() => setType(value_)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                type === value_
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )}
            >
              {value_ === 'percent' ? 'Percentage (%)' : 'Fixed amount ($)'}
            </button>
          ))}
        </div>

        <Input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          label={type === 'percent' ? 'Discount %' : 'Discount amount'}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={type === 'percent' ? '10' : '5.00'}
        />

        {type === 'percent' && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DISCOUNT_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={String(preset) === value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setValue(String(preset))}
              >
                {preset}%
              </Button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DiscountModal;