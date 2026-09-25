import { useState } from 'react';
import { useDebouncedValue } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/utils/format';
import { GrnCreateModal, GrnPreviewModal, PurchasesHeader } from '../components';
import { useGrns } from '../api';
import { GRN_STATUS_OPTIONS, GRN_STATUS_META } from '../constants';
import type { Grn, GrnStatus } from '../types';

/** Goods Received Notes: browse, preview/print, and create against open POs. */
export function GoodsReceivedNotesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<GrnStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [preview, setPreview] = useState<Grn | null>(null);

  const debouncedSearch = useDebouncedValue(search, 250);
  const filters = { search: debouncedSearch, status, page, pageSize };
  const query = useGrns(filters);

  const activeCount = (status !== 'all' ? 1 : 0) + (search ? 1 : 0);
  const reset = (): void => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  const columns: DataTableColumn<Grn>[] = [
    {
      key: 'grnNumber',
      header: 'GRN',
      render: (row) => <span className="font-semibold text-primary">{row.grnNumber}</span>,
    },
    {
      key: 'poNumber',
      header: 'Order',
      render: (row) => <span className="text-muted-foreground">{row.poNumber}</span>,
    },
    { key: 'supplierName', header: 'Supplier', hideOnMobile: true },
    {
      key: 'receivedAt',
      header: 'Received',
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.receivedAt)}
        </span>
      ),
    },
    {
      key: 'receivedBy',
      header: 'Receiver',
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={GRN_STATUS_META[row.status].badge} size="sm">
          {GRN_STATUS_META[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums">
          {row.lines.reduce((sum, line) => sum + line.receivedQty, 0)}
        </span>
      ),
    },
    {
      key: 'damaged',
      header: 'Damaged',
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <span className="tabular-nums text-destructive">
          {row.lines.reduce((sum, line) => sum + line.damagedQty, 0) || '—'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Goods received notes"
        description="Record and audit every delivery against its purchase order."
        actions={
          <Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
            New GRN
          </Button>
        }
      />

      <FilterBar activeCount={activeCount} onReset={reset} label="Filters">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            aria-label="GRN status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as GrnStatus | 'all');
              setPage(1);
            }}
            options={GRN_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="h-9 text-sm"
          />
        </div>
      </FilterBar>

      <SectionCard title="GRNs" description="Newest receiving notes first" noPadding>
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          rowKey="id"
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No GRNs found"
          emptyDescription="Create a GRN when a supplier delivery arrives."
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              New GRN
            </Button>
          }
          onRowClick={(row) => setPreview(row)}
          search={{
            value: search,
            onChange: (value) => {
              setSearch(value);
              setPage(1);
            },
            placeholder: 'GRN #, PO # or supplier…',
          }}
          pagination={{
            page,
            pageSize,
            total: query.data?.total ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
          rowActions={(row) => (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={(event) => {
                event.stopPropagation();
                setPreview(row);
              }}
            >
              Preview
            </Button>
          )}
        />
      </SectionCard>

      <GrnCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <GrnPreviewModal open={preview !== null} onClose={() => setPreview(null)} grn={preview} />
    </PageContainer>
  );
}

export default GoodsReceivedNotesPage;