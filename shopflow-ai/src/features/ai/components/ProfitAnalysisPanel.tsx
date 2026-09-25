import { motion } from 'framer-motion';
import { Lightbulb, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { MetricTile } from './primitives';
import type { ProfitAnalysis } from '../types';

export interface ProfitAnalysisPanelProps {
  profit?: ProfitAnalysis;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

const compactMoney = (value: number) =>
  formatCurrency(value, 'USD', { notation: 'compact', maximumFractionDigits: 0 });

/** Profit Analysis â€” headline P&L plus the ranked drivers behind the number. */
export function ProfitAnalysisPanel({
  profit,
  isLoading,
  error,
  onRetry,
  className,
}: ProfitAnalysisPanelProps) {
  if (error) {
    return (
      <SectionCard title="Profit analysis" className={className}>
        <ErrorState
          title="Profit analysis unavailable"
          message="We could not compute your profit drivers right now."
          onRetry={onRetry}
          compact
        />
      </SectionCard>
    );
  }

  if (isLoading || !profit) {
    return (
      <SectionCard title="Profit analysis" className={className}>
        <LoadingSkeleton variant="card" />
      </SectionCard>
    );
  }

  const chartData = profit.drivers.map((driver) => ({
    label: driver.label.length > 18 ? `${driver.label.slice(0, 17)}â€¦` : driver.label,
    impact: driver.impact,
  }));

  return (
    <SectionCard
      title="Profit analysis"
      description="What moved profit this period, ranked by dollar impact."
      icon={<Wallet className="h-4 w-4" />}
      className={className}
      action={
        <Badge variant="info" size="sm">
          {formatCurrency(profit.opportunity)} opportunity
        </Badge>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile label="Gross revenue" value={formatCurrency(profit.grossRevenue)} />
          <MetricTile label="Net profit" value={formatCurrency(profit.netProfit)} tone="positive" />
          <MetricTile label="Net margin" value={`${profit.profitMargin.toFixed(1)}%`} tone="warning" />
          <MetricTile label="Projected" value={formatCurrency(profit.projectedProfit)} tone="positive" />
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={58}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={compactMoney}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12,
                }}
                formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), 'Impact']}
              />
              <Bar dataKey="impact" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.impact >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <DriverList profit={profit} />
        <ProfitFooter summary={profit.summary} onRetry={onRetry} />
      </div>
    </SectionCard>
  );
}


function DriverList({ profit }: { profit: ProfitAnalysis }) {
  return (
    <ul className="space-y-2">
      {profit.drivers.map((driver, index) => (
        <motion.li
          key={driver.label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              {driver.impact >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              {driver.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{driver.detail}</p>
          </div>
          <p
            className={cn(
              'shrink-0 text-sm font-semibold tabular-nums',
              driver.impact >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {driver.impact > 0 ? '+' : ''}
            {formatCurrency(driver.impact)}
          </p>
        </motion.li>
      ))}
    </ul>
  );
}

function ProfitFooter({ summary, onRetry }: { summary: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        {summary}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0 self-start sm:self-auto">
          Recalculate
        </Button>
      )}
    </div>
  );
}

