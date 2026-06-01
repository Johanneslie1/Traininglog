import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerUser } from '@/services/firebase/auth';
import { setUser } from '@/features/auth/authSlice';
import { AppLogo } from '@/components/brand';
import { Button } from '@/components/ui';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const user = await registerUser(data);
      dispatch(setUser(user));
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-bg-secondary p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-8 text-center">
            <AppLogo className="mx-auto h-16 w-16" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-text-tertiary">Gym Keeper</p>
            <h1 className="mt-2 text-3xl font-bold text-text-primary">Create your account</h1>
            <p className="mt-2 text-sm text-text-secondary">Start with an athlete workspace. Coach tools can be enabled when your role is upgraded.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-text-secondary">
                  First name
                </label>
                <input
                  {...register('firstName')}
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="block w-full rounded-2xl border border-border bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-focus-ring/40"
                  placeholder="First"
                />
                {errors.firstName && (
                  <p className="mt-2 text-sm text-error-text">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-text-secondary">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="block w-full rounded-2xl border border-border bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-focus-ring/40"
                  placeholder="Last"
                />
                {errors.lastName && (
                  <p className="mt-2 text-sm text-error-text">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-text-secondary">
                Email address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full rounded-2xl border border-border bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-focus-ring/40"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-error-text">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="block w-full rounded-2xl border border-border bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-focus-ring/40"
                placeholder="At least 6 characters"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-error-text">{errors.password.message}</p>
              )}
            </div>

          {error && (
              <div className="rounded-xl border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
                {error}
              </div>
          )}

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
            >
              Create account
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-accent-primary hover:text-accent-hover underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
