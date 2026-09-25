import type { ReactNode } from 'react';
import { History, Keyboard, ScanLine, Timer, Zap } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatNumber } from '@/utils/format';
import { POS_SHORTCUTS } from '../constants';
import { useHeldCarts, usePosSummary } from '../api';

export interface PosHeaderProps {
  onOpenHolds: () => void;
  onOpenHistory: () => void;
  /** True when the speed-first Express Billing surface is active. */
  expressMode?: boolean;
  onToggleExpress?: () => void;
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
      <span className="text-primary">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

/** POS page header: title, till stats, held-carts / history actions, shortcuts. */
export function PosHeader({ onOpenHolds, onOpenHistory, expressMode, onToggleExpress }: PosHeaderProps) {
  const { data: summary } = usePosSummary();
  const { data: heldCarts = [] } = useHeldCarts();

  const shortcutsHint = POS_SHORTCUTS.map((shortcut) => shortcut.keys).join(' Â· ');

  return (
    <PageHeader
      icon={<ScanLine className="h-6 w-6" />}
      title="Point of Sale"
      description={
        expressMode
          ? 'Express Billing — scan, add, take payment in three taps.'
          : 'Split-screen smart checkout with holds, returns and receipts.'
      }
      actions={
        <>
          {onToggleExpress && (
            <Button
              variant={expressMode ? 'primary' : 'outline'}
              size="sm"
              onClick={onToggleExpress}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              {expressMode ? 'Express mode' : 'Standard mode'}
            </Button>
          )}
          <StatPill
            label="Sales"
            value={formatNumber(summary?.salesCount ?? 0)}
            icon={<History className="h-3.5 w-3.5" />}
          />
          <StatPill
            label="Revenue"
            value={formatCurrency(summary?.revenue ?? 0)}
            icon={<Timer className="h-3.5 w-3.5" />}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHolds}
            leftIcon={<Timer className="h-3.5 w-3.5" />}
          >
            Held carts
            {heldCarts.length > 0 && (
              <Badge variant="warning" size="sm" className="ml-1">
                {heldCarts.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            leftIcon={<History className="h-3.5 w-3.5" />}
          >
            History
          </Button>
        </>
      }
    >
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" />
        Shortcuts: <span className="font-medium text-foreground">{shortcutsHint}</span>
      </p>
    </PageHeader>
  );
}

export default PosHeader;
