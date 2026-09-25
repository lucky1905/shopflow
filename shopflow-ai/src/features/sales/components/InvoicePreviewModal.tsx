import { FileDown, Printer, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks';
import { InvoiceDocument } from './InvoiceDocument';
import type { InvoiceDetail } from '../types';

export interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceDetail | null;
}

/**
 * Full invoice preview with Print + PDF actions. Printing uses the shared
 * `.print-area` rules so only the document is sent to the printer.
 */
export function InvoicePreviewModal({ open, onClose, invoice }: InvoicePreviewModalProps) {
  const toast = useToast();

  const downloadPdf = (): void => {
    toast.info('PDF export is mocked in Phase 4 — use the print dialog to save as PDF.');
    window.print();
  };

  return (
    <Modal
      open={open && invoice !== null}
      onClose={onClose}
      size="xl"
      title="Invoice preview"
      description={invoice?.invoiceNumber}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} leftIcon={<X className="h-4 w-4" />}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={downloadPdf}
            leftIcon={<FileDown className="h-4 w-4" />}
          >
            Download PDF
          </Button>
          <Button
            variant="default"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print
          </Button>
        </>
      }
    >
      {invoice && <InvoiceDocument invoice={invoice} />}
    </Modal>
  );
}

export default InvoicePreviewModal;