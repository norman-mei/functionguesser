'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';

import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onResetPuzzles?: () => void;
}

type NavItem = {
  href: string;
  label: string;
  isActive?: (path: string) => boolean;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Play', isActive: (path) => path === '/' || path.startsWith('/play') },
  { href: '/timed', label: 'Timed' },
  { href: '/daily', label: 'Daily' },
  { href: '/weekly', label: 'Weekly' },
  { href: '/monthly', label: 'Monthly' },
  { href: '/scribble', label: 'Scribble' },
  { href: '/create', label: 'Create' },
  { href: '/your-levels', label: 'Your Levels' },
  { href: '/online', label: 'Online' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/rules', label: 'Rules' }
];

const Header = ({ onOpenSettings, onResetPuzzles }: HeaderProps) => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string, active: boolean) => {
    if (href === '/scribble' && active && pathname.startsWith('/scribble')) {
      event.preventDefault();
      window.location.href = '/scribble';
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="flex w-full flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-foreground">
            <Image
              src="/favicon.ico"
              alt="Function Guesser logo"
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            <span className="leading-none">Function Guesser</span>
          </Link>

          <nav className="flex min-w-0 overflow-x-auto md:ml-2">
            <div className="flex items-center gap-1 whitespace-nowrap">
              {navItems.map((item) => {
                const active = item.isActive ? item.isActive(pathname) : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href, active)}
                    className={clsx(
                      'rounded-full border border-transparent px-3 py-1.5 text-sm transition hover:border-border hover:bg-secondary',
                      active &&
                      'border-[var(--accent)] bg-secondary text-foreground shadow-[inset_0_0_0_1px_var(--accent)]'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/account"
            className="group flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            <span className="flex h-2 w-2 items-center justify-center rounded-full bg-[var(--accent)]">
              <span className="sr-only">status</span>
            </span>
            {user ? (
              <span className="max-w-[10rem] truncate">{user.username ?? user.email}</span>
            ) : loading ? (
              <span className="text-[var(--muted)]">Checking account…</span>
            ) : (
              <span>Account</span>
            )}
          </Link>

          {onResetPuzzles && (
            <button
              onClick={onResetPuzzles}
              className="rounded-full border border-rose-500/60 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:border-rose-300"
              aria-label="Reset puzzles progress"
            >
              Reset puzzles
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className={clsx(
              'group relative flex items-center gap-2 overflow-hidden rounded-full border border-border bg-secondary px-2 py-1 text-lg transition'
            )}
            aria-label="Open settings"
          >
            <span className="transition-transform group-hover:rotate-90">⚙️</span>
            <span className="max-w-0 translate-x-[-10px] text-sm text-[var(--muted)] opacity-0 transition-all duration-300 group-hover:max-w-[120px] group-hover:translate-x-0 group-hover:opacity-100">
              Settings
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
