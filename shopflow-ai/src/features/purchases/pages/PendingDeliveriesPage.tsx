import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PackageCheck, Timer, Truck } from 'lucide-react';
import { purchaseOrderPath } from '@/constants';
import { useToast } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import { GrnCreateModal, PurchasesHeader } from '../components';
import { useMarkOrderInTransit, usePendingDeliveries } from '../api';
import { DELIVERY_STATUS_META, PURCHASE_STATUS_META } from '../constants';
import { daysUntil } from '../utils';
import type { PurchaseOrder } from '../types';

function etaChip(order: PurchaseOrder): { label: string; danger: boolean } {
  const days = daysUntil(order.expectedDate);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, danger: true };
  if (days === 0) return { label: 'Due today', danger: false };
  return { label: `in ${days}d`, danger: false };
}

/** Card board of open deliveries with ETA chips and receiving actions. */
export function PendingDeliveriesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const query = usePendingDeliveries();
  const markInTransit = useMarkOrderInTransit();
  const [grnPoId, setGrnPoId] = useState<string | null>(null);

  const handleTransit = (order: PurchaseOrder): void => {
    markInTransit.mutate(order.id, {
      onSuccess: (updated) => toast.success(`${updated.poNumber} marked in transit.`),
      onError: (error) => toast.fromError(error),
    });
  };

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Pending deliveries"
        description="Open shipments with ETA tracking and one-click receiving."
      />

      <SectionCard
        title="In transit & awaiting dispatch"
        description="Sorted by expected delivery date"
      >
        {query.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-3 w-2/3" />
                <Skeleton className="mt-3 h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            compact
            message={query.error instanceof Error ? query.error.message : undefined}
            onRetry={() => void query.refetch()}
          />
        ) : (query.data ?? []).length === 0 ? (
          <EmptyState
            compact
            icon={<Truck className="h-5 w-5" />}
            title="No pending deliveries"
            description="Orders you send to suppliers will appear here until they are received."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(query.data ?? []).map((order, index) => {
              const eta = etaChip(order);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="truncate font-semibold text-primary hover:underline"
                        onClick={() => navigate(purchaseOrderPath(order.id))}
                      >
                        {order.poNumber}
                      </button>
                      <p className="truncate text-sm text-muted-foreground">{order.supplierName}</p>
                    </div>
                    <span
                      className={
                        eta.danger
                          ? 'shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive'
                          : 'shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary'
                      }
                    >
                      {eta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={DELIVERY_STATUS_META[order.deliveryStatus].badge} size="sm">
                      {DELIVERY_STATUS_META[order.deliveryStatus].label}
                    </Badge>
                    <Badge variant={PURCHASE_STATUS_META[order.status].badge} size="sm">
                      {PURCHASE_STATUS_META[order.status].label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="h-3.5 w-3.5" />
                      {formatDate(order.expectedDate)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="mt-auto flex gap-2">
                    {order.deliveryStatus === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        leftIcon={<Truck className="h-3.5 w-3.5" />}
                        onClick={() => handleTransit(order)}
                      >
                        In transit
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      leftIcon={<PackageCheck className="h-3.5 w-3.5" />}
                      onClick={() => setGrnPoId(order.id)}
                    >
                      Receive
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <GrnCreateModal open={grnPoId !== null} onClose={() => setGrnPoId(null)} poId={grnPoId} />
    </PageContainer>
  );
}

export default PendingDeliveriesPage;
