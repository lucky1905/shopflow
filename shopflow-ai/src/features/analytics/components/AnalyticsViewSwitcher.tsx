import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ANALYTICS_VIEWS } from '../constants';
import type { AnalyticsView } from '../types';

export interface AnalyticsViewSwitcherProps {
  active: AnalyticsView;
  onChange: (view: AnalyticsView) => void;
  className?: string;
}

/** In-page section tabs — keeps sidebar navigation untouched. */
export function AnalyticsViewSwitcher({ active, onChange, className }: AnalyticsViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Analytics sections"
      className={cn('scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto pb-px', className)}
    >
      {ANALYTICS_VIEWS.map((view) => {
        const isActive = view.id === active;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.id as AnalyticsView)}
            className={cn(
              'relative shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            {view.label}
            {isActive && (
              <motion.span
                layoutId="analytics-view-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
