import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  PackageCheck,
  Printer,
  Send,
  Wallet,
} from 'lucide-react';
import { APP_NAME, ROUTES } from '@/constants';
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
import { GrnCreateModal, GrnPreviewModal, RecordPaymentModal } from '../components';
import {
  useGrns,
  usePurchaseOrderDetail,
  useSendPurchaseOrder,
} from '../api';
import {
  DELIVERY_STATUS_META,
  GRN_STATUS_META,
  PURCHASE_STATUS_META,
  SUPPLIER_PAYMENT_STATUS_META,
} from '../constants';
import type { Grn, SupplierPaymentRow } from '../types';

/** Purchase order details: printable PO + payment, timeline and GRN panels. */
export function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const query = usePurchaseOrderDetail(id ?? null);
  const order = query.data;
  const grns = useGrns({
    search: order?.poNumber ?? '',
    status: 'all',
    page: 1,
    pageSize: 20,
  });
  const sendOrder = useSendPurchaseOrder();

  const [grnCreateOpen, setGrnCreateOpen] = useState(false);
  const [previewGrn, setPreviewGrn] = useState<Grn | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const back = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
      leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
    >
      Back to orders
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
          title="Purchase order"
          description="Unable to load this order."
          actions={back}
        />
        <ErrorState
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => void query.refetch()}
        />
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer maxWidth="full">
        <PageHeader title="Order not found" actions={back} />
        <EmptyState
          title="Purchase order not found"
          description="The order may have been deleted or the link is incorrect."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}>
              Browse purchase orders
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const paymentRow: SupplierPaymentRow = {
    poId: order.id,
    poNumber: order.poNumber,
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    total: order.total,
    paidAmount: order.paidAmount,
    dueAmount: Math.max(0, order.total - order.paidAmount),
    status: order.paymentStatus,
    dueDate: order.paymentDueDate,
  };

  const handleSend = (): void => {
    sendOrder.mutate(order.id, {
      onSuccess: (updated) => toast.success(`${updated.poNumber} sent to supplier.`),
      onError: (error) => toast.fromError(error),
    });
  };

  const orderGrns = (grns.data?.items ?? []).filter((grn) => grn.poId === order.id);

  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title={order.poNumber}
        description={`${order.supplierName} · ordered ${formatDate(order.createdAt)}`}
        actions={
          <>
            {back}
            {order.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Send className="h-3.5 w-3.5" />}
                onClick={handleSend}
                isLoading={sendOrder.isPending}
              >
                Send to supplier
              </Button>
            )}
            {(order.status === 'sent' || order.status === 'partial') && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PackageCheck className="h-3.5 w-3.5" />}
                onClick={() => setGrnCreateOpen(true)}
              >
                Receive
              </Button>
            )}
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
          <Badge variant={PURCHASE_STATUS_META[order.status].badge}>
            {PURCHASE_STATUS_META[order.status].label}
          </Badge>
          <Badge variant={DELIVERY_STATUS_META[order.deliveryStatus].badge}>
            {DELIVERY_STATUS_META[order.deliveryStatus].label}
          </Badge>
          <Badge variant={SUPPLIER_PAYMENT_STATUS_META[order.paymentStatus].badge}>
            {SUPPLIER_PAYMENT_STATUS_META[order.paymentStatus].label}
          </Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Printable purchase order document */}
        <article className="print-area mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-6 text-foreground sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-black uppercase tracking-widest">{APP_NAME}</p>
              <p className="text-sm text-muted-foreground">Demo Store · 123 Market Street</p>
              <p className="text-sm text-muted-foreground">+1 (555) 010-7788</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tracking-tight">PURCHASE ORDER</p>
              <p className="text-sm font-semibold text-primary">{order.poNumber}</p>
              <p className="text-xs text-muted-foreground">Issued {formatDate(order.createdAt)}</p>
            </div>
          </header>

          <div className="my-5 border-t border-dashed border-border" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-0.5 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Supplier
              </p>
              <p className="font-semibold">{order.supplierName}</p>
              <p className="text-muted-foreground">Expected {formatDate(order.expectedDate)}</p>
              <p className="text-muted-foreground">
                Payment due {formatDate(order.paymentDueDate)}
              </p>
            </div>
            <div className="space-y-0.5 text-sm sm:text-right">
              <p>
                <span className="text-muted-foreground">Buyer: </span>
                {order.createdBy}
              </p>
              <p>
                <span className="text-muted-foreground">Lines: </span>
                {order.items.length}
              </p>
              {order.note && <p className="text-muted-foreground italic">“{order.note}”</p>}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-2 font-semibold">Item</th>
                  <th className="py-2 px-2 text-right font-semibold">Qty</th>
                  <th className="py-2 px-2 text-right font-semibold">Rcvd</th>
                  <th className="py-2 px-2 text-right font-semibold">Unit</th>
                  <th className="py-2 pl-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((line) => (
                  <tr key={line.productId} className="border-b border-border/60">
                    <td className="py-2 pr-2">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">{line.sku}</p>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{line.quantity}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{line.receivedQty}</td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="py-2 pl-2 text-right font-semibold tabular-nums">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-64 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(order.taxTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <footer className="mt-6 border-t border-dashed border-border pt-3 text-center text-xs text-muted-foreground">
            <p>Authorized signatures — buyer & supplier representatives.</p>
          </footer>
        </article>

        {/* Side panels */}
        <div className="space-y-6">
          <SectionCard title="Payment">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order total</dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(order.paidAmount)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">Outstanding</dt>
                <dd className="font-bold tabular-nums">
                  {formatCurrency(Math.max(0, order.total - order.paidAmount))}
                </dd>
              </div>
            </dl>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${
                    order.total > 0
                      ? Math.min(100, (order.paidAmount / order.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              leftIcon={<Wallet className="h-3.5 w-3.5" />}
              disabled={order.paidAmount >= order.total || order.status === 'draft'}
              onClick={() => setPaymentOpen(true)}
            >
              Record payment
            </Button>
          </SectionCard>

          <SectionCard title="Timeline">
            <ol className="space-y-3 text-sm">
              {order.timeline.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="font-medium">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard
            title="Goods received"
            description={`${orderGrns.length} GRN(s) for this order`}
          >
            {grns.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading GRNs…</p>
            ) : orderGrns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing received yet — use “Receive” to create the first GRN.
              </p>
            ) : (
              <ul className="space-y-2">
                {orderGrns.map((grn) => (
                  <li
                    key={grn.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{grn.grnNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(grn.receivedAt)} · {grn.receivedBy}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={GRN_STATUS_META[grn.status].badge} size="sm">
                        {GRN_STATUS_META[grn.status].label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7"
                        onClick={() => setPreviewGrn(grn)}
                      >
                        View
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <GrnCreateModal
        open={grnCreateOpen}
        onClose={() => setGrnCreateOpen(false)}
        poId={order.id}
      />
      <GrnPreviewModal
        open={previewGrn !== null}
        onClose={() => setPreviewGrn(null)}
        grn={previewGrn}
      />
      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        row={paymentRow}
      />
    </PageContainer>
  );
}

export default PurchaseOrderDetailsPage;


