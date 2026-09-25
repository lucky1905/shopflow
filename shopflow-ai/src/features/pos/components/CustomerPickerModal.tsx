import { useMemo, useState } from 'react';
import { UserPlus, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { useDebouncedValue, useToast } from '@/hooks';
import { cn } from '@/lib/utils';
import { formatCurrency, getInitials } from '@/utils/format';
import { posCustomerFormSchema } from '../schemas';
import { WALK_IN_CUSTOMER, useCartStore } from '../hooks';
import { useCreatePosCustomer, usePosCustomerList } from '../api';

export interface CustomerPickerModalProps {
  open: boolean;
  onClose: () => void;
}

const TIER_BADGE = {
  bronze: 'outline',
  silver: 'info',
  gold: 'warning',
} as const;

/** Attach a customer (or create one on the fly) to the current sale. */
export function CustomerPickerModal({ open, onClose }: CustomerPickerModalProps) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  const setCustomer = useCartStore((state) => state.setCustomer);
  const customerId = useCartStore((state) => state.customerId);

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePosCustomerList(debouncedSearch);
  const createCustomer = useCreatePosCustomer();

  // Reset the local form when the dialog closes (adjust-state-during-render).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setSearch('');
      setShowCreate(false);
      setForm({ name: '', phone: '', email: '' });
      setFormErrors({});
    }
  }

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  const selectWalkIn = (): void => {
    setCustomer(null, WALK_IN_CUSTOMER);
    onClose();
  };

  const handleCreate = (): void => {
    const parsed = posCustomerFormSchema.safeParse(form);
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setFormErrors({
        name: issues.name?.[0],
        phone: issues.phone?.[0],
        email: issues.email?.[0],
      });
      return;
    }
    setFormErrors({});
    createCustomer.mutate(parsed.data, {
      onSuccess: (customer) => {
        setCustomer(customer.id, customer.name);
        toast.success(`${customer.name} added to the sale.`);
        onClose();
      },
      onError: (createError) => toast.fromError(createError),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Select customer"
      description="Attach loyalty, history and credit to this sale."
      icon={<UserRound className="h-4 w-4" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {showCreate ? (
            <Button
              variant="default"
              onClick={handleCreate}
              isLoading={createCustomer.isPending}
            >
              Create & attach
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => setShowCreate(true)}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              New customer
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {!showCreate && (
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone or email…"
              autoComplete="off"
            />

            <button
              type="button"
              onClick={selectWalkIn}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                customerId === null
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-accent/50',
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                WI
              </span>
              <span className="text-sm font-medium text-foreground">{WALK_IN_CUSTOMER}</span>
            </button>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : isError ? (
                <ErrorState
                  compact
                  message={error instanceof Error ? error.message : undefined}
                  onRetry={() => void refetch()}
                />
              ) : sortedCustomers.length === 0 ? (
                <EmptyState
                  compact
                  title="No customers found"
                  description="Try a different search or create a new customer."
                />
              ) : (
                sortedCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setCustomer(customer.id, customer.name);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      customerId === customer.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent/50',
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(customer.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {customer.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {customer.phone || customer.email} · {customer.loyaltyPoints} pts
                      </span>
                    </span>
                    <Badge variant={TIER_BADGE[customer.tier]} size="sm">
                      {customer.tier}
                    </Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {showCreate && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              ← Back to search
            </Button>
            <Input
              label="Full name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              error={formErrors.name}
              placeholder="Jane Doe"
              autoFocus
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                error={formErrors.phone}
                placeholder="+1 (555) 000-0000"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                error={formErrors.email}
                placeholder="jane@example.com"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default CustomerPickerModal;