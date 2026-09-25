import { useEffect, useState, type ComponentType } from 'react';
import { Ellipsis } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks';

export interface RowActionItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  /** Renders the item in destructive styling. */
  danger?: boolean;
  disabled?: boolean;
}

export interface RowActionsMenuProps {
  actions: RowActionItem[];
  /** Stops the click from bubbling to the row (row-click opens the drawer). */
  stopPropagation?: boolean;
  className?: string;
}

/**
 * Lightweight per-row dropdown used in tables.
 * Closes on outside click / Escape and stops row-click propagation.
 */
export function RowActionsMenu({ actions, stopPropagation = true, className }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label="Row actions"
        aria-expanded={open}
        onClick={(event) => {
          if (stopPropagation) event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors',
          'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Ellipsis className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  action.onSelect();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors',
                  'hover:bg-accent disabled:pointer-events-none disabled:opacity-50',
                  action.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RowActionsMenu;
