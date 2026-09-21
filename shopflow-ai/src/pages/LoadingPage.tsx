import { Loader2 } from 'lucide-react';

/** Full-screen fallback for lazy routes + the initial auth re-hydration. */
export function LoadingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading ShopFlow AI…</p>
    </div>
  );
}

export default LoadingPage;
