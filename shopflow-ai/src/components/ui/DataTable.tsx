import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox, Search } from 'lucide-react';
import { cn, compareValues, getNestedValue } from '@/lib/utils';
import { Input } from './Input';
import { Button } from './Button';
import { Select } from './Select';

/* -------------------------------------------------------------------------- */
/*  Public contracts                                                          */
/* -------------------------------------------------------------------------- */

export interface DataTableColumn<T> {
  /** Property key (supports dot paths) or a stable identifier. */
  key: string;
  header: ReactNode;
  /** Custom cell renderer; falls back to the raw value. */
  render?: (row: T, rowIndex: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  /** Hide the column below the `lg` breakpoint. */
  hideOnMobile?: boolean;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Unique field per row (used as the React key). */
  rowKey: keyof T | ((row: T, index: number) => string);
  loading?: boolean;
  /** Number of skeleton rows while loading. */
  loadingRows?: number;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Highlights the row whose key matches this value. */
  activeRowKey?: string;
  pagination?: DataTablePagination;
  search?: DataTableSearch;
  /** Extra controls rendered next to the search field. */
  filters?: ReactNode;
  toolbarActions?: ReactNode;
  /** Per-row action menu rendered in a trailing column. */
  rowActions?: (row: T) => ReactNode;
  /** Enables client-side sorting. */
  sortable?: boolean;
  stickyHeader?: boolean;
  className?: string;
  tableClassName?: string;
  caption?: string;
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  key: string;
  direction: SortDirection;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Generic, dependency-free data table with sorting, search, pagination,
 * loading skeletons and empty/error states. Designed for the ShopFlow
 * feature modules (Inventory, POS, Customers, Suppliers, Sales, …).
 */
export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingRows = 6,
  error = null,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Data will appear here once records are available.',
  emptyIcon,
  emptyAction,
  onRowClick,
  activeRowKey,
  pagination,
  search,
  filters,
  toolbarActions,
  rowActions,
  sortable = false,
  stickyHeader = false,
  className,
  tableClassName,
  caption,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const resolveRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    const key = row[rowKey];
    return key === undefined || key === null ? String(index) : String(key);
  };

  const sortedData = useMemo(() => {
    if (!sortable || !sort) return data;

    return [...data].sort((a, b) => {
      const result = compareValues(getNestedValue(a, sort.key), getNestedValue(b, sort.key));
      return sort.direction === 'asc' ? result : -result;
    });
  }, [data, sort, sortable]);

  const toggleSort = (key: string) => {
    setSort((previous) => {
      if (!previous || previous.key !== key) return { key, direction: 'asc' };
      if (previous.direction === 'asc') return { key, direction: 'desc' };
      return null; // a third click clears sorting
    });
  };

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / Math.max(1, pagination.pageSize)))
    : 1;

  const firstRowIndex = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const lastRowIndex = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : sortedData.length;

  const hasToolbar = Boolean(search || filters || toolbarActions);
  const showTable = !error && (loading || sortedData.length > 0);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {hasToolbar && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {search && (
              <Input
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder ?? 'Search…'}
                leftIcon={<Search className="h-4 w-4" />}
                className="sm:max-w-xs"
                aria-label="Search table"
              />
            )}
            {filters}
          </div>
          {toolbarActions && <div className="flex items-center gap-2">{toolbarActions}</div>}
        </div>
      )}

      {showTable && (
        <div className="w-full overflow-x-auto">
          <table className={cn('w-full caption-bottom text-sm', tableClassName)}>
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead
              className={cn(
                'bg-muted/50 text-muted-foreground',
                stickyHeader && 'sticky top-0 z-10 backdrop-blur',
              )}
            >
              <tr className="border-b border-border">{columns.map((column) => {
                  const isSorted = sort?.key === column.key;
                  const canSort = sortable && column.sortable !== false;
                  const ariaSort = isSorted
                    ? sort?.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none';

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={ariaSort}
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        !column.align && 'text-left',
                        column.hideOnMobile && 'hidden lg:table-cell',
                        column.headerClassName,
                      )}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded transition-colors hover:text-foreground',
                            isSorted && 'text-foreground',
                            column.align === 'right' && 'flex-row-reverse',
                          )}
                        >
                          {column.header}
                          {isSorted && sort?.direction === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown
                              className={cn('h-3.5 w-3.5', !isSorted && 'opacity-40')}
                            />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
                {rowActions && (
                  <th
                    scope="col"
                    className="w-px whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                )}</tr>
            </thead>
            <tbody>{loading &&
                  Array.from({ length: loadingRows }).map((_, rowIndex) => (
                    <tr
                      key={`skeleton-${rowIndex}`}
                      className="border-b border-border last:border-0"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3.5',
                            column.hideOnMobile && 'hidden lg:table-cell',
                          )}
                        >
                          <div className="h-4 w-full max-w-[9rem] animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-4 py-3.5">
                          <div className="ml-auto h-4 w-8 animate-pulse rounded bg-muted" />
                        </td>
                      )}
                    </tr>
                  ))}
                {!loading &&
                  sortedData.map((row, index) => {
                    const key = resolveRowKey(row, index);
                    const isActive = activeRowKey !== undefined && activeRowKey === key;

                    return (
                      <tr
                        key={key}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                          'border-b border-border transition-colors last:border-0',
                          onRowClick && 'cursor-pointer hover:bg-muted/50',
                          isActive && 'bg-primary/5',
                        )}
                      >
                        {columns.map((column) => {
                          const value = getNestedValue(row, column.key);

                          return (
                            <td
                              key={column.key}
                              className={cn(
                                'px-4 py-3.5 align-middle text-foreground',
                                column.align === 'center' && 'text-center',
                                column.align === 'right' && 'text-right',
                                column.hideOnMobile && 'hidden lg:table-cell',
                                column.className,
                              )}
                            >
                              {column.render
                                ? column.render(row, index)
                                : value === null || value === undefined || value === ''
                                  ? '—'
                                  : String(value)}
                            </td>
                          );
                        })}
                        {rowActions && (
                          <td
                            className="px-4 py-3.5 text-right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {rowActions(row)}
                          </td>
                        )}
                      </tr>
                    );
                  })}</tbody>
          </table>
        </div>
      )}

      {!loading && !error && sortedData.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {emptyIcon ?? <Inbox className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
          {emptyAction}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Unable to load data</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {pagination && !error && (
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {pagination.total === 0
              ? 'No results'
              : `Showing ${firstRowIndex}–${lastRowIndex} of ${pagination.total}`}
          </p>

          <div className="flex items-center gap-3">
            {pagination.onPageSizeChange && (
              <div className="w-[7rem]">
                <Select
                  aria-label="Rows per page"
                  value={String(pagination.pageSize)}
                  onChange={(event) =>
                    pagination.onPageSizeChange?.(Number(event.target.value))
                  }
                  options={(pagination.pageSizeOptions ?? [10, 25, 50, 100]).map((size) => ({
                    value: String(size),
                    label: `${size} / page`,
                  }))}
                  className="h-8 text-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Previous page"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[4.5rem] text-center text-xs font-medium text-muted-foreground">
                {pagination.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Next page"
                disabled={pagination.page >= totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;