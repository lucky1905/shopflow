import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Store, Sun, TrendingUp, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { useAuth, useClickOutside, useTheme } from '@/hooks';
import { useSidebarStore } from '@/store';

export interface TopbarProps {
  onOpenCommand: () => void;
  className?: string;
}

const DEMO_NOTIFICATIONS = [
  {
    id: 'n1',
    icon: AlertTriangle,
    tone: 'bg-amber-500/10 text-amber-500',
    title: 'Low stock: Sunflower Oil 1L',
    detail: '34 units left · below par level',
    time: '8m',
  },
  {
    id: 'n2',
    icon: TrendingUp,
    tone: 'bg-emerald-500/10 text-emerald-500',
    title: 'Daily target reached',
    detail: '$9,412 of $9,000 goal',
    time: '1h',
  },
  {
    id: 'n3',
    icon: UserRound,
    tone: 'bg-violet-500/10 text-violet-500',
    title: 'New wholesale customer',
    detail: 'Corner Cafe · approved for Net 15',
    time: '3h',
  },
];

/**
 * Pulse topbar — a floating frosted-glass capsule (workspace switcher,
 * ⌘K command trigger, live pill, notifications, theme + profile menus).
 * Replaces the previous full-width flat navbar.
 */
export function Topbar({ onOpenCommand, className }: TopbarProps) {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const toggleMobile = useSidebarStore((state) => state.toggleMobile);

  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useClickOutside<HTMLDivElement>(() => setBellOpen(false), bellOpen);
  const profileRef = useClickOutside<HTMLDivElement>(() => setProfileOpen(false), profileOpen);

  const name = user ? `${user.firstName} ${user.lastName}` : 'Alex Rivera';
  const email = user?.email ?? 'alex@shopflow.ai';
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'AR';

  return (
    <div className={cn('sticky top-0 z-30 px-3 pb-2 pt-4 sm:px-5', className)}>
      <header className="flex h-16 items-center gap-2 rounded-2xl border border-black/[0.06] bg-card/80 px-3 shadow-[0_8px_32px_-12px_rgba(76,29,149,0.25)] backdrop-blur-xl sm:gap-3 sm:px-4 dark:border-white/[0.08]">
        {/* Mobile drawer trigger */}
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Workspace switcher */}
        <button
          type="button"
          className="flex shrink-0 items-center gap-2.5 rounded-xl border border-black/[0.06] bg-black/[0.02] p-1.5 pr-2.5 transition-all hover:border-violet-400/40 dark:border-white/[0.08] dark:bg-white/[0.04]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-sky-600 text-white shadow-md">
            <Store className="h-3.5 w-3.5" />
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-[12px] font-bold leading-tight">Downtown Store</span>
            <span className="block text-[10px] leading-tight text-muted-foreground">Main branch</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* Command trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-black/[0.06] bg-black/[0.03] px-3.5 py-2.5 text-sm text-muted-foreground transition-all hover:border-violet-400/40 hover:text-foreground dark:border-white/[0.08] dark:bg-white/[0.04] md:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">Search or jump to…</span>
          <kbd className="shrink-0 rounded-md border border-black/[0.08] bg-background px-1.5 py-0.5 text-[10px] font-bold dark:border-white/[0.12]">
            Ctrl K
          </kbd>
        </button>

        <div className="flex min-w-0 flex-1 md:hidden" />

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Live pill */}
          <span className="mr-1 hidden items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 lg:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            POS OPEN
          </span>

          {/* Theme */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={resolvedTheme}
                initial={{ rotate: -60, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 60, opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                {resolvedTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => setBellOpen((v) => !v)}
              aria-label="Notifications"
              aria-expanded={bellOpen}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-fuchsia-500 ring-2 ring-card" />
            </button>

            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-black/[0.08] bg-popover/95 shadow-2xl backdrop-blur-xl dark:border-white/[0.1]"
                >
                  <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.08]">
                    <p className="text-sm font-bold">Notifications</p>
                    <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-black text-fuchsia-500">
                      3 NEW
                    </span>
                  </div>
                  <ul className="p-2">
                    {DEMO_NOTIFICATIONS.map((n) => {
                      const Icon = n.icon;
                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => setBellOpen(false)}
                            className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent"
                          >
                            <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', n.tone)}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold">{n.title}</span>
                              <span className="block truncate text-[11px] text-muted-foreground">{n.detail}</span>
                            </span>
                            <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{n.time}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors hover:bg-accent"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[11px] font-black text-white shadow-md">
                {initials}
              </span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', profileOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-black/[0.08] bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/[0.1]"
                >
                  <div className="border-b border-black/[0.06] px-3 py-2.5 dark:border-white/[0.08]">
                    <p className="truncate text-[13px] font-bold">{name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{email}</p>
                  </div>
                  {[
                    { icon: UserRound, label: 'My profile', to: ROUTES.PROFILE },
                    { icon: Settings, label: 'Settings', to: ROUTES.SETTINGS },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => void logout(ROUTES.LOGIN)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Topbar;