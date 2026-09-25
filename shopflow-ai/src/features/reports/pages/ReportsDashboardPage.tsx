import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import {
  CategoryBreakdownChart,
  MonthlyPerformanceChart,
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
  ReportsOverviewStats,
} from '../components';
import {
  useCategoryBreakdown,
  useMonthlyPerformance,
  useReportsOverview,
} from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';

export function ReportsDashboardPage() {
  const navigate = useNavigate();
  const filters = useReportsFiltersStore();

  const overview = useReportsOverview(filters);
  const monthly = useMonthlyPerformance(filters);
  const categorySplit = useCategoryBreakdown(filters);

  const handleExportCsv = () => {
    if (!monthly.data) return;
    exportToCSV('shopflow-monthly-performance', monthly.data, [
      { key: 'month', header: 'Month' },
      { key: 'revenue', header: 'Revenue ($)', format: (v) => formatCurrency(v as number) },
      { key: 'expenses', header: 'Expenses ($)', format: (v) => formatCurrency(v as number) },
      { key: 'grossProfit', header: 'Gross Profit ($)', format: (v) => formatCurrency(v as number) },
      { key: 'netProfit', header: 'Net Profit ($)', format: (v) => formatCurrency(v as number) },
    ]);
  };

  const printableContent = (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold">{formatCurrency(overview.data?.totalRevenue)}</p>
        </div>
        <div className="p-3 border rounded">
          <p className="text-xs text-muted-foreground">Gross Profit</p>
          <p className="text-lg font-bold">{formatCurrency(overview.data?.grossProfit)}</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Monthly Breakdown</h4>
        <table className="w-full text-left border-collapse border border-border">
          <thead>
            <tr className="bg-muted text-xs">
              <th className="p-2 border">Month</th>
              <th className="p-2 border text-right">Revenue</th>
              <th className="p-2 border text-right">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {(monthly.data ?? []).map((m) => (
              <tr key={m.month} className="border-b">
                <td className="p-2 border">{m.month}</td>
                <td className="p-2 border text-right">{formatCurrency(m.revenue)}</td>
                <td className="p-2 border text-right">{formatCurrency(m.netProfit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Business Reports & Analytics"
        description="Comprehensive store financial insights, sales performance, inventory valuation and tax summaries."
        actions={
          <ReportExportActions
            reportTitle="Executive Overview Report"
            onExportCsv={handleExportCsv}
            printableContent={printableContent}
          />
        }
      />

      <ReportsFilterBar showChannelFilter showCategoryFilter />

      <ReportsOverviewStats stats={overview.data} isLoading={overview.isLoading} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MonthlyPerformanceChart
            data={monthly.data ?? []}
            isLoading={monthly.isLoading}
            error={monthly.error instanceof Error ? monthly.error.message : null}
            onRetry={() => void monthly.refetch()}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.REPORTS_PROFIT_LOSS)}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                P&L Statement
              </Button>
            }
          />
        </div>
        <CategoryBreakdownChart
          data={categorySplit.data ?? []}
          isLoading={categorySplit.isLoading}
          error={categorySplit.error instanceof Error ? categorySplit.error.message : null}
          onRetry={() => void categorySplit.refetch()}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        <SectionCard
          title="Revenue & Margins"
          description="Detailed breakdown of sales, channels and transaction methods."
        >
          <p className="text-xs text-muted-foreground mb-4">
            Analyze gross vs net collections, channel shifts and tender distribution.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.REPORTS_REVENUE)}
          >
            Open Revenue Analytics
          </Button>
        </SectionCard>

        <SectionCard
          title="Tax & GST Filings"
          description="Output GST, input tax credits (ITC), and ready-to-file returns."
        >
          <p className="text-xs text-muted-foreground mb-4">
            Audit tax collections by rate slabs (0%, 5%, 12%, 18%, 28%) and compute net liability.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.REPORTS_TAX)}
          >
            Open Tax Slabs & GST
          </Button>
        </SectionCard>

        <SectionCard
          title="Inventory Valuation"
          description="Stock asset worth, dead stock warnings, and turnover metrics."
        >
          <p className="text-xs text-muted-foreground mb-4">
            Track total cost basis versus retail potential across active catalog items.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.REPORTS_INVENTORY)}
          >
            Open Inventory Valuation
          </Button>
        </SectionCard>
      </div>
    </PageContainer>
  );
}

export default ReportsDashboardPage;
