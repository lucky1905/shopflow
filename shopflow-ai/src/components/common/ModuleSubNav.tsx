import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ModuleSubNavItem {
  to: string;
  label: string;
  /** Exact match for index-style tabs (e.g. `/sales`). */
  end?: boolean;
}

export interface ModuleSubNavProps {
  items: ModuleSubNavItem[];
  className?: string;
}

/**
 * In-page tab bar shared by the Sales and Purchases modules. Keeps the
 * sidebar untouched while sub-routes stay one click away. Fully responsive:
 * scrolls horizontally on small screens.
 */
export function ModuleSubNav({ items, className }: ModuleSubNavProps) {
  return (
    <nav
      aria-label="Module sections"
      className={cn(
        'scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto border-b border-border pb-px',
        className,
      )}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default ModuleSubNav;