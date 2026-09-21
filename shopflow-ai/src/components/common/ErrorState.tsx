import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Raw error message coming from the API layer. */
  message?: string;
  /** Set to `true` for connection / timeout failures. */
  isNetworkError?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Standard failure panel for query errors.
 * Keep messages short and always offer a recovery path.
 */
export function ErrorState({
  title,
  description,
  message,
  isNetworkError = false,
  onRetry,
  retryLabel = 'Try again',
  action,
  className,
  compact = false,
}: ErrorStateProps) {
  const Icon = isNetworkError ? WifiOff : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-4 px-6 py-16',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20',
          compact ? 'h-11 w-11' : 'h-14 w-14',
        )}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>

      <div className="space-y-1">
        <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {title ?? (isNetworkError ? 'Connection problem' : 'Something went wrong')}
        </h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {message ?? description ?? 'We could not load this data. Please try again.'}
        </p>
      </div>

      {(onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

export default ErrorState;