import { type ReactNode, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, ReceiptText, ShoppingCart, Store, UserCircle } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/constants';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

export interface EmployeeLayoutProps {
  children?: ReactNode;
}

const TABS = [
  { to: ROUTES.EMPLOYEE_BILLING, label: 'Billing', icon: ShoppingCart, end: true },
  { to: ROUTES.EMPLOYEE_RETURNS, label: 'Returns', icon: ReceiptText, end: false },
] as const;

/**
 * Dedicated employee workspace shell (Phase 10).
 *
 * Designed for dedicated counter terminals / shift staff:
 *   - Zero owner chrome: no sidebar, no command-centre nav, no analytics
 *   - Workspace tabs limited to till duties (billing + returns)
 *   - Staff-badge identity block + live clock + end-shift action
 *   - Completely isolated from the owner workspace
 */
export function EmployeeLayout({ children }: EmployeeLayoutProps) {
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
    : 'Staff';

  const tabLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    );
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased select-none">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tight text-foreground">
                {APP_NAME}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Employee till · Express POS
              </span>
            </div>
          </div>

          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 sm:inline-flex dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Till Live
          </span>

          <nav aria-label="Employee workspace" className="ml-1 hidden items-center gap-1 md:flex">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabLink}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground md:flex">
          <span>{dateString}</span>
          <span>·</span>
          <span className="font-semibold text-foreground">{timeString}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs">
            <UserCircle className="h-4 w-4 text-primary" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-bold text-foreground">{displayName}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {user?.employeeId ? `Badge ${user.employeeId}` : 'Staff on duty'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                aria-label={tab.label}
                className={({ isActive }: { isActive: boolean }) =>
                  cn(
                    'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )
                }
              >
                <tab.icon className="h-4 w-4" />
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void logout(ROUTES.EMPLOYEE_LOGIN)}
            aria-label="End shift and lock till"
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>End Shift</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

export default EmployeeLayout;