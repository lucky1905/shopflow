import { useMemo, useState } from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useDebouncedValue } from '@/hooks';
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/format';
import { HISTORY_PAGE_SIZE } from '../constants';
import { useSalesHistory } from '../api';
import { isSaleReturnable, saleStatusMeta } from '../utils';
import type { Sale, SaleFilters } from '../types';

export interface SalesHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onViewReceipt: (sale: Sale) => void;
  onStartReturn: (sale: Sale) => void;
}

/** Receipt browser: search, paginate, reprint and launch returns. */
export function SalesHistoryDrawer({
  open,
  onClose,
  onViewReceipt,
  onStartReturn,
}: SalesHistoryDrawerProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 250);

  const filters = useMemo<SaleFilters>(
    () => ({ search: debouncedSearch, page, pageSize: HISTORY_PAGE_SIZE }),
    [debouncedSearch, page],
  );
  const { data, isLoading, error } = useSalesHistory(filters);

  const columns: DataTableColumn<Sale>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt',
      render: (sale) => <span className="font-medium text-foreground">{sale.receiptNumber}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (sale) => <span className="whitespace-nowrap">{formatDateTime(sale.createdAt)}</span>,
    },
    { key: 'customerName', header: 'Customer', hideOnMobile: true },
    {
      key: 'units',
      header: 'Items',
      align: 'right',
      render: (sale) =>
        formatNumber(sale.items.reduce((sum, item) => sum + item.quantity, 0)),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (sale) => (
        <span className="font-semibold tabular-nums">{formatCurrency(sale.total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (sale) => {
        const meta = saleStatusMeta(sale.status);
        return (
          <Badge variant={meta.badge} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      size="xl"
      title="Sales history"
      description="Browse receipts, reprint them or start a return."
    >
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        error={error instanceof Error ? error.message : null}
        emptyTitle="No sales found"
        emptyDescription="Completed checkouts will appear here."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: 'Receipt # or customer…',
        }}
        onRowClick={onViewReceipt}
        rowActions={(sale) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`View receipt ${sale.receiptNumber}`}
              onClick={(event) => {
                event.stopPropagation();
                onViewReceipt(sale);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label={`Return items from ${sale.receiptNumber}`}
              disabled={!isSaleReturnable(sale)}
              onClick={(event) => {
                event.stopPropagation();
                onStartReturn(sale);
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
        pagination={{
          page: filters.page,
          pageSize: filters.pageSize,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />
    </Drawer>
  );
}

export default SalesHistoryDrawer;