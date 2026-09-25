import { APP_NAME } from '@/constants';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { INVOICE_STATUS_META, PAYMENT_STATUS_META, SALES_CHANNEL_META } from '../constants';
import type { InvoiceDetail } from '../types';

export interface InvoiceDocumentProps {
  invoice: InvoiceDetail;
  /** Applied by the details page / preview modal for `window.print()`. */
  printArea?: boolean;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * Printable invoice document shared by the details page and the preview
 * modal. When `printArea` is set, only this subtree is printed (uses the
 * global `.print-area` rules in `globals.css`).
 */
export function InvoiceDocument({ invoice, printArea = true }: InvoiceDocumentProps) {
  const statusMeta = INVOICE_STATUS_META[invoice.status];
  const paymentMeta = PAYMENT_STATUS_META[invoice.paymentStatus];
  const balanceDue = Math.max(0, invoice.total - invoice.paidAmount + invoice.refundedTotal);

  return (
    <article
      className={
        printArea
          ? 'print-area mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-6 text-foreground sm:p-8'
          : 'w-full'
      }
    >
      {/* Letterhead */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-black uppercase tracking-widest">{APP_NAME}</p>
          <p className="text-sm text-muted-foreground">Demo Store · 123 Market Street</p>
          <p className="text-sm text-muted-foreground">+1 (555) 010-7788 · tax ID 12-3456789</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight">INVOICE</p>
          <p className="text-sm font-semibold text-primary">{invoice.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">Issued {formatDate(invoice.createdAt)}</p>
        </div>
      </header>

      <div className="my-5 border-t border-dashed border-border" />

      {/* Parties & meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-0.5 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bill to</p>
          <p className="font-semibold">{invoice.customerName}</p>
          <p className="text-muted-foreground">{invoice.shippingAddress}</p>
        </div>
        <div className="space-y-1 text-sm sm:text-right">
          <p>
            <span className="text-muted-foreground">Channel: </span>
            {SALES_CHANNEL_META[invoice.channel].label}
          </p>
          <p>
            <span className="text-muted-foreground">Cashier: </span>
            {invoice.cashierName}
          </p>
          <p>
            <span className="text-muted-foreground">Due: </span>
            {formatDate(invoice.dueDate)}
          </p>
          <p className="flex flex-wrap gap-2 sm:justify-end">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {statusMeta.label}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {paymentMeta.label}
            </span>
          </p>
        </div>
      </div>

      {/* Lines */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-2 font-semibold">Item</th>
              <th className="py-2 px-2 text-right font-semibold">Qty</th>
              <th className="py-2 px-2 text-right font-semibold">Price</th>
              <th className="py-2 px-2 text-right font-semibold">Disc</th>
              <th className="py-2 pl-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.productId} className="border-b border-border/60">
                <td className="py-2 pr-2">
                  <p className="font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">{line.sku}</p>
                </td>
                <td className="py-2 px-2 text-right tabular-nums">{line.quantity}</td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {formatCurrency(line.unitPrice)}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {line.discountPct > 0 ? `${line.discountPct}%` : '—'}
                </td>
                <td className="py-2 pl-2 text-right font-semibold tabular-nums">
                  {formatCurrency(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-64 space-y-1.5 text-sm">
          <MetaRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          {invoice.discountTotal > 0 && (
            <MetaRow label="Discounts" value={`−${formatCurrency(invoice.discountTotal)}`} />
          )}
          <MetaRow label={`Tax (${invoice.taxRatePct}%)`} value={formatCurrency(invoice.taxTotal)} />
          <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(invoice.total)}</span>
          </div>
          <MetaRow label="Paid" value={formatCurrency(invoice.paidAmount)} />
          {invoice.refundedTotal > 0 && (
            <MetaRow label="Refunded" value={`−${formatCurrency(invoice.refundedTotal)}`} />
          )}
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Balance due</span>
            <span className="tabular-nums">{formatCurrency(balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <div className="mt-5 border-t border-dashed border-border pt-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payments received
          </p>
          <ul className="mt-1.5 space-y-1">
            {invoice.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap justify-between gap-x-3">
                <span className="capitalize text-muted-foreground">
                  {payment.method} · {payment.reference}
                </span>
                <span className="tabular-nums">
                  {formatCurrency(payment.amount)} · {formatDateTime(payment.paidAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="mt-6 border-t border-dashed border-border pt-3 text-center text-xs text-muted-foreground">
        <p>{invoice.terms}</p>
        <p className="mt-1">Thank you for your business!</p>
      </footer>
    </article>
  );
}

export default InvoiceDocument;
