import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { ForecastRangeSwitcher } from './AIViewSwitcher';
import { MetricTile } from './primitives';
import { confidencePct } from '../utils';
import type { DemandForecast } from '../types';

interface BandPoint {
  label: string;
  actual?: number;
  forecast?: number;
  band?: [number, number];
}

const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const compact = (value: number) =>
  formatCurrency(value, 'USD', { notation: 'compact', maximumFractionDigits: 0 });

function toBandPoints(forecast: DemandForecast): BandPoint[] {
  return forecast.points.map((point) => ({
    label: point.label,
    actual: point.actual,
    forecast: point.forecast,
    band: point.lower !== undefined && point.upper !== undefined ? [point.lower, point.upper] : undefined,
  }));
}

export interface DemandForecastChartProps {
  forecast?: DemandForecast;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Demand forecast: history joined to a projection with a confidence band. */
export function DemandForecastChart({
  forecast,
  isLoading,
  error,
  onRetry,
  className,
}: DemandForecastChartProps) {
  const data = forecast ? toBandPoints(forecast) : [];
  const isEmpty = !isLoading && !error && data.length === 0;
  const splitIndex = data.findIndex((point) => point.forecast !== undefined);

  return (
    <SectionCard
      title="Demand forecast"
      description="Projected daily revenue with a confidence band, trained on the last 150 days."
      icon={<LineChartIcon className="h-4 w-4" />}
      className={className}
      action={<ForecastRangeSwitcher />}
    >
      {error ? (
        <ErrorState
          title="Forecast unavailable"
          message="We could not generate a demand projection right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !forecast ? (
        <LoadingSkeleton variant="card" />
      ) : isEmpty ? (
        <EmptyState
          title="Not enough sales history"
          description="The model needs at least 30 days of transactions before it can forecast demand."
          compact
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile label="Next 7 days" value={formatCurrency(forecast.next7DaysRevenue)} hint="projected revenue" />
            <MetricTile
              label="Expected growth"
              value={percent(forecast.expectedGrowth)}
              hint="vs. current run rate"
              tone={forecast.expectedGrowth >= 0 ? 'positive' : 'danger'}
            />
            <MetricTile label="Peak day" value={forecast.peakDay} hint="highest predicted day" />
            <MetricTile label="Confidence" value={confidencePct(forecast.confidence)} hint="model confidence" />
          </div>

          <ForecastAreaChart data={data} splitIndex={splitIndex} summary={forecast.summary} onRetry={onRetry} />
        </div>
      )}
    </SectionCard>
  );
}

/** Chart body split out to keep the card component readable. */
function ForecastAreaChart({
  data,
  splitIndex,
  summary,
  onRetry,
}: {
  data: BandPoint[];
  splitIndex: number;
  summary: string;
  onRetry?: () => void;
}) {
  return (
    <>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ai-actual-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ai-forecast-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--highlight))" stopOpacity={0.24} />
                <stop offset="100%" stopColor="hsl(var(--highlight))" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickLine={false} axisLine={false} width={62} tickFormatter={compact} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', fontSize: 12 }}
              formatter={(value, name) => [
                formatCurrency(Number(value ?? 0)),
                name === 'actual' ? 'Actual' : name === 'forecast' ? 'Forecast' : 'Confidence',
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            {splitIndex > 0 && (
              <ReferenceLine
                x={data[splitIndex]?.label}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{ value: 'today', position: 'top', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
            )}
            <Area type="monotone" dataKey="band" name="Confidence" stroke="none" fill="hsl(var(--highlight))" fillOpacity={0.12} connectNulls />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ai-actual-fill)" connectNulls />
            <Area type="monotone" dataKey="forecast" name="Forecast" stroke="hsl(var(--highlight))" strokeWidth={2} strokeDasharray="5 4" fill="url(#ai-forecast-fill)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {summary}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 self-start sm:self-auto">
            Regenerate
          </Button>
        )}
      </div>
    </>
  );
}

