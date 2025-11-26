export type CompletionType = 'daily' | 'weekly' | 'monthly' | 'regular' | 'timed';

export interface Streaks {
  daily: number;
  weekly: number;
  monthly: number;
  regular: number;
  timed: number;
}

export interface LeaderboardEntry {
  name: string;
  totalCompletions: number;
  totalsByType: Record<CompletionType, number>;
  streaks: Streaks;
  color: 'gold' | 'silver' | 'bronze' | 'gray';
  isCurrentUser?: boolean;
}
