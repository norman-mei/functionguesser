'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LeaderboardEntry } from '@/lib/stats';
import clsx from 'clsx';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';

const medalColor = (color: LeaderboardEntry['color']) => {
  switch (color) {
    case 'gold':
      return 'bg-amber-400 text-slate-900';
    case 'silver':
      return 'bg-slate-200 text-slate-900';
    case 'bronze':
      return 'bg-amber-700 text-amber-50';
    default:
      return 'bg-slate-700 text-slate-100';
  }
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { entries?: LeaderboardEntry[] };
        if (!cancelled) {
          const normalized =
            data.entries?.map((e) => ({
              ...e,
              totalsByType: {
                daily: e.totalsByType.daily ?? 0,
                weekly: e.totalsByType.weekly ?? 0,
                monthly: e.totalsByType.monthly ?? 0,
                timed: (e.totalsByType as any).timed ?? 0,
                regular: e.totalsByType.regular ?? 0
              },
              streaks: {
                daily: e.streaks.daily ?? 0,
                weekly: e.streaks.weekly ?? 0,
                monthly: e.streaks.monthly ?? 0,
                timed: (e.streaks as any).timed ?? 0,
                regular: e.streaks.regular ?? 0
              }
            })) ?? [];
          setEntries(normalized);
        }
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="flex w-full flex-col gap-6 px-4 pb-12 pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Live rankings
            </div>
            <div>
              <h1 className="text-3xl font-bold">Challenge Leaderboard</h1>
              <p className="text-sm text-[var(--muted)]">
                Ranked by daily/weekly/monthly/timed clears and streak strength. Gold for 1st, silver for 2nd, bronze for 3rd, gray for the rest.
              </p>
              <p className="mt-1 text-xs text-rose-400">Cheating, botting, or collusion to inflate scores leads to permanent removal from the leaderboard.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-expanded={showInfo}
              className="rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              More info
            </button>
            <Link
              href="/"
              className="rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              ← Back to main game
            </Link>
          </div>
        </div>

        <Modal title="How streaks and totals work" isOpen={showInfo} onClose={() => setShowInfo(false)} className="max-w-xl">
          <div className="space-y-3 text-[var(--text)]">
            <p className="text-sm text-[var(--muted)]">
              Streaks stay separate by challenge type so daily grinders don’t collide with timed-mode speedsters.
            </p>
            <ul className="space-y-2 list-disc pl-5 text-sm text-[var(--muted)]">
              <li>Streaks track daily, weekly, monthly, timed, and regular play independently.</li>
              <li>Daily resets run Sun→Sat; weekly starts on Sunday; monthly resets on the 1st.</li>
              <li>Timed streaks only count clears inside the timer window.</li>
              <li>Totals sum every challenge type; streaks display as D / W / M / T / R.</li>
            </ul>
          </div>
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-xl shadow-black/10">
          <div className="grid grid-cols-[80px_1.5fr_1fr_1.4fr_1.4fr] gap-2 border-b border-[var(--border)] bg-[var(--panel-soft)] px-6 py-3 text-xs uppercase tracking-wide text-[var(--muted)]">
            <span>#</span>
            <span>Player</span>
            <span>Total clears</span>
            <span>Streaks (D / W / M / T / R)</span>
            <span>Type totals</span>
          </div>
          {loading && (
            <div className="px-6 py-6 text-sm text-[var(--muted)]">Loading leaderboard…</div>
          )}
          {!loading && entries.length === 0 && (
            <div className="px-6 py-6 text-sm text-[var(--muted)]">
              {user ? 'No completions yet. Finish challenges to appear here.' : 'No completions yet. Sign in and finish challenges to appear here.'}
            </div>
          )}
          {!loading &&
            entries.map((entry, idx) => (
              <div
                key={`${entry.name}-${idx}`}
                className={clsx(
                  'grid grid-cols-[80px_1.5fr_1fr_1.4fr_1.4fr] items-center gap-2 px-6 py-4 text-sm',
                  idx % 2 === 0 ? 'bg-[var(--panel)]' : 'bg-[var(--panel-soft)]',
                  entry.isCurrentUser && 'border-l-4 border-[var(--accent)]'
                )}
              >
                <div className={clsx('inline-flex h-9 w-12 items-center justify-center rounded-full text-xs font-bold', medalColor(entry.color))}>
                  {idx + 1}
                </div>
                <div className="truncate font-semibold">
                  {entry.name}
                  {entry.isCurrentUser && <span className="ml-2 text-[11px] text-[var(--accent)]">(you)</span>}
                </div>
                <div className="text-[var(--muted)]">{entry.totalCompletions}</div>
                <div className="text-[var(--muted)]">
                  {entry.streaks.daily} / {entry.streaks.weekly} / {entry.streaks.monthly} / {entry.streaks.timed} / {entry.streaks.regular}
                </div>
                <div className="text-[var(--muted)]">
                  D:{entry.totalsByType.daily} · W:{entry.totalsByType.weekly} · M:{entry.totalsByType.monthly} · T:{entry.totalsByType.timed} · R:{entry.totalsByType.regular}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
