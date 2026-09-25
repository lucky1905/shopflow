import { Badge } from '@/components/common/Badge';
import { PRODUCT_STATUS_META } from '../constants';
import type { ProductStatus } from '../types';

export interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

/** Lifecycle pill (Active / Draft / Archived) using the shared Badge system. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = PRODUCT_STATUS_META[status];
  return (
    <Badge variant={meta.badge} size="sm" className={className}>
      {meta.label}
    </Badge>
  );
}

export default StatusBadge;
