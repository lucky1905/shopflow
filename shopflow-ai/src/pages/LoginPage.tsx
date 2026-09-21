import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { ROUTES } from '@/constants';
import { DEMO_CREDENTIALS } from '@/services';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordInput } from '@/components/forms/PasswordInput';
import type { ApiError } from '@/types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Sign-in screen with RHF + Zod validation, demo hint and redirect support. */
export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const rememberMe = watch('rememberMe') ?? false;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const redirectTo = searchParams.get('redirect') ?? ROUTES.DASHBOARD;
      await login({ email: values.email, password: values.password, rememberMe: values.rememberMe }, redirectTo);
    } catch (error) {
      setServerError((error as ApiError)?.message ?? 'Unable to sign in. Please try again.');
    }
  };

  const fillDemo = () => {
    setValue('email', DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue('password', DEMO_CREDENTIALS.password, { shouldValidate: true });
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage inventory, sales and insights.
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm">
          <p className="font-medium text-foreground">Try the demo account</p>
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

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<LogIn className="h-4 w-4" />}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to ShopFlow AI?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Continue as guest →
        </button>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
