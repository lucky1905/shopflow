import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { CASH_DENOMINATIONS, PAYMENT_METHOD_META, PAYMENT_METHODS } from '../constants';
import { useCheckoutSale } from '../api';
import { useCartStore } from '../hooks';
import { computeCartTotals, changeDue, remainingDue, roundMoney, tendersCoverTotal } from '../utils';
import type { PaymentMethod, PaymentTender, Sale } from '../types';

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Fires with the completed sale so the page can show the receipt. */
  onComplete: (sale: Sale) => void;
}

/**
 * Tender pad: cash / card / mobile with optional split payments, quick cash
 * bills and change due. Completing posts the checkout mutation.
 */
export function PaymentModal({ open, onClose, onComplete }: PaymentModalProps) {
  const toast = useToast();
  const items = useCartStore((state) => state.items);
  const customerId = useCartStore((state) => state.customerId);
  const orderDiscount = useCartStore((state) => state.orderDiscount);
  const taxRatePct = useCartStore((state) => state.taxRatePct);
  const note = useCartStore((state) => state.note);
  const resetAfterSale = useCartStore((state) => state.resetAfterSale);

  const totals = computeCartTotals(items, orderDiscount, taxRatePct);

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tenders, setTenders] = useState<PaymentTender[]>([]);
  const [tenderedInput, setTenderedInput] = useState('');
  const checkout = useCheckoutSale();

  const due = useMemo(() => remainingDue(tenders, totals.total), [tenders, totals.total]);
  const covered = tendersCoverTotal(tenders, totals.total);
  const change = changeDue(tenders, totals.total);
  const paidSoFar = roundMoney(totals.total - due);

  // Fresh tender pad every time the dialog opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setTenders([]);
      setMethod('cash');
      setTenderedInput('');
    }
  }

  const addTender = (): void => {
    if (due <= 0) return;

    if (method === 'cash') {
      const tendered = Number(tenderedInput);
      if (!Number.isFinite(tendered) || tendered <= 0) {
        toast.error('Enter the cash amount received.');
        return;
      }
      const rounded = roundMoney(tendered);
      setTenders((current) => [
        ...current,
        { method: 'cash', amount: Math.min(rounded, due), tendered: rounded },
      ]);
      setTenderedInput('');
      return;
    }

    setTenders((current) => [...current, { method, amount: due }]);
  };

  const removeTender = (index: number): void => {
    setTenders((current) => current.filter((_, position) => position !== index));
  };

  const handleComplete = (): void => {
    if (!covered) return;
    checkout.mutate(
      {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPct: item.discountPct,
        })),
        customerId,
        orderDiscount,
        taxRatePct,
        note,
        payments: tenders,
      },
      {
        onSuccess: (sale) => {
          resetAfterSale();
          onComplete(sale);
        },
        onError: (error) => toast.fromError(error),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Take payment"
      description="Add one or more tenders until the total is covered."
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={checkout.isPending}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleComplete}
            disabled={!covered}
            isLoading={checkout.isPending}
          >
            Complete sale · {formatCurrency(totals.total)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(due)}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              Paid:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(paidSoFar)}</span>
            </p>
            {change > 0 && (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Change: {formatCurrency(change)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((value) => {
            const meta = PAYMENT_METHOD_META[value];
            const Icon = meta.icon;
            const active = method === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                <Icon className="h-5 w-5" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {due > 0 && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_META[method].hint}</p>

            {method === 'cash' && (
              <>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  label="Cash received"
                  value={tenderedInput}
                  onChange={(event) => setTenderedInput(event.target.value)}
                  placeholder="0.00"
                />
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTenderedInput(due.toFixed(2))}
                  >
                    Exact
                  </Button>
                  {CASH_DENOMINATIONS.map((denomination) => (
                    <Button
                      key={denomination}
                      variant="outline"
                      size="sm"
                      onClick={() => setTenderedInput(String(denomination))}
                    >
                      ${denomination}
                    </Button>
                  ))}
                </div>
              </>
            )}

            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={addTender}
            >
              {method === 'cash'
                ? 'Add cash payment'
                : `Charge ${formatCurrency(due)} ${PAYMENT_METHOD_META[method].label.toLowerCase()}`}
            </Button>
          </div>
        )}

        {tenders.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Tenders</p>
            {tenders.map((tender, index) => {
              const meta = PAYMENT_METHOD_META[tender.method];
              const Icon = meta.icon;
              return (
                <div
                  key={`${tender.method}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Badge variant={meta.badge} size="sm">
                    {meta.label}
                  </Badge>
                  {tender.tendered !== undefined && tender.tendered > tender.amount && (
                    <span className="text-xs text-muted-foreground">
                      tendered {formatCurrency(tender.tendered)}
                    </span>
                  )}
                  <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(tender.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    aria-label="Remove tender"
                    onClick={() => removeTender(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {covered && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Fully paid · change due {formatCurrency(change)}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default PaymentModal;