import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BadgeCheck } from 'lucide-react';
import { ROUTES } from '@/constants';
import { DEMO_EMPLOYEE_CREDENTIALS } from '@/services';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordInput } from '@/components/forms/PasswordInput';
import type { ApiError } from '@/types';

const employeeLoginSchema = z.object({
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .regex(/^[A-Za-z0-9-]+$/, 'Use your staff badge code (e.g. EMP001)'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type EmployeeLoginFormValues = z.infer<typeof employeeLoginSchema>;

/**
 * Employee sign-in (Phase 10).
 *
 * Staff sign in with their badge code through `/auth/employee/login` and
 * land straight on the counter till — never on the command centre.
 */
export function EmployeeLoginPage() {
  const [searchParams] = useSearchParams();
  const { loginAsEmployee } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeLoginFormValues>({
    resolver: zodResolver(employeeLoginSchema),
    defaultValues: { employeeId: '', password: '', rememberMe: true },
  });

  const rememberMe = watch('rememberMe') ?? false;

  const onSubmit = async (values: EmployeeLoginFormValues) => {
    setServerError(null);
    try {
      const redirectTo = searchParams.get('redirect') ?? ROUTES.EMPLOYEE_BILLING;
      await loginAsEmployee(
        {
          employeeId: values.employeeId,
          password: values.password,
          rememberMe: values.rememberMe,
        },
        redirectTo,
      );
    } catch (error) {
      setServerError((error as ApiError)?.message ?? 'Unable to start shift. Please try again.');
    }
  };

  const fillDemo = () => {
    setValue('employeeId', DEMO_EMPLOYEE_CREDENTIALS.employeeId, { shouldValidate: true });
    setValue('password', DEMO_EMPLOYEE_CREDENTIALS.password, { shouldValidate: true });
  };

  return (
    <AuthLayout backLink={{ label: 'Back to login options', to: ROUTES.LOGIN }}>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="h-3 w-3" />
            Staff shift
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Start your shift</h1>
          <p className="text-sm text-muted-foreground">
            Enter your staff badge ID to open the counter till.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-sm">
          <p className="font-medium text-foreground">Try the demo staff badge</p>
          <p className="mt-0.5 text-muted-foreground">
            {DEMO_EMPLOYEE_CREDENTIALS.employeeId} · {DEMO_EMPLOYEE_CREDENTIALS.password}
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
            label="Employee ID"
            type="text"
            autoComplete="username"
            placeholder="EMP001"
            className="uppercase"
            error={errors.employeeId?.message}
            {...register('employeeId')}
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your shift password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Checkbox
            label="Remember me on this till"
            checked={rememberMe}
            onChange={(event) => setValue('rememberMe', event.target.checked)}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<BadgeCheck className="h-4 w-4" />}>
            Start Shift
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Store owner?{' '}
          <Link to={ROUTES.ADMIN_LOGIN} className="font-medium text-primary hover:underline">
            Sign in to the command centre
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default EmployeeLoginPage;
