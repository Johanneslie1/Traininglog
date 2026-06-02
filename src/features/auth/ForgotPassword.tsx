import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestPasswordReset } from '@/services/firebase/auth';
import { AppLogo } from '@/components/brand';
import { Button } from '@/components/ui';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');

      await requestPasswordReset(data);
      setSuccessMessage('If an account exists for that email, a password reset link has been sent.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link. Please try again.');
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
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-text-tertiary">TrainingLog</p>
            <h1 className="mt-2 text-3xl font-bold text-text-primary">Reset your password</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Enter your email address and we will send you a password reset link.
            </p>
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

          {error && (
              <div className="rounded-xl border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
                {error}
              </div>
          )}

          {successMessage && (
              <div className="rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success-text">
                {successMessage}
              </div>
          )}

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
            >
              Send reset link
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="block w-full text-center text-sm font-medium text-accent-primary hover:text-accent-hover underline"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
