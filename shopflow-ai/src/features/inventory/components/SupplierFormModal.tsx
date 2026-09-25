import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { supplierFormSchema, type SupplierFormValues } from '../schemas';
import type { Supplier } from '../types';

export interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  supplier?: Supplier | null;
  /** Persists the supplier. Reject with a message to surface it in the form. */
  onSubmit: (values: SupplierFormValues) => Promise<void>;
}

const FORM_ID = 'supplier-form';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function toFormValues(supplier?: Supplier | null): SupplierFormValues {
  if (!supplier) {
    return {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      leadTimeDays: '3',
      status: 'active',
      notes: '',
    };
  }
  return {
    name: supplier.name,
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    leadTimeDays: String(supplier.leadTimeDays),
    status: supplier.status,
    notes: supplier.notes,
  };
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while saving. Please try again.';
}

/** Create / edit a vendor with contact and lead-time details. */
export function SupplierFormModal({
  open,
  onClose,
  mode,
  supplier,
  onSubmit,
}: SupplierFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: toFormValues(supplier),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Truck className="h-4 w-4" />}
      title={isEdit ? `Edit ${supplier?.name ?? 'supplier'}` : 'New supplier'}
      description="Vendors power purchase orders, lead-time estimates and restock suggestions."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create supplier'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
          >
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Supplier name"
              placeholder="e.g. FreshLine Foods"
              autoFocus
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
          <Input
            label="Contact person"
            placeholder="e.g. Aisha Bello"
            error={errors.contactName?.message}
            {...register('contactName')}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 (555) 014-2210"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="orders@supplier.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Lead time (days)"
            inputMode="numeric"
            placeholder="3"
            hint="Typical days between order and delivery."
            error={errors.leadTimeDays?.message}
            {...register('leadTimeDays')}
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              placeholder="88 Harbor Rd, Springfield"
              error={errors.address?.message}
              {...register('address')}
            />
          </div>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
          <div className="sm:col-span-2">
            <Input
              label="Notes"
              placeholder="Delivery windows, pricing tiers, contacts…"
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default SupplierFormModal;
