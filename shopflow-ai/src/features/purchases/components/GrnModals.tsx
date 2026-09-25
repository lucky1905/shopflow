import { useState } from 'react';
import { FileDown, PackageCheck, Printer, X } from 'lucide-react';
import { APP_NAME } from '@/constants';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { GRN_STATUS_META } from '../constants';
import { grnFormSchema } from '../schemas';
import { useCreateGrn, usePendingDeliveries, usePurchaseOrderDetail } from '../api';
import type { Grn, PurchaseOrderLine } from '../types';

type OverrideMap = Record<string, { received?: string; damaged?: string }>;

/* -------------------------------------------------------------------------- */
/*  Create GRN                                                                */
/* -------------------------------------------------------------------------- */

export interface GrnCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selects an order (deliveries / details quick action). */
  poId?: string | null;
}

/**
 * Goods Received Note composer: pick an open PO, enter received / damaged
 * quantities per line, and submit. Fully received orders flip to `received`.
 */
export function GrnCreateModal({ open, onClose, poId }: GrnCreateModalProps) {
  const toast = useToast();
  const openOrders = usePendingDeliveries();

  const [selectedId, setSelectedId] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [note, setNote] = useState('');
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [formError, setFormError] = useState<string | null>(null);

  const activeId = poId ?? (selectedId || null);
  const detail = usePurchaseOrderDetail(open ? activeId : null);
  const createGrn = useCreateGrn();

  // Fresh form every time the dialog opens (adjust-state-during-render).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSelectedId('');
      setReceivedBy('Store receiving');
      setNote('');
      setOverrides({});
      setFormError(null);
    }
  }

  const order = detail.data;
  const remainingFor = (line: PurchaseOrderLine): number =>
    Math.max(0, line.quantity - line.receivedQty);
  const receivedValue = (line: PurchaseOrderLine): string =>
    overrides[line.productId]?.received ?? String(remainingFor(line));
  const damagedValue = (line: PurchaseOrderLine): string =>
    overrides[line.productId]?.damaged ?? '0';

  const setReceived = (line: PurchaseOrderLine, raw: string): void => {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed)
      ? Math.min(remainingFor(line), Math.max(0, Math.floor(parsed)))
      : 0;
    setOverrides((current) => ({
      ...current,
      [line.productId]: { ...current[line.productId], received: String(value) },
    }));
  };

  const setDamaged = (line: PurchaseOrderLine, raw: string): void => {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    setOverrides((current) => ({
      ...current,
      [line.productId]: { ...current[line.productId], damaged: String(value) },
    }));
  };

  const handleSubmit = (): void => {
    if (!order) return;
    const parsed = grnFormSchema.safeParse({
      receivedBy,
      note,
      lines: order.items.map((line) => ({
        productId: line.productId,
        receivedQty: Number(receivedValue(line)),
        damagedQty: Number(damagedValue(line)),
      })),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFormError(issue ? `${issue.path.join('.')} — ${issue.message}` : 'Check the form values.');
      return;
    }
    setFormError(null);
    createGrn.mutate(
      { poId: order.id, receivedBy: parsed.data.receivedBy, note: parsed.data.note, lines: parsed.data.lines },
      {
        onSuccess: (grn) => {
          toast.success(`${grn.grnNumber} recorded against ${grn.poNumber}.`);
          onClose();
        },
        onError: (error) => toast.fromError(error),
      },
    );
  };

  const orderOptions = (openOrders.data ?? []).map((order) => ({
    value: order.id,
    label: `${order.poNumber} · ${order.supplierName}`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Goods received note"
      description="Record received and damaged quantities against an open order."
      icon={<PackageCheck className="h-5 w-5" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createGrn.isPending}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            isLoading={createGrn.isPending}
            disabled={!order}
          >
            Save GRN
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!poId && (
          <Select
            label="Purchase order"
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setOverrides({});
              setFormError(null);
            }}
            options={[{ value: '', label: 'Select an open order…' }, ...orderOptions]}
            placeholder="Select an open order…"
            disabled={openOrders.isLoading}
          />
        )}

        {detail.isLoading && <Skeleton className="h-32 w-full" />}

        {order && (
          <>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-semibold">{order.poNumber}</p>
              <p className="text-muted-foreground">
                {order.supplierName} · expected {order.expectedDate} ·{' '}
                {formatCurrency(order.total)}
              </p>
            </div>

            <div className="space-y-2">
              {order.items.map((line) => {
                const remaining = remainingFor(line);
                return (
                  <div
                    key={line.productId}
                    className="grid grid-cols-1 items-center gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.sku} · ordered {line.quantity} · remaining {remaining}
                      </p>
                    </div>
                    <Input
                      type="number"
                      aria-label={`Received qty for ${line.name}`}
                      value={receivedValue(line)}
                      onChange={(event) => setReceived(line, event.target.value)}
                      className="h-9 text-sm"
                      disabled={remaining === 0}
                    />
                    <Input
                      type="number"
                      aria-label={`Damaged qty for ${line.name}`}
                      value={damagedValue(line)}
                      onChange={(event) => setDamaged(line, event.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Received by"
                value={receivedBy}
                onChange={(event) => setReceivedBy(event.target.value)}
                placeholder="Staff name"
              />
              <Input
                label="Note (optional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={200}
                placeholder="e.g. 2 cartons short-shipped"
              />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  GRN preview (printable)                                                   */
/* -------------------------------------------------------------------------- */

export interface GrnPreviewModalProps {
  open: boolean;
  onClose: () => void;
  grn: Grn | null;
}

/** Printable GRN document used from the GRN table and order details. */
export function GrnPreviewModal({ open, onClose, grn }: GrnPreviewModalProps) {
  const toast = useToast();

  return (
    <Modal
      open={open && grn !== null}
      onClose={onClose}
      size="lg"
      title="GRN preview"
      description={grn?.grnNumber}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} leftIcon={<X className="h-4 w-4" />}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              toast.info('PDF export is mocked in Phase 4 — use the print dialog to save as PDF.');
              window.print();
            }}
            leftIcon={<FileDown className="h-4 w-4" />}
          >
            Download PDF
          </Button>
          <Button variant="default" onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>
            Print
          </Button>
        </>
      }
    >
      {grn && (
        <article className="print-area mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-6 text-foreground sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-black uppercase tracking-widest">{APP_NAME}</p>
              <p className="text-sm text-muted-foreground">Demo Store · Goods receiving</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tracking-tight">GRN</p>
              <p className="text-sm font-semibold text-primary">{grn.grnNumber}</p>
              <p className="text-xs text-muted-foreground">{grn.poNumber}</p>
            </div>
          </header>

          <div className="my-5 border-t border-dashed border-border" />

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Supplier
              </p>
              <p className="font-semibold">{grn.supplierName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Received
              </p>
              <p className="font-semibold">{formatDateTime(grn.receivedAt)}</p>
              <p className="text-muted-foreground">by {grn.receivedBy}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant={GRN_STATUS_META[grn.status].badge} size="sm">
              {GRN_STATUS_META[grn.status].label}
            </Badge>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-2 font-semibold">Item</th>
                  <th className="py-2 px-2 text-right font-semibold">Ordered</th>
                  <th className="py-2 px-2 text-right font-semibold">Received</th>
                  <th className="py-2 pl-2 text-right font-semibold">Damaged</th>
                </tr>
              </thead>
              <tbody>
                {grn.lines.map((line) => (
                  <tr key={line.productId} className="border-b border-border/60">
                    <td className="py-2 pr-2">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">{line.sku}</p>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{line.orderedQty}</td>
                    <td className="py-2 px-2 text-right font-semibold tabular-nums">
                      {line.receivedQty}
                    </td>
                    <td className="py-2 pl-2 text-right tabular-nums text-destructive">
                      {line.damagedQty > 0 ? line.damagedQty : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {grn.note && (
            <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {grn.note}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-8 text-xs text-muted-foreground">
            <div className="border-t border-border pt-2">Received by (signature)</div>
            <div className="border-t border-border pt-2">Authorized by (signature)</div>
          </div>
        </article>
      )}
    </Modal>
  );
}


