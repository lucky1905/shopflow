import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { ROUTES } from '@/constants';
import { authService } from '@/services';
import { useToast } from '@/hooks';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ApiError } from '@/types';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/** Step 1 of recovery: request a reset link (never reveals account existence). */
export function ForgotPasswordPage() {
  const { fromError } = useToast();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authService.forgotPassword(values);
      setSentTo(values.email);
    } catch (error) {
      fromError((error as ApiError)?.message ?? 'Unable to send the reset link.');
    }
  };

  if (sentTo) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
              a password-reset link is on its way. It expires in 60 minutes.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your work email and we will send you a secure reset link.
          </p>
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
          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<Mail className="h-4 w-4" />}>
            Send reset link
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

export default ForgotPasswordPage;
