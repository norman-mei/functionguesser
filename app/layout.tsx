import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Function Guesser',
  description: 'Guess the hidden function from its graph.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
