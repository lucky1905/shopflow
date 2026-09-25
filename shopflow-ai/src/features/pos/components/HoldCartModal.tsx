import { useState } from 'react';
import { Pause } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks';
import { formatCurrency } from '@/utils/format';
import { holdCartFormSchema } from '../schemas';
import { useSaveHeldCart } from '../api';
import { useCartStore } from '../hooks';
import { computeCartTotals } from '../utils';

export interface HoldCartModalProps {
  open: boolean;
  onClose: () => void;
}

/** Names and parks the current basket so another customer can be served. */
export function HoldCartModal({ open, onClose }: HoldCartModalProps) {
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const items = useCartStore((state) => state.items);
  const customerId = useCartStore((state) => state.customerId);
  const customerName = useCartStore((state) => state.customerName);
  const orderDiscount = useCartStore((state) => state.orderDiscount);
  const taxRatePct = useCartStore((state) => state.taxRatePct);
  const note = useCartStore((state) => state.note);
  const clearCart = useCartStore((state) => state.clearCart);
  const saveHold = useSaveHeldCart();

  const totals = computeCartTotals(items, orderDiscount, taxRatePct);

  // Suggest a label each time the dialog opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setError(undefined);
      setLabel(
        `Hold ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      );
    }
  }

  const handleSave = (): void => {
    const parsed = holdCartFormSchema.safeParse({ label });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.label?.[0] ?? 'Label is required.');
      return;
    }

    saveHold.mutate(
      {
        label: parsed.data.label,
        items,
        customerId,
        customerName,
        orderDiscount,
        taxRatePct,
        note,
      },
      {
        onSuccess: (hold) => {
          clearCart();
          toast.success(`Cart parked as “${hold.label}”.`);
          onClose();
        },
        onError: (saveError) => toast.fromError(saveError),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Hold this cart"
      description="Park the basket and come back to it any time from Held carts."
      icon={<Pause className="h-4 w-4" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saveHold.isPending}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave} isLoading={saveHold.isPending}>
            Hold & clear
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={error}
          placeholder="e.g. Lane 2 – ATM run"
          maxLength={40}
          autoFocus
        />
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {totals.lines} {totals.lines === 1 ? 'item' : 'items'} · {totals.units} units ·{' '}
          {formatCurrency(totals.total)}
        </p>
      </div>
    </Modal>
  );
}

export default HoldCartModal;