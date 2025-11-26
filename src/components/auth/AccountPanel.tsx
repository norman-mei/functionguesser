'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useAuth } from '@/context/AuthContext';

type SignupFormState = {
  email: string;
  confirmEmail: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormState, string>>;

type LoginFormState = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

const initialSignup: SignupFormState = {
  email: '',
  confirmEmail: '',
  username: '',
  password: '',
  confirmPassword: ''
};

const initialLogin: LoginFormState = {
  identifier: '',
  password: '',
  rememberMe: false
};

const cardClass =
  'rounded-3xl border border-[var(--border)] bg-[var(--panel)]/70 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-[var(--muted)]/60';

export default function AccountPanel() {
  const searchParams = useSearchParams();
  const verifiedState = searchParams.get('verified');

  const { user, loading, refresh, logoutLocally } = useAuth();
  const [signupForm, setSignupForm] = useState<SignupFormState>(initialSignup);
  const [signupErrors, setSignupErrors] = useState<SignupFormErrors>({});
  const [signupStatus, setSignupStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [signupApiError, setSignupApiError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLogin);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailForm, setEmailForm] = useState<{ newEmail: string; currentPassword: string }>({
    newEmail: '',
    currentPassword: ''
  });
  const [emailStatus, setEmailStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameForm, setUsernameForm] = useState<{ username: string }>({ username: '' });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (verifiedState === 'success') {
      setSignupStatus('success');
      setResendStatus('idle');
      setResendMessage('Email verified! You can now sign in.');
    } else if (verifiedState === 'error') {
      setResendMessage('The verification link is invalid or expired. Request a new one below.');
      setResendStatus('error');
    }
  }, [verifiedState]);

  useEffect(() => {
    if (user?.username) {
      setUsernameForm({ username: user.username });
    }
  }, [user?.username]);

  const passwordChecklist = useMemo(
    () => [
      { label: '8 or more characters', met: signupForm.password.length >= 8 },
      { label: 'Upper + lower case mix', met: /[A-Z]/.test(signupForm.password) && /[a-z]/.test(signupForm.password) },
      { label: 'At least one symbol', met: /[^A-Za-z0-9]/.test(signupForm.password) }
    ],
    [signupForm.password]
  );

  const handleSignupChange =
    (field: keyof SignupFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setSignupForm((prev) => ({ ...prev, [field]: event.target.value }));
      setSignupErrors((prev) => ({ ...prev, [field]: undefined }));
      setSignupApiError(null);
    };

  const handleLoginChange =
    (field: keyof LoginFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setLoginForm((prev) => ({
        ...prev,
        [field]: field === 'rememberMe' ? event.target.checked : event.target.value
      }));
      setLoginError(null);
    };

