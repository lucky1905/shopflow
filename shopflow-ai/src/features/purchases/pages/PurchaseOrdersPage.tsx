import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, PackageCheck, Send } from 'lucide-react';
import { purchaseOrderPath } from '@/constants';
import { useDebouncedValue, useToast } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/utils/format';
import { GrnCreateModal, PurchaseFiltersBar, PurchasesHeader } from '../components';
import { usePurchaseOrders, useSendPurchaseOrder } from '../api';
import {
  DELIVERY_STATUS_META,
  PURCHASE_STATUS_META,
  SUPPLIER_PAYMENT_STATUS_META,
} from '../constants';
import { usePurchaseFiltersStore } from '../hooks';
import type { PurchaseOrder } from '../types';

/** Advanced-filtered, paginated purchase order list with lifecycle actions. */
export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const filters = usePurchaseFiltersStore();
  const patch = usePurchaseFiltersStore((state) => state.patch);
  const debouncedSearch = useDebouncedValue(filters.search, 250);

  const query = usePurchaseOrders({ ...filters, search: debouncedSearch });
  const sendOrder = useSendPurchaseOrder();
  const [grnPoId, setGrnPoId] = useState<string | null>(null);

  const handleSend = (order: PurchaseOrder): void => {
    sendOrder.mutate(order.id, {
      onSuccess: (updated) => toast.success(`${updated.poNumber} sent to supplier.`),
      onError: (error) => toast.fromError(error),
    });
  };

  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'Order',
      sortable: true,
      render: (row) => <span className="font-semibold text-primary">{row.poNumber}</span>,
    },
    { key: 'supplierName', header: 'Supplier', sortable: true },
    {
      key: 'expectedDate',
      header: 'Expected',
      hideOnMobile: true,
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.expectedDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={PURCHASE_STATUS_META[row.status].badge} size="sm">
          {PURCHASE_STATUS_META[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'deliveryStatus',
      header: 'Delivery',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={DELIVERY_STATUS_META[row.deliveryStatus].badge} size="sm">
          {DELIVERY_STATUS_META[row.deliveryStatus].label}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={SUPPLIER_PAYMENT_STATUS_META[row.paymentStatus].badge} size="sm">
          {SUPPLIER_PAYMENT_STATUS_META[row.paymentStatus].label}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.total)}</span>
      ),
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Purchase orders"
        description="Create, send and track supplier purchase orders."
      />

      <PurchaseFiltersBar />

      <SectionCard title="Orders" description="All purchase orders across every supplier" noPadding>
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          rowKey="id"
          loading={query.isLoading}
          loadingRows={8}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No purchase orders found"
          emptyDescription="Try widening the date range or clearing the filters."
          sortable
          stickyHeader
          onRowClick={(row) => navigate(purchaseOrderPath(row.id))}
          search={{
            value: filters.search,
            onChange: (value) => patch({ search: value, page: 1 }),
            placeholder: 'PO #, supplier or amount…',
          }}
          toolbarActions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={() => toast.info('CSV export is mocked in Phase 4.')}
            >
              Export CSV
            </Button>
          }
          pagination={{
            page: filters.page,
            pageSize: filters.pageSize,
            total: query.data?.total ?? 0,
            onPageChange: (page) => patch({ page }),
            onPageSizeChange: (pageSize) => patch({ pageSize, page: 1 }),
          }}
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-1">
              {row.status === 'draft' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSend(row);
                  }}
                >
                  Send
                </Button>
              )}
              {(row.status === 'sent' || row.status === 'partial') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  leftIcon={<PackageCheck className="h-3.5 w-3.5" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setGrnPoId(row.id);
                  }}
                >
                  Receive
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Open ${row.poNumber}`}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(purchaseOrderPath(row.id));
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        />
      </SectionCard>

      <GrnCreateModal open={grnPoId !== null} onClose={() => setGrnPoId(null)} poId={grnPoId} />
    </PageContainer>
  );
}

export default PurchaseOrdersPage;
