import { useState } from 'react';
import { History, Play, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { useDeleteHeldCart, useHeldCarts } from '../api';
import { useCartStore } from '../hooks';
import type { HeldCart } from '../types';

export interface HeldCartsDrawerProps {
  open: boolean;
  onClose: () => void;
}

type DialogState = { kind: 'resume' | 'delete'; hold: HeldCart } | null;

/** Lists parked baskets; resume replaces the current cart, delete discards. */
export function HeldCartsDrawer({ open, onClose }: HeldCartsDrawerProps) {
  const toast = useToast();
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: holds = [], isLoading, isError, error, refetch } = useHeldCarts();
  const deleteHold = useDeleteHeldCart();
  const loadHeldCart = useCartStore((state) => state.loadHeldCart);
  const currentItems = useCartStore((state) => state.items);

  const requestResume = (hold: HeldCart): void => {
    if (currentItems.length > 0) {
      setDialog({ kind: 'resume', hold });
      return;
    }
    resume(hold);
  };

  const resume = (hold: HeldCart): void => {
    loadHeldCart(hold);
    deleteHold.mutate(hold.id);
    toast.success(`Resumed “${hold.label}”.`);
    setDialog(null);
    onClose();
  };

  const requestDelete = (hold: HeldCart): void => setDialog({ kind: 'delete', hold });

  const confirmDialog = (): void => {
    if (!dialog) return;
    if (dialog.kind === 'resume') {
      resume(dialog.hold);
      return;
    }
    deleteHold.mutate(dialog.hold.id, {
      onSuccess: () => toast.success('Held cart discarded.'),
      onError: (deleteError) => toast.fromError(deleteError),
    });
    setDialog(null);
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        side="right"
        size="md"
        title="Held carts"
        description="Parked baskets waiting to be completed."
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border p-4">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            compact
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : holds.length === 0 ? (
          <EmptyState
            compact
            icon={<History className="h-5 w-5" />}
            title="No held carts"
            description="Press F4 or “Hold cart” while ringing up to park a basket here."
          />
        ) : (
          <div className="space-y-3">
            {holds.map((hold) => (
              <div
                key={hold.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold text-foreground">{hold.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {hold.customerName} · {hold.items.length} lines · {hold.units} units
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning" size="sm">
                      {formatCurrency(hold.total)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(hold.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                    onClick={() => requestResume(hold)}
                  >
                    Resume
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={`Discard ${hold.label}`}
                    onClick={() => requestDelete(hold)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <ConfirmationDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={confirmDialog}
        tone={dialog?.kind === 'delete' ? 'danger' : 'warning'}
        title={
          dialog?.kind === 'delete'
            ? 'Discard this held cart?'
            : 'Replace the current cart?'
        }
        description={
          dialog?.kind === 'delete'
            ? `“${dialog.hold.label}” will be removed permanently.`
            : `Resuming “${dialog?.hold.label}” will replace the ${currentItems.length} items currently in the cart.`
        }
        confirmLabel={dialog?.kind === 'delete' ? 'Discard' : 'Resume'}
        isLoading={deleteHold.isPending}
      />
    </>
  );
}

export default HeldCartsDrawer;