import { useEffect, useState } from 'react';
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
 * ShopFlow "Pulse" — the 2026 command-center dashboard.
 *
 * A ground-up replacement of the previous overview: gradient hero banner,
 * XL KPI cards with goal meters, composed bar+line analytics, radial channel
 * gauge, AI restock queue, live orders feed, activity timeline, interactive
 * Copilot widget and floating quick actions.
 */
export function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[1720px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-7">
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


