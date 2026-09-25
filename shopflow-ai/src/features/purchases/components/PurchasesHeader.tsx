import type { ReactNode } from 'react';
import { ClipboardList } from 'lucide-react';
import { ROUTES } from '@/constants';
import { ModuleSubNav, PageHeader } from '@/components/common';

export interface PurchasesHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

const PURCHASE_TABS = [
  { to: ROUTES.PURCHASES, label: 'Dashboard', end: true },
  { to: ROUTES.PURCHASE_ORDERS, label: 'Purchase orders' },
  { to: ROUTES.PURCHASE_SUPPLIER_ORDERS, label: 'Supplier orders' },
  { to: ROUTES.PURCHASE_GRN, label: 'GRN' },
  { to: ROUTES.PURCHASE_DELIVERIES, label: 'Pending deliveries' },
  { to: ROUTES.PURCHASE_PAYMENTS, label: 'Supplier payments' },
  { to: ROUTES.PURCHASE_HISTORY, label: 'History' },
];

/** Shared page header for every Purchases screen with the module tab bar. */
export function PurchasesHeader({ title, description, actions }: PurchasesHeaderProps) {
  return (
    <PageHeader
      icon={<ClipboardList className="h-6 w-6" />}
      title={title}
      description={description}
      actions={actions}
    >
      <ModuleSubNav items={PURCHASE_TABS} />
    </PageHeader>
  );
}

export default PurchasesHeader;