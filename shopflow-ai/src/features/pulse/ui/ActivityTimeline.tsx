import type { ComponentType } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { EVENTS } from '../data';
import type { TimelineIcon, TimelineTone } from '../types';
import { GlassCard, LivePill, Reveal, SectionHead } from './primitives';

const ICONS: Record<TimelineIcon, ComponentType<{ className?: string }>> = {
  check: CheckCircle2,
  cart: ShoppingBag,
  alert: AlertTriangle,
  truck: Truck,
  spark: Sparkles,
  up: TrendingUp,
};

const TONES: Record<TimelineTone, string> = {
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

/**
 * Activity timeline — gradient spine with icon nodes. Visually distinct from
 * the previous plain dot-and-line list.
 */
export function ActivityTimeline({ className }: { className?: string }) {
  return (
    <Reveal delay={0.16} className={cn('h-full', className)}>
      <GlassCard className="flex h-full flex-col p-6 sm:p-7">
        <SectionHead title="Live activity" sub="Everything happening across the store" right={<LivePill label="Streaming" />} />

        <ol className="relative mt-5 flex-1 space-y-1">
          {/* Gradient spine */}
          <span
            aria-hidden="true"
            className="absolute bottom-4 left-[19px] top-4 w-0.5 rounded-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-400 opacity-50"
          />
          {EVENTS.map((event) => {
            const Icon = ICONS[event.icon];
            return (
              <li key={event.id} className="relative flex gap-3.5 py-2.5">
                <span
                  className={cn(
                    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-card shadow-sm dark:border-white/[0.08]',
                  )}
                >
                  <Icon className={cn('h-4 w-4', TONES[event.tone].split(' ')[1])} />
                </span>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold leading-snug">{event.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums dark:bg-white/[0.06]">
                    {event.time}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <Link
          to={ROUTES.SALES}
          className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-black/[0.06] px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-violet-400/40 hover:text-foreground dark:border-white/[0.08]"
        >
          View full history <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </GlassCard>
    </Reveal>
  );
}

export default ActivityTimeline;