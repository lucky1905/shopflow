import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass, Home, ShieldAlert } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/Button';

/** 404 – unknown route inside or outside the shell. */
export function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-6"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-8 w-8" />
        </span>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Error 404</p>
          <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            The page you are looking for was moved, renamed or never existed.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Go back
          </Button>
          <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME}>
            <Button leftIcon={<Home className="h-4 w-4" />}>Take me home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/** 403 – authenticated but lacking permission for the route. */
export function UnauthorizedPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-6"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </span>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-destructive">Error 403</p>
          <h1 className="text-3xl font-semibold tracking-tight">Access denied</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            You do not have permission to view this page. Contact your store admin
            if you believe this is a mistake.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}>
            <Button leftIcon={<Home className="h-4 w-4" />}>
              {isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
