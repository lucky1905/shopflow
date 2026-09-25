import { Mail, Printer, Receipt, RotateCcw } from 'lucide-react';
import { APP_NAME } from '@/constants';
import { useToast } from '@/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { PAYMENT_METHOD_META, RECEIPT_FOOTER } from '../constants';
import { isSaleReturnable, saleStatusMeta } from '../utils';
import type { Sale } from '../types';

export interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  /** Checkout flow — starts the next basket (focus search). */
  onNewSale?: () => void;
  /** History flow — opens the return dialog for this sale. */
  onStartReturn?: (sale: Sale) => void;
}

/** Deterministic pseudo-barcode widths derived from the receipt number. */
function barcodeBars(seed: string): number[] {
  return Array.from(
    { length: 44 },
    (_, index) => ((seed.charCodeAt(index % seed.length) + index * 7) % 3) + 1,
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value}</span>
    </div>
  );
}

/** Printable receipt preview for a completed (or historical) sale. */
export function ReceiptModal({
  open,
  onClose,
  sale,
  onNewSale,
  onStartReturn,
}: ReceiptModalProps) {
  const toast = useToast();
  const status = sale ? saleStatusMeta(sale.status) : null;

  return (
    <Modal
      open={open && sale !== null}
      onClose={onClose}
      size="sm"
      title="Receipt"
      description={sale?.receiptNumber}
      icon={<Receipt className="h-4 w-4" />}
      footer={
        sale && (
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Mail className="h-3.5 w-3.5" />}
              onClick={() => toast.info('Receipt emailed to the customer (demo).')}
            >
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="h-3.5 w-3.5" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            {onStartReturn && isSaleReturnable(sale) && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => onStartReturn(sale)}
              >
                Start return
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onClose();
                onNewSale?.();
              }}
            >
              New sale
            </Button>
          </>
        )
      }
    >
      {sale && status && (
        <div className="print-area mx-auto w-full max-w-[22rem] rounded-lg border border-dashed border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
          <div className="space-y-0.5 text-center">
            <p className="text-sm font-bold uppercase tracking-widest">{APP_NAME}</p>
            <p className="text-muted-foreground">Demo Store · 123 Market Street</p>
            <p className="text-muted-foreground">+1 (555) 010-7788 · Tax ID 12-3456789</p>
          </div>

          <div className="my-3 border-t border-dashed border-border" />

          <div className="space-y-1">
            <MetaRow label="Receipt" value={sale.receiptNumber} />
            <MetaRow label="Date" value={formatDateTime(sale.createdAt)} />
            <MetaRow label="Cashier" value={sale.cashierName} />
            <MetaRow label="Customer" value={sale.customerName} />
            <MetaRow label="Status" value={status.label} />
          </div>

          <div className="my-3 border-t border-dashed border-border" />

          <div className="space-y-2">
            {sale.items.map((item) => (
              <div key={item.productId}>
                <p className="text-foreground">{item.name}</p>
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                    {item.discountPct > 0 ? ` −${item.discountPct}%` : ''}
                  </span>
                  <span className="text-foreground">{formatCurrency(item.lineTotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-border" />

          <div className="space-y-1">
            <MetaRow label="Subtotal" value={formatCurrency(sale.subtotal)} />
            {sale.discountTotal > 0 && (
              <MetaRow label="Discount" value={`−${formatCurrency(sale.discountTotal)}`} />
            )}
            <MetaRow label="Tax" value={formatCurrency(sale.taxTotal)} />
            <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-border" />

          <div className="space-y-1">
            {sale.payments.map((payment, index) => (
              <MetaRow
                key={`${payment.method}-${index}`}
                label={PAYMENT_METHOD_META[payment.method].label}
                value={formatCurrency(payment.amount)}
              />
            ))}
            {sale.changeDue > 0 && (
              <MetaRow label="Change" value={formatCurrency(sale.changeDue)} />
            )}
            {sale.refundedTotal > 0 && (
              <MetaRow label="Refunded" value={`−${formatCurrency(sale.refundedTotal)}`} />
            )}
          </div>

          <div className="my-3 border-t border-dashed border-border" />

          <div className="space-y-2 text-center">
            <p>{RECEIPT_FOOTER}</p>
            <div className="flex h-8 items-end justify-center gap-[2px]" aria-hidden>
              {barcodeBars(sale.receiptNumber).map((width, index) => (
                <span
                  key={index}
                  className={index % 2 === 0 ? 'bg-foreground' : 'bg-transparent'}
                  style={{ width, height: '100%' }}
                />
              ))}
            </div>
            <p className="text-[10px] tracking-widest text-muted-foreground">
              {sale.receiptNumber}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ReceiptModal;