const validateSignup = (): SignupFormErrors => {
  const errors: SignupFormErrors = {};
  const email = signupForm.email.trim();
  const confirmEmail = signupForm.confirmEmail.trim();
  const username = signupForm.username.trim();

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (confirmEmail !== email) {
    errors.confirmEmail = 'Email addresses do not match.';
  }

  if (username && username.length < 2) {
    errors.username = 'Username must be at least 2 characters.';
  }

  if (
    signupForm.password.length < 8 ||
    !/[A-Z]/.test(signupForm.password) ||
      !/[a-z]/.test(signupForm.password) ||
      !/[^A-Za-z0-9]/.test(signupForm.password)
    ) {
      errors.password = 'Password must meet all requirements.';
    }

    if (signupForm.confirmPassword !== signupForm.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupStatus('submitting');
    setSignupApiError(null);
    const normalizedEmail = signupForm.email.trim();
    const validationErrors = validateSignup();

    if (Object.keys(validationErrors).length > 0) {
      setSignupErrors(validationErrors);
      setSignupStatus('idle');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          username: signupForm.username.trim(),
          password: signupForm.password,
          confirmPassword: signupForm.confirmPassword
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSignupApiError(payload?.error ?? 'Unable to create account. Please try again.');
        setSignupStatus('idle');
        return;
      }

      setSignupStatus('success');
      setResendStatus('idle');
      setResendMessage(null);
    } catch (error) {
      console.error(error);
      setSignupApiError('Network error. Please try again.');
      setSignupStatus('idle');
    }
  };

  const handleResendVerification = async () => {
    const normalizedEmail = signupForm.email.trim();

    if (!normalizedEmail) {
      setResendStatus('error');
      setResendMessage('Enter your email above so we know where to send the link.');
      return;
    }

    setResendStatus('sending');
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setResendStatus('error');
        setResendMessage(
          payload?.error ?? 'Unable to resend the email right now. Please try again.'
        );
        return;
      }

      setResendStatus('sent');
      setResendMessage(
        payload?.message ?? 'If that account exists, a new verification email is on its way.'
      );
    } catch (error) {
      console.error(error);
      setResendStatus('error');
      setResendMessage('Network error. Please try again.');
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginStatus('submitting');
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLoginError(payload?.error ?? 'Unable to log in. Check your credentials.');
        setLoginStatus('idle');
        return;
      }

      setLoginStatus('success');
      setLoginForm(initialLogin);
      await refresh();
    } catch (error) {
      console.error(error);
      setLoginError('Network error. Please try again.');
      setLoginStatus('idle');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logoutLocally();
    await refresh();
  };

  const handleChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailStatus('submitting');
    setEmailError(null);
    setEmailMessage(null);

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          await refresh();
        }
        setEmailStatus('idle');
        setEmailError(payload?.error ?? 'Unable to update email.');
        return;
      }

      setEmailStatus('success');
      setEmailMessage(payload?.message ?? 'Email updated. Check your inbox to verify the new address.');
      setEmailForm({ newEmail: '', currentPassword: '' });
      await refresh();
    } catch (error) {
      console.error(error);
      setEmailStatus('idle');
      setEmailError('Network error. Please try again.');
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordStatus('submitting');
    setPasswordError(null);
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('idle');
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          await refresh();
        }
        setPasswordStatus('idle');
        setPasswordError(payload?.error ?? 'Unable to update password.');
        return;
      }

      setPasswordStatus('success');
      setPasswordMessage(payload?.message ?? 'Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      setPasswordStatus('idle');
      setPasswordError('Network error. Please try again.');
    }
  };

  const handleChangeUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsernameStatus('submitting');
    setUsernameError(null);
    setUsernameMessage(null);

    const nextUsername = usernameForm.username.trim();
    if (!nextUsername) {
      setUsernameStatus('idle');
      setUsernameError('Username cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nextUsername })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          await refresh();
        }
        setUsernameStatus('idle');
        setUsernameError(payload?.error ?? 'Unable to update username.');
        return;
      }

      setUsernameStatus('success');
      setUsernameMessage(payload?.message ?? 'Username updated.');
      await refresh();
    } catch (error) {
      console.error(error);
      setUsernameStatus('idle');
      setUsernameError('Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Account</p>
          <h1 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl">Sync + Security</h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Create a profile to save your streaks and experiments across devices. Email verification keeps
            accounts locked down.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
        >
          ← Back to homepage
        </Link>
      </div>

      {verifiedState === 'success' && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Email verified! You can now log in and start syncing.
        </div>
      )}

      {verifiedState === 'error' && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          The verification link is invalid or expired. Request a new link below.
        </div>
      )}

      {user ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={clsx(cardClass, 'p-6')}>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Signed in</p>
                <p className="text-xl font-semibold text-[var(--text)]">{user.email}</p>
                <p className="text-sm text-[var(--muted)]">
                  Username: <span className="font-semibold text-[var(--text)]">{user.username ?? 'pending'}</span>
                </p>
              </div>
              <p className="text-sm text-[var(--muted)]">
                Sessions last 7 days (or 30 with “remember me”). Log out everywhere by clearing active devices.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:-translate-y-0.5"
                >
                  Log out
                </button>
                {loading && (
                  <span className="text-xs text-[var(--muted)]">Refreshing session…</span>
                )}
              </div>
            </div>
          </section>

          <section className={clsx(cardClass, 'p-6 space-y-4')}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Update username</h3>
                <p className="text-sm text-[var(--muted)]">This can be used to sign in.</p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Profile
              </span>
            </div>
            <form className="space-y-3" onSubmit={handleChangeUsername}>
              <Field
                id="new-username"
                label="Username"
                type="text"
                value={usernameForm.username}
                onChange={(event) => setUsernameForm({ username: event.target.value })}
                helperText="2-32 chars. Letters, numbers, symbols allowed."
                required
              />
              {usernameMessage && <p className="text-sm font-semibold text-emerald-300">{usernameMessage}</p>}
              {usernameError && <p className="text-sm font-semibold text-rose-300">{usernameError}</p>}
              <button
                type="submit"
                disabled={usernameStatus === 'submitting'}
                className="w-full rounded-full bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {usernameStatus === 'submitting' ? 'Updating…' : 'Save username'}
              </button>
            </form>
          </section>

          <section className={clsx(cardClass, 'p-6 space-y-4')}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">Update email</h3>
                  <p className="text-sm text-[var(--muted)]">Confirm with your current password.</p>
                </div>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Verification required
                </span>
              </div>
            <form className="space-y-3" onSubmit={handleChangeEmail}>
              <Field
                id="new-email"
                label="New email"
                type="email"
                value={emailForm.newEmail}
                onChange={(event) =>
                  setEmailForm((prev) => ({ ...prev, newEmail: event.target.value }))
                }
                autoComplete="email"
                required
              />
              <Field
                id="current-password-for-email"
                label="Current password"
                type="password"
                value={emailForm.currentPassword}
                onChange={(event) =>
                  setEmailForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
                autoComplete="current-password"
                required
              />
              {emailMessage && (
                <p className="text-sm font-semibold text-emerald-300">{emailMessage}</p>
              )}
              {emailError && <p className="text-sm font-semibold text-rose-300">{emailError}</p>}
              <button
                type="submit"
                disabled={emailStatus === 'submitting'}
                className="w-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailStatus === 'submitting' ? 'Updating…' : 'Update email'}
              </button>
            </form>
          </section>

          <section className={clsx(cardClass, 'p-6 space-y-4 lg:col-span-2')}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Change password</h3>
                <p className="text-sm text-[var(--muted)]">We hash everything server-side.</p>
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Security
              </div>
            </div>
            <form className="grid gap-4 sm:grid-cols-3" onSubmit={handleChangePassword}>
              <Field
                id="current-password"
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
                autoComplete="current-password"
                required
              />
              <Field
                id="new-password"
                label="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
                autoComplete="new-password"
                required
              />
              <Field
                id="confirm-new-password"
                label="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                autoComplete="new-password"
                required
              />
              <div className="sm:col-span-3 space-y-2">
                {passwordMessage && (
                  <p className="text-sm font-semibold text-emerald-300">{passwordMessage}</p>
                )}
                {passwordError && (
                  <p className="text-sm font-semibold text-rose-300">{passwordError}</p>
                )}
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={passwordStatus === 'submitting'}
                  className="w-full rounded-full bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordStatus === 'submitting' ? 'Updating…' : 'Save new password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <section className={clsx(cardClass, 'p-6 space-y-4')}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Create account</p>
                <h2 className="text-xl font-semibold text-[var(--text)]">Start syncing progress</h2>
                <p className="text-sm text-[var(--muted)]">
                  We&apos;ll email you a verification link. Passwords are hashed before storing.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Required
              </span>
            </div>
            <form className="space-y-4" onSubmit={handleRegister}>
              <Field
                id="email"
                label="Email address"
                type="email"
                value={signupForm.email}
                onChange={handleSignupChange('email')}
                error={signupErrors.email}
                autoComplete="email"
                required
              />
              <Field
                id="confirm-email"
                label="Confirm email address"
                type="email"
                value={signupForm.confirmEmail}
                onChange={handleSignupChange('confirmEmail')}
                error={signupErrors.confirmEmail}
                autoComplete="email"
                required
              />
              <Field
                id="username"
                label="Username"
                type="text"
                value={signupForm.username}
                onChange={handleSignupChange('username')}
                error={signupErrors.username}
                helperText="Used for sign-in too. Leave blank to get an auto-generated handle."
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  value={signupForm.password}
                  onChange={handleSignupChange('password')}
                  error={signupErrors.password}
                  autoComplete="new-password"
                />
                <Field
                  id="confirm-password"
                  label="Confirm password"
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange('confirmPassword')}
                  error={signupErrors.confirmPassword}
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--panel)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--text)]">Password requirements</p>
                <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                  {passwordChecklist.map((rule) => (
                    <li key={rule.label} className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'inline-flex h-2.5 w-2.5 rounded-full',
                          rule.met ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                        )}
                      />
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>

              {signupApiError && (
                <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {signupApiError}
                </div>
              )}

              <button
                type="submit"
                disabled={signupStatus === 'submitting'}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#ec4899] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signupStatus === 'success' ? 'Verification sent' : 'Create account'}
              </button>
            </form>

            {signupStatus === 'success' && (
              <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--panel-soft)]/70 p-4 text-sm text-[var(--muted)]">
                <p className="font-semibold text-[var(--text)]">
                  Check your inbox for a verification email.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending'}
                    className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] sm:w-auto"
                  >
                    {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                  </button>
                  {resendMessage && (
                    <p
                      className={clsx(
                        'text-sm',
                        resendStatus === 'error' ? 'text-rose-200' : 'text-emerald-200'
                      )}
                    >
                      {resendMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className={clsx(cardClass, 'p-6 space-y-4')}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Sign in</p>
                <h2 className="text-xl font-semibold text-[var(--text)]">Welcome back</h2>
                <p className="text-sm text-[var(--muted)]">
                  Verified accounts can sync settings and streaks across devices.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Secure
              </span>
            </div>
            <form className="space-y-3" onSubmit={handleLogin}>
              <Field
                id="login-identifier"
                label="Email or username"
                type="text"
                value={loginForm.identifier}
                onChange={handleLoginChange('identifier')}
                autoComplete="username"
                required
              />
              <Field
                id="login-password"
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange('password')}
                autoComplete="current-password"
                required
              />
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={handleLoginChange('rememberMe')}
                  className="rounded border-[var(--border)] bg-[var(--panel)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                Remember me for 30 days
              </label>

              {loginError && <p className="text-sm text-rose-200">{loginError}</p>}
              {loginStatus === 'success' && (
                <p className="text-sm text-emerald-200">Welcome back! Loading your data…</p>
              )}

              <button
                type="submit"
                disabled={loginStatus === 'submitting'}
                className="w-full rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginStatus === 'submitting' ? 'Signing in…' : 'Log in'}
              </button>
            </form>
          </section>
        </div>
      )}

      {loading && (
        <p className="text-xs text-[var(--muted)]">Checking your account status…</p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  error,
  helperText,
  autoComplete,
  required
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        className={clsx(
          'w-full rounded-2xl border bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text)] outline-none transition',
          error
            ? 'border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/40'
            : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30'
        )}
      />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {!error && helperText && <p className="text-xs text-[var(--muted)]">{helperText}</p>}
    </div>
  );
}
