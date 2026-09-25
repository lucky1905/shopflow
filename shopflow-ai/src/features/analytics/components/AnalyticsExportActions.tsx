import { useState } from 'react';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks';
import { formatCurrency, formatNumber } from '@/utils/format';
import { exportToCSV, triggerPrintReport } from '../utils';
import type { AnalyticsDashboardData } from '../types';

export interface AnalyticsExportActionsProps {
  data?: AnalyticsDashboardData;
  className?: string;
}

/** CSV, PDF-preview and print actions for the analytics workspace. */
export function AnalyticsExportActions({ data, className }: AnalyticsExportActionsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const toast = useToast();

  const handleCsv = () => {
    if (!data) return;
    exportToCSV(`shopflow-analytics-${data.filters.preset}`, data.topProducts, [
      { key: 'name', header: 'Product' },
      { key: 'sku', header: 'SKU' },
      { key: 'category', header: 'Category' },
      { key: 'unitsSold', header: 'Units sold' },
      { key: 'revenue', header: 'Revenue' },
      { key: 'marginPct', header: 'Margin %' },
      { key: 'growth', header: 'Growth %' },
    ]);
    toast.success('Analytics exported to CSV.');
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          onClick={handleCsv}
          disabled={!data}
        >
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FileDown className="h-4 w-4" />}
          onClick={() => setPreviewOpen(true)}
          disabled={!data}
        >
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Printer className="h-4 w-4" />}
          onClick={triggerPrintReport}
          disabled={!data}
        >
          Print
        </Button>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Analytics report preview"
        description="This is the layout that prints or saves as PDF."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => {
                setPreviewOpen(false);
                triggerPrintReport();
              }}
            >
              Print / Save PDF
            </Button>
          </>
        }
      >
        <PrintableReport data={data} />
      </Modal>
    </div>
  );
}

/** Print-optimised summary rendered inside the PDF preview modal. */
function PrintableReport({ data }: { data?: AnalyticsDashboardData }) {
  if (!data) return null;
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Revenue" value={formatCurrency(data.kpis.revenue)} />
        <Metric label="Orders" value={formatNumber(data.kpis.orders)} />
        <Metric label="Net profit" value={formatCurrency(data.pnl.netProfit)} />
        <Metric label="Net margin" value={`${data.pnl.marginPct.toFixed(1)}%`} />
        <Metric label="Inventory value" value={formatCurrency(data.kpis.inventoryValue)} />
        <Metric label="Health score" value={`${data.health.score}/100`} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <p className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground">Profit &amp; loss</p>
        <dl className="divide-y divide-border text-sm">
          <Line label="Revenue" value={formatCurrency(data.pnl.revenue)} />
          <Line label="Cost of goods sold" value={`- ${formatCurrency(data.pnl.cogs)}`} />
          <Line label="Gross profit" value={formatCurrency(data.pnl.grossProfit)} strong />
          <Line label="Operating expenses" value={`- ${formatCurrency(data.pnl.expenses)}`} />
          <Line label="Net profit" value={formatCurrency(data.pnl.netProfit)} strong />
        </dl>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <p className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground">Top products</p>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-2 font-medium">Product</th>
              <th className="p-2 text-right font-medium">Units</th>
              <th className="p-2 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.slice(0, 8).map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="p-2">{row.name}</td>
                <td className="p-2 text-right tabular-nums">{formatNumber(row.unitsSold)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className={strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</dt>
      <dd className={strong ? 'font-semibold tabular-nums text-foreground' : 'tabular-nums text-muted-foreground'}>
        {value}
      </dd>
    </div>
  );
}
