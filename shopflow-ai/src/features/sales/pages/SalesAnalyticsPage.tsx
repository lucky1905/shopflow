import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  ChannelMixChart,
  RevenueTrendChart,
  SalesHeader,
  SalesStatsGrid,
  TopProductsChart,
} from '../components';
import { useChannelSplit, useSalesDashboard, useSalesTrend, useTopProducts } from '../api';
import { DATE_RANGE_PRESETS } from '../constants';
import type { SalesDateRange } from '../types';

/** Deep-dive analytics: configurable trend + channel / product breakdowns. */
export function SalesAnalyticsPage() {
  const [range, setRange] = useState<SalesDateRange>('30d');

  const stats = useSalesDashboard();
  const trend = useSalesTrend(range);
  const channels = useChannelSplit(range);
  const topProducts = useTopProducts(range);

  const rangeSwitch = (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      {DATE_RANGE_PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => setRange(preset.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
            range === preset.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <SalesHeader
        title="Sales analytics"
        description="Revenue trends, channel performance and best sellers."
      />

      <SalesStatsGrid stats={stats.data} isLoading={stats.isLoading} />

      <RevenueTrendChart
        data={trend.data ?? []}
        isLoading={trend.isLoading}
        error={trend.error instanceof Error ? trend.error.message : null}
        onRetry={() => void trend.refetch()}
        action={rangeSwitch}
        height={320}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChannelMixChart
          data={channels.data ?? []}
          isLoading={channels.isLoading}
          error={channels.error instanceof Error ? channels.error.message : null}
          onRetry={() => void channels.refetch()}
        />
        <TopProductsChart
          data={topProducts.data ?? []}
          isLoading={topProducts.isLoading}
          error={topProducts.error instanceof Error ? topProducts.error.message : null}
          onRetry={() => void topProducts.refetch()}
        />
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="h-3.5 w-3.5" />
        Charts update with the selected range · data served from the mock API (Phase 4).
      </p>
    </PageContainer>
  );
}

export default SalesAnalyticsPage;