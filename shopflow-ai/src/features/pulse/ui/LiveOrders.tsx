import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { formatCurrency } from '@/utils/format';
import { LIVE_ORDERS } from '../data';
import type { OrderStatus } from '../types';
import { GlassCard, LivePill, Reveal, SectionHead } from './primitives';

const AVATAR_GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-sky-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
];

const STATUS_DOT: Record<OrderStatus, string> = {
  Paid: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Preparing: 'bg-sky-500',
  Refunded: 'bg-rose-500',
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  Paid: 'text-emerald-600 dark:text-emerald-400',
  Pending: 'text-amber-600 dark:text-amber-400',
  Preparing: 'text-sky-600 dark:text-sky-400',
  Refunded: 'text-rose-600 dark:text-rose-400',
};

/**
 * Orders live feed — stacked glass rows with gradient avatar rings.
 * A deliberate contrast to the previous bordered data table.
 */
export function LiveOrders({ className }: { className?: string }) {
  return (
    <Reveal delay={0.2} className={cn('h-full', className)}>
      <GlassCard className="flex h-full flex-col p-6 sm:p-7">
        <SectionHead title="Orders live feed" sub="Checkout activity across every channel" right={<LivePill />} />

        <ul className="mt-5 flex-1 space-y-2.5">
          {LIVE_ORDERS.map((order, i) => (
            <li
              key={order.id}
              className="group flex items-center gap-3.5 rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3 transition-all hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-black text-white shadow-md',
                  AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                )}
              >
                {order.initials}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold leading-tight">{order.customer}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-bold uppercase tracking-wide dark:bg-white/[0.08]">
                    {order.channel}
                  </span>
                  {order.items} items
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[13px] font-black tabular-nums">{formatCurrency(order.total)}</p>
                <p className={cn('mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-bold', STATUS_TEXT[order.status])}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[order.status])} />
                  {order.status}
                </p>
              </div>

              <span className="hidden w-10 shrink-0 text-right text-[10px] font-semibold text-muted-foreground tabular-nums sm:block">
                {order.ago}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to={ROUTES.SALES}
          className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 transition-all hover:-translate-y-0.5"
        >
          Open sales ledger <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </GlassCard>
    </Reveal>
  );
}

export default LiveOrders;