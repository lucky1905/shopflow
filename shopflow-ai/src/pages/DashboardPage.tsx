import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ActivityTimeline,
  AiCopilot,
  AnalyticsBoard,
  ChannelMix,
  HeroBanner,
  KpiStack,
  LiveOrders,
  QuickActions,
  RestockQueue,
  TopMovers,
} from '@/features/pulse';
import { usePulseDashboard } from '@/features/pulse/api/queries';
import { hydratePulse } from '@/features/pulse/data';

/** Skeleton that mirrors the new Pulse layout while the page "boots". */
function PulseSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-live="polite">
      <div className="h-[380px] animate-pulse rounded-[32px] bg-gradient-to-br from-violet-200/60 via-fuchsia-200/40 to-cyan-200/50 dark:from-violet-900/40 dark:via-fuchsia-900/30 dark:to-cyan-900/30" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="h-[480px] animate-pulse rounded-3xl bg-muted/70 xl:col-span-8" />
        <div className="h-[480px] animate-pulse rounded-3xl bg-muted/70 xl:col-span-4" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="h-[420px] animate-pulse rounded-3xl bg-muted/70 xl:col-span-7" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-muted/70 xl:col-span-5" />
      </div>
    </div>
  );
}

/**
 * ShopFlow "Pulse" â€” the 2026 command-center dashboard.
 *
 * A ground-up replacement of the previous overview: gradient hero banner,
 * XL KPI cards with goal meters, composed bar+line analytics, radial channel
 * gauge, AI restock queue, live orders feed, activity timeline, interactive
 * Copilot widget and floating quick actions.
 */
export function DashboardPage() {
  const { data, isLoading, isError, error } = usePulseDashboard();

  // Publish live figures into the Pulse data bindings so every panel below
  // re-renders with backend values without any component changes.
  useEffect(() => {
    if (data) hydratePulse(data);
  }, [data]);

  // A failed request keeps the bundled dataset on screen rather than blanking.
  const loading = isLoading && !data;
  const showError = isError && !data;

  return (
    <div className="relative mx-auto w-full max-w-[1720px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-7">
      {showError && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          <span>
            Live figures are unavailable
            {error?.message ? `: ${error.message}` : ''}. Showing the last known dataset.
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="boot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PulseSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-7"
          >
            <HeroBanner />

            <KpiStack />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <AnalyticsBoard />
              </div>
              <div className="xl:col-span-4">
                <ChannelMix />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <RestockQueue />
              </div>
              <div className="xl:col-span-5">
                <LiveOrders />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <ActivityTimeline />
              </div>
              <div className="xl:col-span-4">
                <AiCopilot />
              </div>
              <div className="xl:col-span-4">
                <TopMovers />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating speed-dial (persistent on the dashboard) */}
      {!loading && <QuickActions />}
    </div>
  );
}

export default DashboardPage;




