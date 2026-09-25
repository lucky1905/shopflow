import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AI_VIEWS, FORECAST_RANGES } from '../constants';
import { useAIWorkspaceStore } from '../hooks/useAIWorkspaceStore';
import type { AIView, ForecastRange } from '../types';

/**
 * View + horizon switcher for the AI workspace. Rendered in-page so the
 * sidebar navigation stays untouched.
 */
export function AIViewSwitcher({ className }: { className?: string }) {
  const activeView = useAIWorkspaceStore((state) => state.activeView);
  const setActiveView = useAIWorkspaceStore((state) => state.setActiveView);

  return (
    <div
      role="tablist"
      aria-label="AI insight views"
      className={cn('scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto pb-px', className)}
    >
      {AI_VIEWS.map((view) => {
        const isActive = view.id === activeView;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveView(view.id as AIView)}
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
                layoutId="ai-view-underline"
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

/** 7D / 30D / 90D segmented control used by the forecast view. */
export function ForecastRangeSwitcher({ className }: { className?: string }) {
  const range = useAIWorkspaceStore((state) => state.forecastRange);
  const setRange = useAIWorkspaceStore((state) => state.setForecastRange);

  return (
    <div
      role="group"
      aria-label="Forecast range"
      className={cn('inline-flex rounded-lg border border-border bg-muted/40 p-0.5', className)}
    >
      {FORECAST_RANGES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setRange(option as ForecastRange)}
          aria-pressed={range === option}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            range === option
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

