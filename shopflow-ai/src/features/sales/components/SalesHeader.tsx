import type { ReactNode } from 'react';
import { Receipt } from 'lucide-react';
import { ROUTES } from '@/constants';
import { ModuleSubNav, PageHeader } from '@/components/common';

export interface SalesHeaderProps {
  title: string;
  description: string;
  /** Right-side actions (primary last). */
  actions?: ReactNode;
}

const SALES_TABS = [
  { to: ROUTES.SALES, label: 'Dashboard', end: true },
  { to: ROUTES.SALES_HISTORY, label: 'History' },
  { to: ROUTES.SALES_RETURNS, label: 'Returns & refunds' },
  { to: ROUTES.SALES_ANALYTICS, label: 'Analytics' },
];

/** Shared page header for every Sales screen with the module tab bar. */
export function SalesHeader({ title, description, actions }: SalesHeaderProps) {
  return (
    <PageHeader
      icon={<Receipt className="h-6 w-6" />}
      title={title}
      description={description}
      actions={actions}
    >
      <ModuleSubNav items={SALES_TABS} />
    </PageHeader>
  );
}

export default SalesHeader;