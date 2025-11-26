import { NextResponse } from 'next/server';
import { ChallengeCategory } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type CompletionType = 'daily' | 'weekly' | 'monthly' | 'regular' | 'timed';

interface Streaks {
  daily: number;
  weekly: number;
  monthly: number;
  regular: number;
  timed: number;
}

interface LeaderboardEntry {
  name: string;
  totalCompletions: number;
  totalsByType: Record<CompletionType, number>;
  streaks: Streaks;
  color: 'gold' | 'silver' | 'bronze' | 'gray';
  isCurrentUser?: boolean;
}

const typeMap: Record<ChallengeCategory, CompletionType> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  REGULAR: 'regular',
  TIMED: 'timed'
};

const computeStreak = (periods: number[], gapMs: number) => {
  if (periods.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < periods.length; i++) {
    const diff = periods[i - 1] - periods[i];
    if (diff >= gapMs - 1000 && diff <= gapMs + 1000) {
      streak += 1;
    } else if (diff === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
};

export async function GET() {
  const currentUser = await getCurrentUser();

  const completions = await prisma.challengeCompletion.findMany({
    include: { user: true },
    orderBy: { periodStart: 'desc' }
  });

  const byUser = new Map<
    string,
    {
      id: string;
      name: string;
      completions: { type: CompletionType; periodStart: number }[];
      totals: Record<CompletionType, number>;
    }
  >();

  completions.forEach((completion) => {
    const type = typeMap[completion.type];
    const userId = completion.userId;
    if (!byUser.has(userId)) {
      byUser.set(userId, {
        id: completion.userId,
        name: completion.user.username ?? completion.user.email,
        completions: [],
        totals: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          regular: 0,
          timed: 0
        }
      });
    }
    const ref = byUser.get(userId)!;
    ref.completions.push({ type, periodStart: completion.periodStart.getTime() });
    ref.totals[type] += 1;
  });

  const entries: LeaderboardEntry[] = Array.from(byUser.values()).map((user) => {
    const getPeriods = (t: CompletionType) =>
      user.completions
        .filter((c) => c.type === t)
        .map((c) => c.periodStart)
        .sort((a, b) => b - a);

    const streaks: Streaks = {
      daily: computeStreak(getPeriods('daily'), 86400000),
      weekly: computeStreak(getPeriods('weekly'), 7 * 86400000),
      monthly: computeStreak(getPeriods('monthly'), 30 * 86400000), // approx
      regular: computeStreak(getPeriods('regular'), 86400000),
      timed: computeStreak(getPeriods('timed'), 86400000)
    };

    const totalCompletions =
      user.totals.daily + user.totals.weekly + user.totals.monthly + user.totals.timed;

    return {
      name: user.name,
      totalsByType: user.totals,
      totalCompletions,
      streaks,
      color: 'gray',
      isCurrentUser: currentUser ? user.id === currentUser.id : false
    };
  });

  entries.sort((a, b) => {
    if (b.totalCompletions !== a.totalCompletions) {
      return b.totalCompletions - a.totalCompletions;
    }
    const streakSum = (s: Streaks) => s.daily + s.weekly + s.monthly + s.regular;
    return streakSum(b.streaks) - streakSum(a.streaks);
  });

  const top = entries.slice(0, 100).map((entry, idx) => ({
    ...entry,
    color: idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : 'gray',
    isCurrentUser: entry.isCurrentUser
  }));

  return NextResponse.json({ entries: top });
}
