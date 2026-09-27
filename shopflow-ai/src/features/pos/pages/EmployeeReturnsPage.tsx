import { useState } from 'react';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ReturnModal } from '../components';
import type { Sale } from '../types';

/**
 * Till-friendly returns screen (Phase 10, employee workspace).
 *
 * Scoped to front-line duties: look up a recent sale by invoice/receipt
 * number and open the till's return flow. No analytics, no RMA admin.
 */
export function EmployeeReturnsPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);

  const startReturn = () => {
    if (!query.trim()) {
      toast.error('Enter an invoice or receipt number first.');
      return;
    }
    setReturnOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Counter returns</h1>
        <p className="text-sm text-muted-foreground">
          Look up the original bill, then process the refund through the till.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Invoice or receipt number</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') startReturn();
            }}
            placeholder="Scan or type invoice no. (e.g. INV-1024)"
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <Button onClick={startReturn} className="h-11 shrink-0 px-6">
          Find bill
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8">
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No bill selected"
          description="Search for the original invoice above to start a return. Refunds go back through the same payment method."
        />
      </div>

      <ReturnModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        initialSale={null as Sale | null}
      />
    </div>
  );
}

export default EmployeeReturnsPage;
