import { BrainCircuit, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { formatRelativeTime } from '@/utils/format';
import { useAIDashboard, useDemandForecast } from '../api/queries';
import { useAIWorkspaceStore } from '../hooks/useAIWorkspaceStore';
import {
  AIViewSwitcher,
  AlertCenter,
  CopilotPanel,
  CrossSellSuggestions,
  CustomerInsights,
  DemandForecastChart,
  HealthScoreCard,
  ProductInsights,
  ProfitAnalysisPanel,
  RestockRecommendations,
} from '../components';
import { confidencePct } from '../utils';
import type { AIDashboardData, AIView } from '../types';

/**
 * AI Insights workspace. A single dashboard payload feeds every view so tab
 * switching is instant; the forecast view refetches a sliced series whenever
 * the horizon changes.
 */
export function AIDashboardPage() {
  const activeView = useAIWorkspaceStore((state) => state.activeView);
  const forecastRange = useAIWorkspaceStore((state) => state.forecastRange);

  const dashboard = useAIDashboard();
  const forecast = useDemandForecast(forecastRange);

  const retry = () => {
    void dashboard.refetch();
    void forecast.refetch();
  };

  if (dashboard.isError) {
    return (
      <PageContainer>
        <PageHeader
          title="AI Insights"
          description="Demand forecasts, health scoring and smart recommendations."
          icon={<BrainCircuit className="h-5 w-5" />}
        />
        <ErrorState
          title="Insights unavailable"
          message={
            dashboard.error instanceof Error
              ? dashboard.error.message
              : 'We could not load your AI insights right now.'
          }
          onRetry={retry}
        />
      </PageContainer>
    );
  }

  const isLoading = dashboard.isLoading;
  const data = dashboard.data;
  const forecastProps = {
    forecast: forecast.data ?? data?.forecast,
    isLoading: forecast.isLoading,
    error: forecast.error,
    onRetry: () => void forecast.refetch(),
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Insights"
        description="Demand forecasts, health scoring and smart recommendations for your store."
        icon={<BrainCircuit className="h-5 w-5" />}
        actions={
          <>
            {data && (
              <Badge variant="outline" size="sm">
                {confidencePct(data.meta.confidence)} confidence &middot; updated{' '}
                {formatRelativeTime(data.meta.generatedAt)}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={retry}
              isLoading={dashboard.isFetching}
            >
              Refresh
            </Button>
          </>
        }
      >
        <AIViewSwitcher />
      </PageHeader>

      {isLoading || !data ? <LoadingSkeleton variant="page" /> : <AIViews view={activeView} data={data} forecastProps={forecastProps} />}
    </PageContainer>
  );
}


type ForecastProps = {
  forecast: AIDashboardData['forecast'] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
};

/** Per-view layouts. Copilot stays pinned in the right rail on every tab. */
function AIViews({
  view,
  data,
  forecastProps,
}: {
  view: AIView;
  data: AIDashboardData;
  forecastProps: ForecastProps;
}) {
  if (view === 'forecast') {
    return (
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DemandForecastChart {...forecastProps} />
          <RestockRecommendations recommendations={data.restockRecommendations} />
        </div>
        <div className="space-y-6">
          <CopilotPanel dashboard={data} />
          <AlertCenter alerts={data.alerts} />
        </div>
      </div>
    );
  }

  if (view === 'customers') {
    return (
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CustomerInsights customers={data.customers} />
        </div>
        <div className="space-y-6">
          <CopilotPanel dashboard={data} />
          <CrossSellSuggestions pairings={data.crossSell} />
        </div>
      </div>
    );
  }

  if (view === 'products') {
    return (
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProductInsights products={data.products} />
        </div>
        <div className="space-y-6">
          <CopilotPanel dashboard={data} />
          <CrossSellSuggestions pairings={data.crossSell} />
        </div>
      </div>
    );
  }

  if (view === 'profit') {
    return (
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ProfitAnalysisPanel profit={data.profit} />
          <CrossSellSuggestions pairings={data.crossSell} />
        </div>
        <div className="space-y-6">
          <CopilotPanel dashboard={data} />
          <HealthScoreCard health={data.health} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <HealthScoreCard health={data.health} />
        <DemandForecastChart {...forecastProps} />
        <RestockRecommendations recommendations={data.restockRecommendations} />
      </div>
      <div className="space-y-6">
        <CopilotPanel dashboard={data} />
        <AlertCenter alerts={data.alerts} />
        <CrossSellSuggestions pairings={data.crossSell} />
      </div>
    </div>
  );
}

export default AIDashboardPage;
