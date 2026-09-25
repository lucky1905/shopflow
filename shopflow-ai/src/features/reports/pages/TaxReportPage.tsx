import { Badge } from '@/components/common/Badge';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency } from '@/utils/format';
import {
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { useTaxSummary } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import type { TaxSummaryRateRow } from '../types';
import { Calculator, ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react';

export function TaxReportPage() {
  const filters = useReportsFiltersStore();
  const tax = useTaxSummary(filters);
  const data = tax.data;

  const columns: DataTableColumn<TaxSummaryRateRow>[] = [
    {
      key: 'rateLabel',
      header: 'Tax Rate Slab',
      render: (row) => <Badge variant="outline">{row.rateLabel}</Badge>,
    },
    {
      key: 'taxableSalesAmount',
      header: 'Taxable Sales',
      align: 'right',
      render: (row) => <span className="tabular-nums font-semibold">{formatCurrency(row.taxableSalesAmount)}</span>,
    },
    {
      key: 'cgstCollected',
      header: 'CGST',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.cgstCollected)}</span>,
    },
    {
      key: 'sgstCollected',
      header: 'SGST',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.sgstCollected)}</span>,
    },
    {
      key: 'igstCollected',
      header: 'IGST',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.igstCollected)}</span>,
    },
    {
      key: 'totalTaxCollected',
      header: 'Output Tax',
      align: 'right',
      render: (row) => <span className="tabular-nums font-bold text-foreground">{formatCurrency(row.totalTaxCollected)}</span>,
    },
    {
      key: 'inputTaxCreditAvailable',
      header: 'ITC Available',
      align: 'right',
      render: (row) => <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(row.inputTaxCreditAvailable)}</span>,
    },
    {
      key: 'netTaxPayable',
      header: 'Net Liability',
      align: 'right',
      render: (row) => <span className="tabular-nums font-bold text-primary">{formatCurrency(row.netTaxPayable)}</span>,
    },
  ];

  const handleExportCsv = () => {
    if (!data?.breakdownByRate) return;
    exportToCSV('tax-gst-filing-summary', data.breakdownByRate, [
      { key: 'rateLabel', header: 'Tax Slab' },
      { key: 'taxableSalesAmount', header: 'Taxable Sales ($)', format: (v) => formatCurrency(v as number) },
      { key: 'cgstCollected', header: 'CGST ($)', format: (v) => formatCurrency(v as number) },
      { key: 'sgstCollected', header: 'SGST ($)', format: (v) => formatCurrency(v as number) },
      { key: 'igstCollected', header: 'IGST ($)', format: (v) => formatCurrency(v as number) },
      { key: 'totalTaxCollected', header: 'Output Tax ($)', format: (v) => formatCurrency(v as number) },
      { key: 'inputTaxCreditAvailable', header: 'ITC Offset ($)', format: (v) => formatCurrency(v as number) },
      { key: 'netTaxPayable', header: 'Net Liability ($)', format: (v) => formatCurrency(v as number) },
    ]);
  };

  const printableContent = (
    <div className="space-y-4 text-sm">
      <h3 className="font-bold text-base">GST / Sales Tax Reconciliation Statement</h3>
      <div className="grid grid-cols-3 gap-4 border p-4 rounded">
        <div>
          <p className="text-xs text-muted-foreground">Output Tax (Sales)</p>
          <p className="text-base font-bold text-rose-600">{formatCurrency(data?.totalOutputTax)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Input Tax Credit (ITC)</p>
          <p className="text-base font-bold text-emerald-600">{formatCurrency(data?.totalInputTaxCredit)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Net Tax Payable</p>
          <p className="text-base font-bold text-primary">{formatCurrency(data?.netGstPayable)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Tax Summary & GST Reconciliation"
        description="Statutory tax liability, input tax credit (ITC) offsets, and rate slab breakdown."
        actions={
          <ReportExportActions
            reportTitle="Tax & GST Filing Summary"
            onExportCsv={handleExportCsv}
            printableContent={printableContent}
          />
        }
      />

      <ReportsFilterBar showChannelFilter={false} showCategoryFilter={false} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Taxable Turnover"
          value={formatCurrency(data?.totalTaxableSales ?? 0)}
          icon={<Calculator className="h-4 w-4" />}
        />
        <StatCard
          title="Gross Output Tax"
          value={formatCurrency(data?.totalOutputTax ?? 0)}
          changeLabel="Collected from buyers"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <StatCard
          title="Input Tax Credit (ITC)"
          value={formatCurrency(data?.totalInputTaxCredit ?? 0)}
          changeLabel="Paid to suppliers"
          icon={<ArrowDownLeft className="h-4 w-4" />}
        />
        <StatCard
          title="Net Tax Payable"
          value={formatCurrency(data?.netGstPayable ?? 0)}
          changeLabel={`Due on: ${data?.filingDueDate ?? 'N/A'}`}
          icon={<Scale className="h-4 w-4" />}
        />
      </div>

      <SectionCard
        title="Tax Slabs & Return Breakdown"
        description="Categorized by GST slabs: Exempt (0%), Essential (5%), Standard (12%), Services (18%), and Luxury (28%)."
        noPadding
      >
        <DataTable
          columns={columns}
          data={data?.breakdownByRate ?? []}
          rowKey="rateLabel"
          loading={tax.isLoading}
          error={tax.error instanceof Error ? tax.error.message : null}
          emptyTitle="No tax records found for selected period"
        />
      </SectionCard>
    </PageContainer>
  );
}

export default TaxReportPage;
