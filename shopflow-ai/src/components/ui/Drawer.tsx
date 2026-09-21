import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export type DrawerSide = 'left' | 'right' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  hideHeader?: boolean;
  className?: string;
}

const SIDE_OFFSETS: Record<DrawerSide, { initial: { x?: string; y?: string }; className: string }> = {
  right: { initial: { x: '100%' }, className: 'right-0 top-0 h-full' },
  left: { initial: { x: '-100%' }, className: 'left-0 top-0 h-full' },
  bottom: { initial: { y: '100%' }, className: 'bottom-0 left-0 w-full' },
};

const WIDTHS: Record<DrawerSize, string> = {
  sm: 'w-full sm:w-80',
  md: 'w-full sm:w-[26rem]',
  lg: 'w-full sm:w-[34rem]',
  xl: 'w-full sm:w-[46rem]',
  full: 'w-full',
};

const HEIGHTS: Record<DrawerSize, string> = {
  sm: 'h-1/3',
  md: 'h-1/2',
  lg: 'h-2/3',
  xl: 'h-5/6',
  full: 'h-[95vh]',
};

/**
 * Slide-over panel used for filters, detail previews and mobile navigation.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  hideHeader = false,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const offset = SIDE_OFFSETS[side];
  const isBottom = side === 'bottom';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Drawer'}
            initial={offset.initial}
            animate={isBottom ? { y: 0 } : { x: 0 }}
            exit={offset.initial}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'absolute flex flex-col border-border bg-card text-card-foreground shadow-2xl',
              offset.className,
              isBottom ? HEIGHTS[size] : WIDTHS[size],
              isBottom ? 'rounded-t-2xl border-t' : 'border-l',
              side === 'left' && 'border-r border-l-0',
              className,
            )}
          >
            {!hideHeader && (
              <header className="flex items-start gap-3 border-b border-border p-5">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="text-base font-semibold leading-tight tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close drawer"
                    className="-mr-1 -mt-0.5 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </header>
            )}

            <div className="flex-1 overflow-y-auto p-5">{children}</div>

            {footer && (
              <footer className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 p-4 sm:flex-row sm:justify-end">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Drawer;
