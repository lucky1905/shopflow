import { PageContainer } from '@/components/layout/PageContainer';
import { formatCurrency } from '@/utils/format';
import {
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
  RevenueChannelChart,
  RevenuePaymentMethodChart,
  ReportRevenueTrendChart,
} from '../components';
import { useRevenueAnalytics } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';

export function RevenueAnalyticsPage() {
  const filters = useReportsFiltersStore();
  const analytics = useRevenueAnalytics(filters);

  const handleExportCsv = () => {
    if (!analytics.data?.trend) return;
    exportToCSV('shopflow-revenue-trend', analytics.data.trend, [
      { key: 'date', header: 'Date' },
      { key: 'label', header: 'Label' },
      { key: 'grossRevenue', header: 'Gross Revenue ($)', format: (v) => formatCurrency(v as number) },
      { key: 'netRevenue', header: 'Net Revenue ($)', format: (v) => formatCurrency(v as number) },
      { key: 'discounts', header: 'Discounts ($)', format: (v) => formatCurrency(v as number) },
      { key: 'returns', header: 'Returns ($)', format: (v) => formatCurrency(v as number) },
    ]);
  };

  const printableContent = (
    <div className="space-y-6 text-sm">
      <h3 className="font-bold text-base">Revenue & Cash Flow Breakdown</h3>
      <table className="w-full text-left border-collapse border border-border">
        <thead>
          <tr className="bg-muted text-xs">
            <th className="p-2 border">Date</th>
            <th className="p-2 border text-right">Gross Revenue</th>
            <th className="p-2 border text-right">Discounts</th>
            <th className="p-2 border text-right">Returns</th>
            <th className="p-2 border text-right">Net Revenue</th>
          </tr>
        </thead>
        <tbody>
          {(analytics.data?.trend ?? []).map((t) => (
            <tr key={t.date} className="border-b">
              <td className="p-2 border">{t.label}</td>
              <td className="p-2 border text-right">{formatCurrency(t.grossRevenue)}</td>
              <td className="p-2 border text-right text-rose-500">-{formatCurrency(t.discounts)}</td>
              <td className="p-2 border text-right text-amber-500">-{formatCurrency(t.returns)}</td>
              <td className="p-2 border text-right font-semibold">{formatCurrency(t.netRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Revenue & Margins Analytics"
        description="Track gross turnover, deductions, net cash flow and channel-wise payment tender contributions."
        actions={
          <ReportExportActions
            reportTitle="Revenue & Tender Report"
            onExportCsv={handleExportCsv}
            printableContent={printableContent}
          />
        }
      />

      <ReportsFilterBar showChannelFilter showCategoryFilter={false} />

      <ReportRevenueTrendChart
        data={analytics.data?.trend ?? []}
        isLoading={analytics.isLoading}
        error={analytics.error instanceof Error ? analytics.error.message : null}
        onRetry={() => void analytics.refetch()}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mt-6">
        <RevenueChannelChart
          data={analytics.data?.channels ?? []}
          isLoading={analytics.isLoading}
          error={analytics.error instanceof Error ? analytics.error.message : null}
          onRetry={() => void analytics.refetch()}
        />
        <RevenuePaymentMethodChart
          data={analytics.data?.paymentMethods ?? []}
          isLoading={analytics.isLoading}
          error={analytics.error instanceof Error ? analytics.error.message : null}
          onRetry={() => void analytics.refetch()}
        />
      </div>
    </PageContainer>
  );
}

export default RevenueAnalyticsPage;
