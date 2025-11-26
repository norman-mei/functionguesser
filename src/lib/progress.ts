import { CompletionType } from '../core/types';

export interface CompletionPayload {
  type: CompletionType;
  key: string;
  periodStart: number;
}

export const recordCompletion = async (payload: CompletionPayload) => {
  try {
    await fetch('/api/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Swallow network errors; leaderboard will simply miss this completion.
  }
};
