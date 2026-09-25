import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { ROUTES } from '@/constants';
import { ModuleSubNav, PageHeader } from '@/components/common';

export interface ReportsHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export const REPORTS_NAV_TABS = [
  { to: ROUTES.REPORTS, label: 'Overview', end: true },
  { to: ROUTES.REPORTS_REVENUE, label: 'Revenue' },
  { to: ROUTES.REPORTS_SALES, label: 'Sales' },
  { to: ROUTES.REPORTS_PURCHASES, label: 'Purchases' },
  { to: ROUTES.REPORTS_INVENTORY, label: 'Inventory' },
  { to: ROUTES.REPORTS_CUSTOMERS, label: 'Customers' },
  { to: ROUTES.REPORTS_SUPPLIERS, label: 'Suppliers' },
  { to: ROUTES.REPORTS_PROFIT_LOSS, label: 'P&L Statement' },
  { to: ROUTES.REPORTS_TAX, label: 'GST & Tax' },
];

export function ReportsHeader({ title, description, actions }: ReportsHeaderProps) {
  return (
    <PageHeader
      icon={<BarChart3 className="h-6 w-6" />}
      title={title}
      description={description}
      actions={actions}
    >
      <ModuleSubNav items={REPORTS_NAV_TABS} />
    </PageHeader>
  );
}

export default ReportsHeader;
