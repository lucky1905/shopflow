import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Crown } from 'lucide-react';
import { ROUTES } from '@/constants';
import { DEMO_CREDENTIALS } from '@/services';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordInput } from '@/components/forms/PasswordInput';
import type { ApiError } from '@/types';

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

/**
 * Owner sign-in (Phase 10).
 *
 * Distinct flow from staff: authenticates through `/auth/admin/login` and
 * always lands on the command centre — employees cannot use this door.
 */
export function AdminLoginPage() {
  const [searchParams] = useSearchParams();
  const { loginAsOwner } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const rememberMe = watch('rememberMe') ?? false;

  const onSubmit = async (values: AdminLoginFormValues) => {
    setServerError(null);
    try {
      const redirectTo = searchParams.get('redirect') ?? ROUTES.DASHBOARD;
      await loginAsOwner(
        { email: values.email, password: values.password, rememberMe: values.rememberMe },
        redirectTo,
      );
    } catch (error) {
      setServerError((error as ApiError)?.message ?? 'Unable to sign in. Please try again.');
    }
  };

  const fillDemo = () => {
    setValue('email', DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue('password', DEMO_CREDENTIALS.password, { shouldValidate: true });
  };

  return (
    <AuthLayout backLink={{ label: 'Back to login options', to: ROUTES.LOGIN }}>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Crown className="h-3 w-3" />
            Owner access
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Command centre sign in</h1>
          <p className="text-sm text-muted-foreground">
            Manage inventory, staff, purchases and insights for your store.
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm">
          <p className="font-medium text-foreground">Try the demo owner account</p>
          <p className="mt-0.5 text-muted-foreground">
            {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
          </p>
          <button
            type="button"
            onClick={fillDemo}
            className="mt-1.5 font-medium text-primary hover:underline"
          >
            Autofill credentials
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@yourstore.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(event) => setValue('rememberMe', event.target.checked)}
            />
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<Crown className="h-4 w-4" />}>
            Sign in as Owner
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Working the counter today?{' '}
          <Link to={ROUTES.EMPLOYEE_LOGIN} className="font-medium text-primary hover:underline">
            Start a staff shift
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default AdminLoginPage;
