import { ChallengeType, ChallengeWindow, Difficulty, Puzzle } from '../core/types';
import { generatePuzzle } from '../core/puzzles';
import { createSeededRng, hashStringToNumber } from './random';

const labels: Record<ChallengeType, string> = {
  daily: 'Daily Challenge',
  weekly: 'Weekly Challenge',
  monthly: 'Monthly Challenge'
};

const difficultyLadder: Difficulty[] = [
  'very easy',
  'easy',
  'medium-easy',
  'medium',
  'hard-medium',
  'hard',
  'very hard'
];

const pad = (value: number) => value.toString().padStart(2, '0');

const startOfWeekSunday = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay(); // 0 = Sunday
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const getChallengeWindow = (type: ChallengeType, now = new Date()): ChallengeWindow => {
  const current = new Date(now);
  let key = '';
  let startAt: number;
  let resetAt: number;

  if (type === 'daily') {
    const start = new Date(current);
    start.setHours(0, 0, 0, 0);
    const next = new Date(start);
    next.setDate(start.getDate() + 1);
    key = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    startAt = start.getTime();
    resetAt = next.getTime();
  } else if (type === 'weekly') {
    const start = startOfWeekSunday(current);
    const next = new Date(start);
    next.setDate(start.getDate() + 7);
    key = `week-${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    startAt = start.getTime();
    resetAt = next.getTime();
  } else {
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const next = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    start.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    key = `month-${start.getFullYear()}-${pad(start.getMonth() + 1)}`;
    startAt = start.getTime();
    resetAt = next.getTime();
  }

  const seed = `${type}-${key}`;
  const puzzleId = 100000 + (hashStringToNumber(seed) % 900000);

  return {
    type,
    key,
    label: labels[type],
    startAt,
    resetAt,
    seed,
    puzzleId
  };
};

export const buildChallengePuzzle = (type: ChallengeType): { window: ChallengeWindow; puzzle: Puzzle } => {
  const window = getChallengeWindow(type);
  const rng = createSeededRng(window.seed);
  const allowedDifficulties = type === 'daily' ? pickDailyDifficulties(window, rng) : undefined;
  const puzzle = generatePuzzle(allowedDifficulties, { rng, idOverride: window.puzzleId });
  return { window, puzzle };
};

export const formatResetCountdown = (resetAt: number, now = Date.now()) => {
  const diff = resetAt - now;
  if (diff <= 0) return 'Resets soon';

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getSundayWeekNumber = (date: Date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  const startDay = startOfYear.getDay(); // 0 = Sunday
  const firstSunday = startDay === 0 ? startOfYear : new Date(startOfYear.getFullYear(), 0, 1 + (7 - startDay));
  firstSunday.setHours(0, 0, 0, 0);
  const diff = date.getTime() - firstSunday.getTime();
  if (diff < 0) return 1;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
};

export const formatChallengeTitle = (window: ChallengeWindow) => {
  const start = new Date(window.startAt);
  if (window.type === 'daily') {
    return start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }
  if (window.type === 'weekly') {
    const weekNumber = getSundayWeekNumber(start);
    const padded = weekNumber.toString().padStart(2, '0');
    const end = new Date(window.resetAt - 1);
    const formatRange = (d: Date) =>
      `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    return `Week ${padded}, ${start.getFullYear()} (${formatRange(start)} - ${formatRange(end)})`;
  }
  const monthName = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return monthName;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const pickDailyDifficulties = (window: ChallengeWindow, rng: () => number): Difficulty[] => {
  const start = new Date(window.startAt);
  const day = start.getDay(); // 0 = Sunday .. 6 = Saturday
  const maxIndex = difficultyLadder.length - 1;
  const baseIndex = Math.round((day / 6) * maxIndex);
  const jitter = Math.floor(rng() * 3) - 1; // -1,0,1
  const target = clamp(baseIndex + jitter, 0, maxIndex);

  // Occasionally broaden to adjacent bucket for slight variation but still monotonic over the week.
  const neighbors: number[] = [target];
  if (rng() > 0.65 && target > 0) neighbors.push(target - 1);
  if (rng() > 0.65 && target < maxIndex) neighbors.push(target + 1);

  const unique = Array.from(new Set(neighbors));
  return unique.map((idx) => difficultyLadder[idx]);
};
