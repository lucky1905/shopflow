import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { formatCurrency, formatPercent } from '@/utils/format';
import {
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { useProfitLossReport } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import { DollarSign, TrendingDown, TrendingUp, Percent } from 'lucide-react';

export function ProfitLossReportPage() {
  const filters = useReportsFiltersStore();
  const pl = useProfitLossReport(filters);
  const data = pl.data;

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      { section: 'Revenue', lineItem: 'Gross Sales', amount: data.grossSales },
      { section: 'Revenue', lineItem: 'Discounts & Allowances', amount: -data.discountsAndAllowances },
      { section: 'Revenue', lineItem: 'Net Sales', amount: data.netSales },
      { section: 'COGS', lineItem: 'Beginning Inventory', amount: data.cogs.beginningInventory },
      { section: 'COGS', lineItem: 'Purchases', amount: data.cogs.purchases },
      { section: 'COGS', lineItem: 'Labor & Freight', amount: data.cogs.directLaborAndFreight },
      { section: 'COGS', lineItem: 'Ending Inventory', amount: -data.cogs.endingInventory },
      { section: 'COGS', lineItem: 'Total COGS', amount: data.cogs.totalCogs },
      { section: 'Gross Profit', lineItem: 'Gross Profit', amount: data.grossProfit },
      { section: 'Operating Expenses', lineItem: 'Rent & Utilities', amount: data.operatingExpenses.rentAndUtilities },
      { section: 'Operating Expenses', lineItem: 'Salaries & Wages', amount: data.operatingExpenses.salariesAndWages },
      { section: 'Operating Expenses', lineItem: 'Marketing & Advertising', amount: data.operatingExpenses.marketingAndAdvertising },
      { section: 'Operating Expenses', lineItem: 'Software & POS Fees', amount: data.operatingExpenses.softwareAndPosFees },
      { section: 'Operating Expenses', lineItem: 'Shipping & Logistics', amount: data.operatingExpenses.shippingAndLogistics },
      { section: 'Operating Expenses', lineItem: 'Miscellaneous', amount: data.operatingExpenses.miscellaneous },
      { section: 'Operating Expenses', lineItem: 'Total Opex', amount: data.operatingExpenses.totalOperatingExpenses },
      { section: 'Net Profit', lineItem: 'Operating Income', amount: data.operatingIncome },
      { section: 'Net Profit', lineItem: 'Depreciation & Taxes', amount: data.depreciationAndTaxes },
      { section: 'Net Profit', lineItem: 'Net Profit', amount: data.netProfit },
    ];
    exportToCSV('profit-and-loss-statement', rows, [
      { key: 'section', header: 'Section' },
      { key: 'lineItem', header: 'Line Item' },
      { key: 'amount', header: 'Amount ($)', format: (v) => formatCurrency(v as number) },
    ]);
  };

  const printableContent = (
    <div className="space-y-4 text-sm">
      <h3 className="font-bold text-base">Statement of Profit & Loss</h3>
      <table className="w-full border-collapse border border-border">
        <tbody>
          <tr className="bg-muted font-semibold">
            <td className="p-2 border">1. Net Sales Turnover</td>
            <td className="p-2 border text-right">{formatCurrency(data?.netSales)}</td>
          </tr>
          <tr className="bg-muted font-semibold">
            <td className="p-2 border">2. Cost of Goods Sold (COGS)</td>
            <td className="p-2 border text-right text-rose-500">-{formatCurrency(data?.cogs.totalCogs)}</td>
          </tr>
          <tr className="font-bold bg-primary/5">
            <td className="p-2 border">Gross Profit</td>
            <td className="p-2 border text-right">{formatCurrency(data?.grossProfit)}</td>
          </tr>
          <tr className="bg-muted font-semibold">
            <td className="p-2 border">3. Operating Expenses</td>
            <td className="p-2 border text-right text-rose-500">-{formatCurrency(data?.operatingExpenses.totalOperatingExpenses)}</td>
          </tr>
          <tr className="font-bold bg-primary/10">
            <td className="p-2 border">Operating Income</td>
            <td className="p-2 border text-right">{formatCurrency(data?.operatingIncome)}</td>
          </tr>
          <tr className="font-extrabold bg-primary/20 text-base">
            <td className="p-2 border">Net Profit</td>
            <td className="p-2 border text-right">{formatCurrency(data?.netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Profit & Loss Statement (P&L)"
        description="Structured income statement with revenue recognition, cost of goods, opex, and net operating margin."
        actions={
          <ReportExportActions
            reportTitle="P&L Income Statement"
            onExportCsv={handleExportCsv}
            printableContent={printableContent}
          />
        }
      />

      <ReportsFilterBar showChannelFilter showCategoryFilter={false} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Gross Revenue"
          value={formatCurrency(data?.grossSales ?? 0)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(data?.grossProfit ?? 0)}
          changeLabel={`Margin: ${formatPercent(data?.grossMarginPct ?? 0)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Operating Expenses"
          value={formatCurrency(data?.operatingExpenses.totalOperatingExpenses ?? 0)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(data?.netProfit ?? 0)}
          changeLabel={`Net margin: ${formatPercent(data?.netMarginPct ?? 0)}`}
          icon={<Percent className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Revenue & Gross Margin" description="Gross turnover less direct costs of inventory sold.">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="font-medium text-foreground">Gross Sales</span>
              <span className="font-bold tabular-nums text-foreground">{formatCurrency(data?.grossSales)}</span>
            </div>
            <div className="pl-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Discounts & Allowances</span>
                <span className="tabular-nums font-medium text-rose-500">-{formatCurrency(data?.discountsAndAllowances)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Sales</span>
                <span className="tabular-nums font-semibold text-foreground">{formatCurrency(data?.netSales)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border pt-4">
              <span className="font-medium text-foreground">Cost of Goods Sold (COGS)</span>
              <span className="font-bold tabular-nums text-rose-500">-{formatCurrency(data?.cogs.totalCogs)}</span>
            </div>
            <div className="pl-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Beginning Inventory</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.cogs.beginningInventory)}</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Purchases</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.cogs.purchases)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor & Freight</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.cogs.directLaborAndFreight)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ending Inventory</span>
                <span className="tabular-nums font-medium text-emerald-500">-{formatCurrency(data?.cogs.endingInventory)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/60 mt-4">
              <span className="font-semibold text-foreground">Gross Profit</span>
              <span className="font-bold tabular-nums text-foreground">{formatCurrency(data?.grossProfit)}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Operating Expenses & Net Earnings" description="Fixed overheads, sales commissions, depreciation and net profit.">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="font-medium text-foreground">Operating Expenses (Opex)</span>
              <span className="font-bold tabular-nums text-rose-500">-{formatCurrency(data?.operatingExpenses.totalOperatingExpenses)}</span>
            </div>
            <div className="pl-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Rent & Utilities</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.operatingExpenses.rentAndUtilities)}</span>
              </div>
              <div className="flex justify-between">
                <span>Salaries & Wages</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.operatingExpenses.salariesAndWages)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marketing & Advertising</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.operatingExpenses.marketingAndAdvertising)}</span>
              </div>
              <div className="flex justify-between">
                <span>Software & POS Tech</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.operatingExpenses.softwareAndPosFees)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Logistics</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.operatingExpenses.shippingAndLogistics)}</span>
              </div>
              <div className="flex justify-between">
                <span>Miscellaneous</span>
                <span className="tabular-nums font-medium">{formatCurrency(data?.operatingExpenses.miscellaneous)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border pt-4">
              <span className="font-medium text-foreground">Operating Income</span>
              <span className="font-bold tabular-nums text-foreground">{formatCurrency(data?.operatingIncome)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 mt-4 border border-emerald-200 dark:border-emerald-800">
              <div>
                <p className="font-bold">Net Profit</p>
                <p className="text-xs opacity-80">Net Margin: {data?.netMarginPct}%</p>
              </div>
              <span className="text-xl font-extrabold tabular-nums">{formatCurrency(data?.netProfit)}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}

export default ProfitLossReportPage;
