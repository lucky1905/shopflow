import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Clock, Mail, Pencil, Phone, Plus, Trash, Truck, Wallet } from 'lucide-react';
import { ROUTES } from '@/constants';
import { formatCurrency, formatNumber } from '@/utils/format';
import { Badge } from '@/components/common/Badge';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/hooks';
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from '../api';
import { InventoryHeader } from '../components/InventoryHeader';
import { MiniStats } from '../components/MiniStats';
import { RowActionsMenu } from '../components/RowActionsMenu';
import { SupplierFormModal } from '../components/SupplierFormModal';
import type { SupplierFormValues } from '../schemas';
import type { SupplierWithCount } from '../types';

function toErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/** Vendor directory with search, lead times and inline CRUD. */
export function SuppliersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const suppliersQuery = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{
    open: boolean;
    supplier: SupplierWithCount | null;
    instance: number;
  }>({ open: false, supplier: null, instance: 0 });
  const [deleteTarget, setDeleteTarget] = useState<SupplierWithCount | null>(null);

  const suppliers = useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return suppliers;
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.contactName, supplier.email, supplier.phone, supplier.address]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [suppliers, search]);

  const totals = useMemo(
    () =>
      suppliers.reduce(
        (acc, supplier) => ({
          products: acc.products + supplier.productCount,
          value: acc.value + supplier.value,
        }),
        { products: 0, value: 0 },
      ),
    [suppliers],
  );

  const openCreate = () =>
    setForm((previous) => ({ open: true, supplier: null, instance: previous.instance + 1 }));
  const openEdit = (supplier: SupplierWithCount) =>
    setForm((previous) => ({ open: true, supplier, instance: previous.instance + 1 }));
  const closeForm = () => setForm((previous) => ({ ...previous, open: false }));

  const handleSubmit = async (values: SupplierFormValues) => {
    const payload = { ...values, leadTimeDays: Number(values.leadTimeDays) };
    try {
      if (form.supplier) {
        await updateSupplier.mutateAsync({ id: form.supplier.id, input: payload });
        toast.success(`${values.name} updated`);
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success(`${values.name} added`);
      }
    } catch (error) {
      throw new Error(toErrorMessage(error), { cause: error });
    }
    closeForm();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupplier.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
    } catch (error) {
      toast.fromError(error);
    }
    setDeleteTarget(null);
  };

  const columns: DataTableColumn<SupplierWithCount>[] = [
    {
      key: 'name',
      header: 'Supplier',
      render: (supplier) => (
        <div className="min-w-[12rem]">
          <p className="text-[13px] font-semibold">{supplier.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {supplier.contactName || 'No contact person'}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      hideOnMobile: true,
      render: (supplier) => (
        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          {supplier.email && (
            <p className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              {supplier.email}
            </p>
          )}
          {supplier.phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              {supplier.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'leadTimeDays',
      header: 'Lead time',
      hideOnMobile: true,
      render: (supplier) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] tabular-nums">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {supplier.leadTimeDays} day{supplier.leadTimeDays === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      key: 'productCount',
      header: 'Products',
      align: 'right',
      render: (supplier) => (
        <span className="text-[13px] font-bold tabular-nums">{supplier.productCount}</span>
      ),
    },
    {
      key: 'value',
      header: 'Stock value',
      align: 'right',
      hideOnMobile: true,
      render: (supplier) => (
        <span className="text-[13px] tabular-nums">{formatCurrency(supplier.value)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (supplier) => (
        <Badge variant={supplier.status === 'active' ? 'success' : 'outline'} size="sm">
          {supplier.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (supplier) => (
        <RowActionsMenu
          actions={[
            { label: 'Edit supplier', icon: Pencil, onSelect: () => openEdit(supplier) },
            {
              label: 'Delete supplier',
              icon: Trash,
              onSelect: () => setDeleteTarget(supplier),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <InventoryHeader
        icon={<Truck className="h-6 w-6" />}
        title="Suppliers"
        description="Vendor directory with lead times, contact details and stock coverage."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.INVENTORY)}
              leftIcon={<Boxes className="h-3.5 w-3.5" />}
            >
              Back to inventory
            </Button>
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              New supplier
            </Button>
          </>
        }
      />

      <MiniStats
        items={[
          {
            label: 'Suppliers',
            value: formatNumber(suppliers.length),
            hint: `${suppliers.filter((supplier) => supplier.status === 'active').length} active`,
            icon: <Truck className="h-4 w-4" />,
          },
          {
            label: 'Products sourced',
            value: formatNumber(totals.products),
            hint: 'Linked to a supplier',
            icon: <Boxes className="h-4 w-4" />,
          },
          {
            label: 'Average lead time',
            value: suppliers.length
              ? `${(suppliers.reduce((sum, supplier) => sum + supplier.leadTimeDays, 0) / suppliers.length).toFixed(1)} days`
              : '—',
            hint: 'Order to delivery',
            icon: <Clock className="h-4 w-4" />,
          },
          {
            label: 'Stock value',
            value: formatCurrency(totals.value),
            hint: 'Retail value of stock sourced',
            icon: <Wallet className="h-4 w-4" />,
          },
        ]}
      />

      {suppliersQuery.isError && suppliers.length === 0 ? (
        <ErrorState
          title="Could not load suppliers"
          message={toErrorMessage(suppliersQuery.error)}
          onRetry={() => void suppliersQuery.refetch()}
          className="rounded-2xl border border-black/[0.06] bg-card/85 backdrop-blur-xl dark:border-white/[0.07]"
        />
      ) : suppliers.length === 0 && !suppliersQuery.isLoading ? (
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="No suppliers yet"
          description="Add a vendor to track lead times and link products to their source."
          action={
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add your first supplier
            </Button>
          }
          className="rounded-2xl border border-black/[0.06] bg-card/85 backdrop-blur-xl dark:border-white/[0.07]"
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={suppliersQuery.isLoading}
          rowKey={(supplier) => supplier.id}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search suppliers, contacts or emails…',
          }}
          toolbarActions={
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              New supplier
            </Button>
          }
          emptyIcon={<Truck className="h-6 w-6" />}
          emptyTitle="No suppliers match your search"
          emptyDescription="Try a different name, contact, email or address."
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      )}

      <SupplierFormModal
        key={form.instance}
        open={form.open}
        onClose={closeForm}
        mode={form.supplier ? 'edit' : 'create'}
        supplier={form.supplier}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        tone="danger"
        title={`Delete ${deleteTarget?.name ?? 'supplier'}?`}
        description={
          deleteTarget && deleteTarget.productCount > 0
            ? `${deleteTarget.productCount} product(s) will be left unassigned — you can re-link them at any time.`
            : 'This supplier will be removed permanently.'
        }
        confirmLabel="Delete supplier"
        isLoading={deleteSupplier.isPending}
      />
    </PageContainer>
  );
}

export default SuppliersPage;
