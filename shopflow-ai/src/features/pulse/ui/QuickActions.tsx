import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  FileBarChart,
  Lightbulb,
  PackagePlus,
  Plus,
  ScanLine,
  Truck,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

/**
 * Dashboard shortcuts tuned for Indian retail floor staff.
 *
 * "New bill" leads because billing is the task a shop spends most of its
 * hours on; everything else maps to a destination the shopkeeper visits
 * daily. Receive stock and purchase orders are separated because a kirana
 * owner restocks far more often than they raise formal POs.
 */
const ACTIONS = [
  {
    label: 'New Bill',
    sub: 'Express billing',
    icon: ScanLine,
    to: ROUTES.POS,
    gradient: 'from-violet-600 to-fuchsia-600',
  },
  {
    label: 'Add Product',
    sub: 'Catalog',
    icon: PackagePlus,
    to: ROUTES.PRODUCTS,
    gradient: 'from-cyan-500 to-sky-600',
  },
  {
    label: 'Receive Stock',
    sub: 'GRN',
    icon: Truck,
    to: `${ROUTES.PURCHASES}${ROUTES.PURCHASE_GRN}`,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Purchase Order',
    sub: 'Restock',
    icon: BookOpen,
    to: ROUTES.PURCHASE_ORDERS,
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    label: "Today's Report",
    sub: 'Sales',
    icon: FileBarChart,
    to: ROUTES.REPORTS_SALES,
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    label: 'Business Tips',
    sub: 'AI insights',
    icon: Lightbulb,
    to: ROUTES.AI_INSIGHTS,
    gradient: 'from-indigo-500 to-blue-600',
  },
] as const;

/**
 * Floating quick actions â€” a FAB speed-dial anchored bottom-right.
 * Expands into labelled gradient pills; hides on scroll-free small screens
 * via bottom padding on the page container.
 */
export function QuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {open &&
          ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                type="button"
                initial={{ opacity: 0, y: 16, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.85 }}
                transition={{ duration: 0.22, delay: (ACTIONS.length - 1 - i) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  setOpen(false);
                  navigate(action.to);
                }}
                className="pointer-events-auto group flex items-center gap-3"
              >
                <span className="rounded-full border border-black/[0.07] bg-card/90 px-3.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-xl dark:border-white/[0.1]">
                  {action.label}
                  <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">{action.sub}</span>
                </span>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110 ${action.gradient}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </motion.button>
            );
          })}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-[0_16px_40px_-8px_rgba(147,51,234,0.6)]"
      >
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/30" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'plus'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {open ? <X className="h-5.5 w-5.5" /> : <Plus className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default QuickActions;
