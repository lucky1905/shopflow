import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageCheck, Truck } from 'lucide-react';
import { purchaseOrderPath } from '@/constants';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/utils/format';
import { GrnCreateModal, PurchasesHeader } from '../components';
import { useMarkOrderInTransit, usePendingDeliveries } from '../api';
import { DELIVERY_STATUS_META, PURCHASE_STATUS_META } from '../constants';
import type { DeliveryStatus, PurchaseOrder } from '../types';

const DELIVERY_FILTERS: Array<{ value: DeliveryStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All open' },
  { value: 'pending', label: 'Awaiting dispatch' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delayed', label: 'Delayed' },
];

/**
 * Supplier orders: everything sent to (or in flight with) a supplier, with
 * dispatch / receiving quick actions.
 */
export function SupplierOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | 'all'>('all');
  const [grnPoId, setGrnPoId] = useState<string | null>(null);

  const query = usePendingDeliveries();
  const markInTransit = useMarkOrderInTransit();

  const rows = (query.data ?? []).filter(
    (order) => deliveryFilter === 'all' || order.deliveryStatus === deliveryFilter,
  );

  const handleTransit = (order: PurchaseOrder): void => {
    markInTransit.mutate(order.id, {
      onSuccess: (updated) => toast.success(`${updated.poNumber} marked in transit.`),
      onError: (error) => toast.fromError(error),
    });
  };

  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'Order',
      render: (row) => <span className="font-semibold text-primary">{row.poNumber}</span>,
    },
    { key: 'supplierName', header: 'Supplier' },
    {
      key: 'expectedDate',
      header: 'Expected',
      render: (row) => (
        <div>
          <p className="whitespace-nowrap">{formatDate(row.expectedDate)}</p>
          <p className="text-xs text-muted-foreground">{row.items.length} lines</p>
        </div>
      ),
    },
    {
      key: 'deliveryStatus',
      header: 'Delivery',
      render: (row) => (
        <Badge variant={DELIVERY_STATUS_META[row.deliveryStatus].badge} size="sm">
          {DELIVERY_STATUS_META[row.deliveryStatus].label}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Order status',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={PURCHASE_STATUS_META[row.status].badge} size="sm">
          {PURCHASE_STATUS_META[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Value',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.total)}</span>
      ),
    },
  ];

  const filtersRow = (
    <div className="flex flex-wrap gap-1.5">
      {DELIVERY_FILTERS.map((entry) => (
        <button
          key={entry.value}
          type="button"
          onClick={() => setDeliveryFilter(entry.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
            deliveryFilter === entry.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-accent',
          )}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Supplier orders"
        description="Orders awaiting dispatch or in transit from your suppliers."
      />

      <SectionCard
        title="Open supplier orders"
        description={`${rows.length} order(s) in flight`}
        noPadding
        action={filtersRow}
      >
        <DataTable
          columns={columns}
          data={rows}
          rowKey="id"
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No open supplier orders"
          emptyDescription="Sent and partially received orders show up here."
          onRowClick={(row) => navigate(purchaseOrderPath(row.id))}
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-1">
              {row.deliveryStatus === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  leftIcon={<Truck className="h-3.5 w-3.5" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTransit(row);
                  }}
                >
                  In transit
                </Button>
              )}
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
            </div>
          )}
        />
      </SectionCard>

      <GrnCreateModal open={grnPoId !== null} onClose={() => setGrnPoId(null)} poId={grnPoId} />
    </PageContainer>
  );
}

export default SupplierOrdersPage;