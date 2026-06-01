import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser } from '@/services/firebase/auth';
import { setUser } from '@/features/auth/authSlice';
import { AppLogo } from '@/components/brand';
import { Button } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');

      const user = await loginUser(data);
      dispatch(setUser(user));
      navigate('/');
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
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
            <h1 className="mt-2 text-3xl font-bold text-text-primary">Welcome back</h1>
            <p className="mt-2 text-sm text-text-secondary">Sign in to log training, review progress, and stay connected.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                autoComplete="current-password"
                className="block w-full rounded-2xl border border-border bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-focus-ring/40"
                placeholder="Enter your password"
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

            <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium text-accent-primary hover:text-accent-hover underline"
            >
              Forgot password?
            </button>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
            >
              Sign in
            </Button>

            <p className="text-center text-sm text-text-secondary">
              New user?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-accent-primary hover:text-accent-hover underline"
              >
                Create account
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
