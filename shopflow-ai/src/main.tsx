import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/query-client';
import { useAppBootstrap } from '@/hooks';
import { router } from '@/routes';
import '@/styles/globals.css';

/**
 * Runs once before the router mounts: applies the persisted theme,
 * re-hydrates the session and subscribes to OS theme changes.
 * Blocks the first paint on a branded splash to avoid theme flashes.
 */
function BootstrapGate() {
  const { isBootstrapped } = useAppBootstrap();

  if (!isBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading ShopFlow AI…</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BootstrapGate />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'rounded-xl border border-border bg-card text-card-foreground shadow-lg',
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
