import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, BrainCircuit, Package, ShieldCheck } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/constants';
import { Logo } from '@/components/common/Logo';

const HIGHLIGHTS = [
  { icon: Package, title: 'Live inventory', text: 'Stock levels sync across every channel in real time.' },
  { icon: BarChart3, title: 'Built-in analytics', text: 'Sales, margins and turnover at a glance.' },
  { icon: BrainCircuit, title: 'AI forecasting', text: 'Demand predictions and reorder suggestions.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'Role-based access and audit trails included.' },
];

export interface AuthLayoutProps {
  children: ReactNode;
  /** Small link rendered above the card (defaults to “Back to home”). */
  backLink?: { label: string; to: string };
  showHighlights?: boolean;
}

/**
 * Split-screen auth shell: branded panel on the left (desktop),
 * form card on the right. Keeps every auth page visually consistent.
 */
export function AuthLayout({ children, backLink, showHighlights = true }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {showHighlights && (
        <aside className="relative hidden w-[44%] shrink-0 overflow-hidden bg-sidebar lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-highlight/15 to-transparent" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <Link to={ROUTES.HOME} aria-label={`${APP_NAME} home`}>
              <Logo />
            </Link>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">ShopFlow AI</p>
                <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
                  {APP_TAGLINE}
                </h2>
              </div>
              <ul className="space-y-4">
                {HIGHLIGHTS.map((item) => (
                  <li key={item.title} className="flex gap-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="block text-sm text-muted-foreground">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </aside>
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link
            to={backLink?.to ?? ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink?.label ?? 'Back to home'}
          </Link>
          <Link to={ROUTES.HOME} className="lg:hidden" aria-label={`${APP_NAME} home`}>
            <Logo size="sm" />
          </Link>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6"
        >
          <div className="w-full max-w-md">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}

export default AuthLayout;
