import { useMemo, useState } from 'react';
import { CheckCircle2, Search, Undo2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { useDebouncedValue, useToast } from '@/hooks';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { REFUND_METHOD_OPTIONS, RETURN_REASONS, RETURN_REASON_META } from '../constants';
import { useProcessReturn, useReturnableLines, useSalesHistory } from '../api';
import { roundMoney } from '../utils';
import type { RefundMethod, ReturnReason, Sale } from '../types';

export interface ReturnModalProps {
  open: boolean;
  onClose: () => void;
  /** Preselected receipt; when null the cashier searches first. */
  initialSale: Sale | null;
}

/**
 * Two-step return flow: find the receipt, pick quantities + reason, then
 * refund (optionally restocking the returned units).
 */
export function ReturnModal({ open, onClose, initialSale }: ReturnModalProps) {
  const toast = useToast();
  const [sale, setSale] = useState<Sale | null>(initialSale);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>('defective');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('original');
  const [restock, setRestock] = useState(true);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ returnNumber: string; refundTotal: number } | null>(null);

  const search = useSalesHistory({ search: debouncedQuery, page: 1, pageSize: 5 });
  const { data: lines = [], isLoading: linesLoading } = useReturnableLines(sale?.id ?? null);
  const processReturn = useProcessReturn();

  // Reset the return draft whenever the dialog opens (possibly with a receipt).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSale(initialSale);
      setQuery('');
      setQuantities({});
      setReason('defective');
      setRefundMethod('original');
      setRestock(true);
      setNote('');
      setResult(null);
    }
  }

  const refundTotal = useMemo(
    () =>
      roundMoney(
        lines.reduce(
          (sum, line) => sum + line.unitPrice * (quantities[line.productId] ?? 0),
          0,
        ),
      ),
    [lines, quantities],
  );

  const selectedCount = useMemo(
    () => Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0),
    [quantities],
  );

  const setQuantity = (productId: string, raw: string, max: number): void => {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.min(max, Math.floor(parsed))) : 0;
    setQuantities((current) => ({ ...current, [productId]: value }));
  };

  const handleConfirm = (): void => {
    if (!sale || selectedCount === 0) return;
    processReturn.mutate(
      {
        saleId: sale.id,
        items: lines
          .filter((line) => (quantities[line.productId] ?? 0) > 0)
          .map((line) => ({
            productId: line.productId,
            quantity: quantities[line.productId] ?? 0,
            reason,
          })),
        refundMethod,
        restock,
        note,
      },
      {
        onSuccess: (record) => {
          setResult({ returnNumber: record.returnNumber, refundTotal: record.refundTotal });
          toast.success(
            `${record.returnNumber} created — refunded ${formatCurrency(record.refundTotal)}.`,
          );
        },
        onError: (error) => toast.fromError(error),
      },
    );
  };

  const footer = result ? (
    <Button variant="default" onClick={onClose}>
      Done
    </Button>
  ) : sale === null ? (
    <Button variant="outline" onClick={onClose}>
      Cancel
    </Button>
  ) : (
    <>
      <Button variant="ghost" onClick={() => setSale(null)}>
        ← Another receipt
      </Button>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={handleConfirm}
        disabled={selectedCount === 0}
        isLoading={processReturn.isPending}
      >
        Refund {formatCurrency(refundTotal)}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Process return"
      description={sale ? `Receipt ${sale.receiptNumber}` : 'Find the original receipt to begin.'}
      icon={<Undo2 className="h-4 w-4" />}
      footer={footer}
    >
      {result ? (
        <div className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{result.returnNumber}</p>
            <p className="text-sm text-muted-foreground">
              Refunded {formatCurrency(result.refundTotal)}
            </p>
          </div>
        </div>
      ) : sale === null ? (
        <div className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Receipt number or customer name…"
            autoFocus
          />
          <div className="space-y-2">
            {search.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-border p-3">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                </div>
              ))
            ) : (search.data?.items ?? []).length === 0 ? (
              <EmptyState
                compact
                title="No receipts found"
                description="Try the receipt number printed on the customer copy."
              />
            ) : (
              search.data?.items.map((receipt) => (
                <button
                  key={receipt.id}
                  type="button"
                  onClick={() => setSale(receipt)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {receipt.receiptNumber}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {receipt.customerName} · {formatDateTime(receipt.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(receipt.total)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {sale.customerName} · {formatDateTime(sale.createdAt)} · refunded so far{' '}
            {formatCurrency(sale.refundedTotal)}
          </div>

          {linesLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-2">
              {lines.map((line) => {
                const selected = quantities[line.productId] ?? 0;
                return (
                  <div
                    key={line.productId}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.sku} · {formatCurrency(line.unitPrice)} · returnable{' '}
                        {line.returnableQty}
                      </p>
                    </div>
                    <Badge variant={selected > 0 ? 'default' : 'outline'} size="sm">
                      {formatCurrency(line.unitPrice * selected)}
                    </Badge>
                    <Input
                      type="number"
                      min={0}
                      max={line.returnableQty}
                      value={String(selected)}
                      onChange={(event) =>
                        setQuantity(line.productId, event.target.value, line.returnableQty)
                      }
                      className="h-8 w-20 text-right"
                      aria-label={`Return quantity for ${line.name}`}
                      disabled={line.returnableQty === 0}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as ReturnReason)}
              options={RETURN_REASONS.map((value) => ({
                value,
                label: RETURN_REASON_META[value].label,
              }))}
            />
            <Select
              label="Refund method"
              value={refundMethod}
              onChange={(event) => setRefundMethod(event.target.value as RefundMethod)}
              options={REFUND_METHOD_OPTIONS}
            />
          </div>

          <Checkbox
            checked={restock}
            onChange={(event) => setRestock(event.target.checked)}
            label="Return units to stock"
            description="Increases on-hand stock after the refund."
          />

          <Input
            label="Note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={200}
            placeholder="e.g. Damaged in transit"
          />
        </div>
      )}
    </Modal>
  );
}

export default ReturnModal;