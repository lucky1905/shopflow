import { useState, type ReactNode } from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks';
import { triggerPrintReport } from '../utils';

export interface ReportExportActionsProps {
  reportTitle: string;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  printableContent?: ReactNode;
}

export function ReportExportActions({
  reportTitle,
  onExportCsv,
  printableContent,
}: ReportExportActionsProps) {
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const toast = useToast();

  const handleCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      toast.success(`${reportTitle} exported to CSV.`);
    } else {
      toast.info('CSV export handler is not configured for this report.');
    }
  };

  const handlePrintModalOpen = () => {
    setPrintModalOpen(true);
  };

  const handleExecutePrint = () => {
    triggerPrintReport();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCsv}
          leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        >
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintModalOpen}
          leftIcon={<Printer className="h-4 w-4" />}
        >
          Print / PDF
        </Button>
      </div>

      <Modal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title={`Print / Save Document: ${reportTitle}`}
        description="Preview the printable report layout or save it directly as PDF using your browser dialog."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPrintModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={handleExecutePrint}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Print Now
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto p-4 bg-muted/20 rounded-lg">
          <div className="print-area rounded-xl border border-border bg-card p-6 text-foreground sm:p-8 shadow-sm">
            <header className="flex items-start justify-between border-b border-border pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide">ShopFlow AI</h2>
                <p className="text-sm text-muted-foreground">{reportTitle}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Generated: {new Date().toLocaleDateString()}</p>
                <p>Store: All Locations</p>
              </div>
            </header>

            {printableContent ? (
              printableContent
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Preview not available for this specific report section. Click Print Now to print current page.
              </div>
            )}

            <footer className="mt-8 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>Confidential · Internal Business Document</span>
              <span>ShopFlow AI Analytics Engine</span>
            </footer>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ReportExportActions;
