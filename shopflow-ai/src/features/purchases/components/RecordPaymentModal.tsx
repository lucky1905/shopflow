import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks';
import { formatCurrency } from '@/utils/format';
import { paymentFormSchema } from '../schemas';
import { useRecordSupplierPayment } from '../api';
import type { SupplierPaymentRow } from '../types';

const METHOD_OPTIONS = [
  { value: 'bank', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
];

export interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  row: SupplierPaymentRow | null;
}

/** Records a supplier payment against a purchase order (mock mutation). */
export function RecordPaymentModal({ open, onClose, row }: RecordPaymentModalProps) {
  const toast = useToast();
  const recordPayment = useRecordSupplierPayment();

  const currentId = row?.poId ?? null;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [reference, setReference] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Prefill with the outstanding balance whenever the dialog opens for an order.
  const [prevId, setPrevId] = useState(currentId);
  if (prevId !== currentId) {
    setPrevId(currentId);
    if (currentId && row) {
      setAmount(String(row.dueAmount.toFixed(2)));
      setMethod('bank');
      setReference('');
      setFormError(null);
    }
  }

  const handleSubmit = (): void => {
    if (!row) return;
    const parsed = paymentFormSchema.safeParse({
      amount: Number(amount),
      method,
      reference,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the form values.');
      return;
    }
    setFormError(null);
    recordPayment.mutate(
      { poId: row.poId, amount: parsed.data.amount, method: parsed.data.method, reference: parsed.data.reference },
      {
        onSuccess: (updated) => {
          toast.success(
            `Recorded ${formatCurrency(parsed.data.amount)} against ${updated.poNumber}.`,
          );
          onClose();
        },
        onError: (error) => toast.fromError(error),
      },
    );
  };

  return (
    <Modal
      open={open && row !== null}
      onClose={onClose}
      size="sm"
      title="Record supplier payment"
      description={row ? `${row.poNumber} · ${row.supplierName}` : undefined}
      icon={<Wallet className="h-5 w-5" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={recordPayment.isPending}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit} isLoading={recordPayment.isPending}>
            Record payment
          </Button>
        </>
      }
    >
      {row && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order total</span>
              <span className="tabular-nums">{formatCurrency(row.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid so far</span>
              <span className="tabular-nums">{formatCurrency(row.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Outstanding</span>
              <span className="tabular-nums">{formatCurrency(row.dueAmount)}</span>
            </div>
          </div>

          <Input
            type="number"
            step="0.01"
            min={0}
            label="Amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={formError ?? undefined}
          />
          <Select
            label="Method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            options={METHOD_OPTIONS}
          />
          <Input
            label="Reference (optional)"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            maxLength={40}
            placeholder="e.g. TRANS-88421"
          />
        </div>
      )}
    </Modal>
  );
}

export default RecordPaymentModal;