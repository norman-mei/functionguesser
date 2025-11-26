import type { Metadata } from 'next';

import { Suspense } from 'react';
import AccountPanel from '@/components/auth/AccountPanel';

export const metadata: Metadata = {
  title: 'Account | Function Guesser',
  description: 'Create an account to sync Function Guesser progress and manage your credentials.'
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-[var(--muted)]">Loading account...</div>}>
        <AccountPanel />
      </Suspense>
    </div>
  );
}
