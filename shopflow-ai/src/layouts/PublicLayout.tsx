import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Minimal marketing wrapper: brand header + centred content + footer.
 * Used by the landing page and other pre-login marketing surfaces.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={ROUTES.HOME} aria-label="ShopFlow AI home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle variant="icon" />
            <Link
              to={ROUTES.LOGIN}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ShopFlow AI. All rights reserved.</p>
          <p>AI-powered inventory & POS for modern retail.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
