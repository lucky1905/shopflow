import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/forms/PasswordInput';
import type { ApiError } from '@/types';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    storeName: z.string().min(1, 'Store name is required').max(100),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

/** Sign-up screen: account + store details with inline Zod validation. */
export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { register: signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      storeName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const redirectTo = searchParams.get('redirect') ?? ROUTES.DASHBOARD;
      await signUp(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          storeName: values.storeName,
          email: values.email,
          password: values.password,
        },
        redirectTo,
      );
    } catch (error) {
      setServerError((error as ApiError)?.message ?? 'Unable to create your account. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Set up your store in under a minute. No credit card required.
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" autoComplete="given-name" placeholder="Alex" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" autoComplete="family-name" placeholder="Morgan" error={errors.lastName?.message} {...register('lastName')} />
          </div>

          <Input
            label="Store name"
            autoComplete="organization"
            placeholder="Downtown Market"
            error={errors.storeName?.message}
            {...register('storeName')}
          />

          <Input
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@yourstore.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordInput
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {serverError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<Store className="h-4 w-4" />}>
            Create store
          </Button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
