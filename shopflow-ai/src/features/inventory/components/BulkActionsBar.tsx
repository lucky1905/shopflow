import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArchiveRestore, FileText, Scale, Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ProductStatus } from '../types';

export interface BulkActionsBarProps {
  selectedCount: number;
  /** Disables all actions while a bulk mutation is in flight. */
  disabled?: boolean;
  onSetStatus: (status: ProductStatus) => void;
  onAdjustStock: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/**
 * Floating bulk toolbar (glass pill, Pulse style) shown when table rows are
 * selected. Handles lifecycle changes, stock adjustments and deletions.
 */
export function BulkActionsBar({
  selectedCount,
  disabled = false,
  onSetStatus,
  onAdjustStock,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="toolbar"
          aria-label="Bulk actions"
          className="fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-slate-950/90 p-2 pl-4 text-slate-100 shadow-[0_24px_60px_-12px_rgba(2,6,23,0.6)] backdrop-blur-xl dark:border-white/[0.1]"
        >
          <span className="mr-1 whitespace-nowrap text-[13px] font-bold tabular-nums">
            {selectedCount} selected
          </span>

          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />

          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onSetStatus('active')}
            className="text-slate-200 hover:bg-white/10 hover:text-white"
            leftIcon={<ArchiveRestore className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Activate</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onSetStatus('draft')}
            className="text-slate-200 hover:bg-white/10 hover:text-white"
            leftIcon={<FileText className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Draft</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onSetStatus('archived')}
            className="text-slate-200 hover:bg-white/10 hover:text-white"
            leftIcon={<Archive className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Archive</span>
          </Button>

          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />

          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={onAdjustStock}
            leftIcon={<Scale className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Adjust stock</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={disabled}
            onClick={onDelete}
            leftIcon={<Trash className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
            disabled={disabled}
            onClick={onClear}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BulkActionsBar;
