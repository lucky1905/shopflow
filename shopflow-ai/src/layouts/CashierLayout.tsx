import { type ReactNode, useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LogOut, Monitor, Store, UserCircle } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/constants';
import { useAuth } from '@/hooks';

export interface CashierLayoutProps {
  children?: ReactNode;
}

/**
 * Dedicated cashier workspace shell.
 *
 * Designed for dedicated POS terminals / counter staff:
 *   - Zero owner chrome: no sidebar, no topbar, no analytics, no settings
 *   - High-contrast, clean layout pinned to full screen height
 *   - Sticky till header with live store indicator, cashier name, clock and end-session action
 *   - Completely isolated from owner navigation
 */
export function CashierLayout({ children }: CashierLayoutProps) {
  const { user, logout } = useAuth();
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = clock.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = clock.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'Cashier';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased select-none">
      {/* ── Cashier till header ────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        {/* Left: branding + terminal badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tight text-foreground">
                {APP_NAME}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Counter Till · Express POS
              </span>
            </div>
          </div>

          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 sm:inline-flex dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Terminal Live
          </span>
        </div>

        {/* Centre: live clock */}
        <div className="hidden items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground md:flex">
          <span>{dateString}</span>
          <span>·</span>
          <span className="font-semibold text-foreground">{timeString}</span>
        </div>

        {/* Right: Cashier identity + End session */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs">
            <UserCircle className="h-4 w-4 text-primary" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-bold text-foreground">{displayName}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Staff on duty
              </span>
            </div>
          </div>

          {/* Quick link back to owner workspace if the logged in user is actually an owner */}
          {user && ['owner', 'admin', 'manager'].includes(user.role) && (
            <Link
              to={ROUTES.DASHBOARD}
              className="hidden items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
              title="Return to Owner Command Centre"
            >
              <Monitor className="h-3.5 w-3.5" />
              Owner view
            </Link>
          )}

          <button
            type="button"
            onClick={() => void logout(ROUTES.LOGIN)}
            aria-label="End session and lock till"
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>End Shift</span>
          </button>
        </div>
      </header>

      {/* ── Till workspace body (fills remaining viewport) ─────────────── */}
      <main className="min-h-0 flex-1 overflow-hidden">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

export default CashierLayout;
