import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { ROUTES } from '@/constants';
import { authService } from '@/services';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/forms/PasswordInput';
import type { ApiError } from '@/types';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/** Step 2 of recovery: choose a new password (token comes from the email link). */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    try {
      await authService.resetPassword(
        { password: values.password, confirmPassword: values.confirmPassword },
        token ?? undefined,
      );
      setDone(true);
    } catch (error) {
      setServerError((error as ApiError)?.message ?? 'Unable to reset your password. The link may have expired.');
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Your password has been reset. Sign in with your new credentials to continue.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            {token
              ? 'Choose a strong password to secure your store.'
              : 'This reset link looks invalid or expired – request a fresh one below.'}
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4" noValidate>
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<KeyRound className="h-4 w-4" />}>
            Reset password
          </Button>
        </form>

        <Link to={ROUTES.LOGIN} className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
