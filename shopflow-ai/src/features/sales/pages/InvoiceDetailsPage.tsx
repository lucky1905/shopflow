import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Printer, ReceiptText } from 'lucide-react';
import { ROUTES } from '@/constants';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { InvoiceDocument } from '../components';
import { useInvoiceDetail } from '../api';
import { INVOICE_STATUS_META, PAYMENT_STATUS_META } from '../constants';

/** Invoice details: printable document + payment / refund side panel. */
export function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useInvoiceDetail(id ?? null);

  const back = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(ROUTES.SALES_HISTORY)}
      leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
    >
      Back to history
    </Button>
  );

  if (query.isLoading) {
    return (
      <PageContainer maxWidth="full">
        <LoadingSkeleton variant="page" rows={4} />
      </PageContainer>
    );
  }

  if (query.isError) {
    return (
      <PageContainer maxWidth="full">
        <PageHeader
          title="Invoice"
          description="Unable to load this invoice."
          actions={back}
          icon={<ReceiptText className="h-6 w-6" />}
        />
        <ErrorState
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => void query.refetch()}
        />
      </PageContainer>
    );
  }

  const invoice = query.data;
  if (!invoice) {
    return (
      <PageContainer maxWidth="full">
        <PageHeader
          title="Invoice not found"
          actions={back}
          icon={<ReceiptText className="h-6 w-6" />}
        />
        <EmptyState
          title="Invoice not found"
          description="The invoice may have been deleted or the link is incorrect."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SALES_HISTORY)}>
              Browse sales history
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const balanceDue = Math.max(0, invoice.total - invoice.paidAmount + invoice.refundedTotal);

  return (
    <PageContainer maxWidth="full">
      <PageHeader
        icon={<ReceiptText className="h-6 w-6" />}
        title={invoice.invoiceNumber}
        description={`${invoice.customerName} · issued ${formatDate(invoice.createdAt)}`}
        actions={
          <>
            {back}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileDown className="h-3.5 w-3.5" />}
              onClick={() => {
                toast.info('PDF export is mocked in Phase 4 — use the print dialog to save as PDF.');
                window.print();
              }}
            >
              PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              leftIcon={<Printer className="h-3.5 w-3.5" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant={INVOICE_STATUS_META[invoice.status].badge}>
            {INVOICE_STATUS_META[invoice.status].label}
          </Badge>
          <Badge variant={PAYMENT_STATUS_META[invoice.paymentStatus].badge}>
            {PAYMENT_STATUS_META[invoice.paymentStatus].label}
          </Badge>
          <Badge variant="outline">
            {invoice.lines.length} lines · {invoice.itemCount} units
          </Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <InvoiceDocument invoice={invoice} />

        <div className="space-y-6">
          <SectionCard title="Payment summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Invoice total</dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(invoice.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(invoice.paidAmount)}
                </dd>
              </div>
              {invoice.refundedTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Refunded</dt>
                  <dd className="tabular-nums text-amber-600 dark:text-amber-400">
                    −{formatCurrency(invoice.refundedTotal)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">Balance due</dt>
                <dd className="font-bold tabular-nums">{formatCurrency(balanceDue)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>Due date</dt>
                <dd>{formatDate(invoice.dueDate)}</dd>
              </div>
            </dl>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.total) * 100)}%` }}
              />
            </div>
          </SectionCard>

          <SectionCard title="Transactions">
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">{payment.method}</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {payment.reference} · {formatDateTime(payment.paidAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {(invoice.note || invoice.returnIds.length > 0) && (
            <SectionCard title="Notes & returns">
              {invoice.note && <p className="text-sm text-muted-foreground">{invoice.note}</p>}
              {invoice.returnIds.length > 0 && (
                <p className="mt-2 text-sm">
                  <span className="font-medium">{invoice.returnIds.length}</span> return record(s)
                  linked — manage them under Returns.
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default InvoiceDetailsPage;
