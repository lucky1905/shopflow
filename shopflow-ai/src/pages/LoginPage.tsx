import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Crown } from 'lucide-react';
import { ROUTES } from '@/constants';
import { AuthLayout } from '@/layouts/AuthLayout';

/**
 * Workspace chooser (Phase 10).
 *
 * `/login` no longer signs anyone in directly — it routes owners to the
 * command-centre sign-in and staff to the counter-till shift sign-in, so
 * the two workspaces stay completely isolated.
 */
export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const withRedirect = (path: string) =>
    redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Choose your workspace</h1>
          <p className="text-sm text-muted-foreground">
            Owners manage the store. Staff run the counter till.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to={withRedirect(ROUTES.ADMIN_LOGIN)}
            className="group flex items-center gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 transition-all hover:border-amber-500/50 hover:bg-amber-500/10"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Crown className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">I&apos;m the Owner</span>
              <span className="block text-sm text-muted-foreground">
                Command centre — inventory, staff, reports & AI
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            to={withRedirect(ROUTES.EMPLOYEE_LOGIN)}
            className="group flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">I&apos;m Staff</span>
              <span className="block text-sm text-muted-foreground">
                Counter till — billing & returns with badge ID
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New store?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
            Create an owner account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
