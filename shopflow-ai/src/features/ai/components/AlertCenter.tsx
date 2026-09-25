import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, Check, Sparkles } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useAIWorkspaceStore } from '../hooks/useAIWorkspaceStore';
import { SEVERITY_META, sortedAlerts } from '../utils';
import { AlertTypeIcon } from './primitives';
import type { BusinessAlert } from '../types';

export interface AlertCenterProps {
  alerts?: BusinessAlert[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Low-stock and business alerts. Acknowledged alerts collapse into a muted
 * "cleared" list so the panel always shows what still needs attention.
 */
export function AlertCenter({ alerts, isLoading, error, onRetry, className }: AlertCenterProps) {
  const acknowledged = useAIWorkspaceStore((state) => state.acknowledgedAlerts);
  const acknowledgeAlert = useAIWorkspaceStore((state) => state.acknowledgeAlert);
  const unacknowledgeAlert = useAIWorkspaceStore((state) => state.unacknowledgeAlert);

  const rows = alerts ? sortedAlerts(alerts) : [];
  const open = rows.filter((row) => !acknowledged.includes(row.id));
  const cleared = rows.filter((row) => acknowledged.includes(row.id));
  const isEmpty = !isLoading && !error && rows.length === 0;

  return (
    <SectionCard
      title="Alerts"
      description="Stock, revenue, customer and margin signals that need a decision."
      icon={<BellRing className="h-4 w-4" />}
      className={className}
      action={
        open.length > 0 ? (
          <Badge variant="danger" size="sm" dot>
            {open.length} open
          </Badge>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState
          title="Alerts unavailable"
          message="We could not load your alerts right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !alerts ? (
        <LoadingSkeleton variant="list" rows={3} />
      ) : isEmpty ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="No alerts"
          description="Nothing needs your attention. We monitor stock, margin and churn continuously."
          compact
        />
      ) : (
        <div className="space-y-4">
          {open.length === 0 ? (
            <EmptyState
              icon={<Check className="h-5 w-5" />}
              title="All clear"
              description={`${cleared.length} alert${
                cleared.length === 1 ? '' : 's'
              } acknowledged. Nothing else needs attention.`}
              compact
            />
          ) : (
            <ul className="space-y-2.5">
              {open.map((alert, index) => (
                <AlertRow key={alert.id} alert={alert} index={index} onAcknowledge={acknowledgeAlert} />
              ))}
            </ul>
          )}

          <AnimatePresence initial={false}>
            {cleared.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ClearedList alerts={cleared} onRestore={unacknowledgeAlert} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </SectionCard>
  );
}

function AlertRow({
  alert,
  index,
  onAcknowledge,
}: {
  alert: BusinessAlert;
  index: number;
  onAcknowledge: (id: string) => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.22 }}
      className={cn(
        'rounded-xl border-l-2 border border-border bg-card p-3.5',
        alert.severity === 'high' && 'border-l-destructive',
        alert.severity === 'medium' && 'border-l-warning',
        alert.severity === 'low' && 'border-l-highlight',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTypeIcon type={alert.type} className="shrink-0 text-muted-foreground" />
          <h3 className="truncate text-sm font-semibold text-foreground">{alert.title}</h3>
        </div>
        <Badge variant={SEVERITY_META[alert.severity].variant} size="sm" dot>
          {SEVERITY_META[alert.severity].label}
        </Badge>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{alert.message}</p>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {alert.metric && <span className="font-medium text-foreground">{alert.metric} &middot; </span>}
          {formatRelativeTime(alert.createdAt)}
        </span>
        <Button size="sm" variant="ghost" onClick={() => onAcknowledge(alert.id)}>
          Acknowledge
        </Button>
      </div>
    </motion.li>
  );
}

function ClearedList({ alerts, onRestore }: { alerts: BusinessAlert[]; onRestore: (id: string) => void }) {
  return (
    <>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Acknowledged</p>
      <ul className="space-y-1.5">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
            <span className="min-w-0 flex-1 truncate text-muted-foreground line-through">{alert.title}</span>
            <button type="button" onClick={() => onRestore(alert.id)} className="shrink-0 font-medium text-primary hover:underline">
              Restore
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
