import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks';
import { GOAL, HERO_TICKER } from '../data';
import type { HeroTickerItem } from '../types';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function GoalRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[128px] w-[128px]">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="11" />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#pulse-ring)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="pulse-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tracking-tight text-white tabular-nums">{pct}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">of goal</span>
      </div>
    </div>
  );
}

const WEEK_BARS = [38, 52, 44, 66, 58, 84, 72];

function WeekBars() {
  return (
    <div className="flex h-16 items-end gap-1.5">
      {WEEK_BARS.map((v, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${v}%` }}
          transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-md bg-white/25"
        />
      ))}
    </div>
  );
}

function TickerItem({ item }: { item: HeroTickerItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] font-medium text-white/60">{item.label}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-lg font-black tracking-tight text-white tabular-nums">{item.value}</span>
        {item.delta !== undefined && (
          <span className="text-[11px] font-bold text-emerald-300">▲{item.delta}%</span>
        )}
      </p>
    </div>
  );
}

/**
 * Full-bleed gradient hero — the visual anchor of the Pulse dashboard.
 * Replaces the previous flat white welcome card entirely.
 */
export function HeroBanner() {
  const { user } = useAuth();
  const name = user?.firstName ?? 'Alex';

  return (
    <motion.section
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 shadow-[0_32px_80px_-24px_rgba(147,51,234,0.55)]"
    >
      {/* Decorative light */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 30% 20%, black, transparent 70%)',
          }}
        />
      </div>

      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:p-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            LIVE · DOWNTOWN STORE
            <span className="text-white/40">·</span>
            <span className="text-white/60">POS OPEN</span>
          </span>

          <h1 className="mt-5 text-[32px] font-black leading-[1.05] tracking-tighter text-white sm:text-[44px] xl:text-[52px]">
            {greeting()}, {name}.
            <span className="block text-white/70">Your store is on pace for a record month.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-[15px]">
            Revenue is pacing <strong className="font-bold text-white">+18% ahead</strong> of plan with 441 orders
            yesterday. Copilot drafted two restock orders overnight — review them before the weekend rush.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to={ROUTES.POS}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Zap className="h-4 w-4" />
              New sale
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={ROUTES.AI_INSIGHTS}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              Ask Copilot
              <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-black tracking-wider">AI</span>
            </Link>
          </div>
        </div>

        {/* Floating goal card */}
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between gap-6 self-center rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">{GOAL.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-white tabular-nums">{GOAL.value}</p>
            <p className="mt-1 text-xs font-medium text-white/60">of {GOAL.target} monthly target</p>
            <div className="mt-5 w-32">
              <WeekBars />
              <p className="mt-1.5 text-[10px] font-medium text-white/50">Last 7 days · daily revenue</p>
            </div>
          </div>
          <GoalRing pct={GOAL.pct} />
        </motion.div>
      </div>

      {/* Stat ticker */}
      <div className="relative grid grid-cols-2 gap-3 border-t border-white/10 bg-black/10 p-4 sm:grid-cols-4 sm:p-5 lg:px-10">
        {HERO_TICKER.map((item) => (
          <TickerItem key={item.label} item={item} />
        ))}
      </div>
    </motion.section>
  );
}

export default HeroBanner;