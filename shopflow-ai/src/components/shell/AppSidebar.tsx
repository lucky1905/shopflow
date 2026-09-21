import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, PanelLeftClose, PanelLeftOpen, X, Zap } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, NAV_SECTIONS, ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuth, useIsMobile } from '@/hooks';
import { useSidebarStore } from '@/store';
import type { NavItem } from '@/types';

export interface AppSidebarProps {
  className?: string;
}

interface RailItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

function RailItem({ item, collapsed, onNavigate }: RailItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      end={item.path === ROUTES.DASHBOARD}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
          isActive
            ? 'bg-white/[0.09] text-white'
            : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
          collapsed && 'justify-center px-2',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="pulse-rail-indicator"
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]"
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            />
          )}
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive ? 'text-violet-300' : 'text-slate-500 group-hover:text-slate-300',
            )}
          />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );
}

/**
 * Pulse app sidebar — a floating dark "slate" rail with a brand header,
 * glowing active indicator, AI upsell card and user footer.
 * Completely replaces the previous light theme sidebar.
 */
export function AppSidebar({ className }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  const collapsed = !isMobile && isCollapsed;
  const closeMobile = () => setMobileOpen(false);

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'A';

  const content = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 dark:bg-slate-950">
      {/* Brand */}
      <div className={cn('flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5', collapsed && 'justify-center px-2')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-lg shadow-violet-500/40">
          <Zap className="h-4.5 w-4.5 text-white" />
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-black tracking-tight text-white">{APP_NAME}</span>
            <span className="mt-1 truncate text-[10px] font-medium text-slate-500">{APP_TAGLINE}</span>
          </span>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('sidebar-scroll-area flex-1 overflow-y-auto px-3 py-4', collapsed && 'px-2')}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-1">
            {section.title && !collapsed && (
              <p className="px-3 pb-1.5 pt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                {section.title}
              </p>
            )}
            {section.title && collapsed && <div className="mx-2 my-3 h-px bg-white/[0.06]" />}
            {section.items.map((item) => (
              <RailItem key={item.id} item={item} collapsed={collapsed} onNavigate={closeMobile} />
            ))}
          </div>
        ))}
      </nav>

      {/* AI upsell + footer */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-violet-300">
            <Zap className="h-3 w-3" /> Copilot pro
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-slate-300">
            Unlock demand forecasting across every SKU this quarter.
          </p>
          <Link
            to={ROUTES.AI_INSIGHTS}
            onClick={closeMobile}
            className="mt-3 block w-full rounded-lg bg-white/10 px-3 py-1.5 text-center text-[11px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            See plans
          </Link>
        </div>
      )}

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className={cn('flex items-center gap-3 rounded-xl px-2 py-2', collapsed && 'justify-center px-0')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-black text-white ring-2 ring-white/10">
            {initials}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold text-white">
                {user ? `${user.firstName} ${user.lastName}` : 'Store owner'}
              </span>
              <span className="block truncate text-[10px] capitalize text-slate-500">
                {user ? user.role : 'owner'}
              </span>
            </span>
          )}
          {!collapsed && !isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className={cn('mt-1 flex items-center gap-1', collapsed && 'flex-col')}>
          {collapsed && !isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => void logout(ROUTES.LOGIN)}
            aria-label="Logout"
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400',
              collapsed && 'h-9 flex-none justify-center px-0',
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );

  /* Mobile: slide-in drawer over the content */
  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            onClick={closeMobile}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-out lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
            className,
          )}
          aria-label="Navigation"
        >
          {content}
        </aside>
      </>
    );
  }

  /* Desktop: floating rounded rail inset from the page edge */
  return (
    <motion.div
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="sticky top-0 hidden h-screen shrink-0 p-3 lg:block"
    >
      <motion.aside
        animate={{ width: collapsed ? 60 : 248 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          'h-full overflow-hidden rounded-3xl border border-white/[0.06] shadow-[0_24px_60px_-16px_rgba(2,6,23,0.55)]',
          className,
        )}
        aria-label="Navigation"
      >
        {content}
      </motion.aside>
    </motion.div>
  );
}

export default AppSidebar;