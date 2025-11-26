export type Difficulty =
  | 'very easy'
  | 'easy'
  | 'medium-easy'
  | 'medium'
  | 'hard-medium'
  | 'hard'
  | 'very hard';

export interface Puzzle {
  id: number;
  functionTex: string;
  difficulty: Difficulty;
  allowedComponents: string[];
  timeLimit?: number;
  zoomLimit?: number;
  hintsEnabled?: boolean;
}

export type ChallengeType = 'daily' | 'weekly' | 'monthly';

export interface ChallengeWindow {
  type: ChallengeType;
  key: string;
  label: string;
  startAt: number;
  resetAt: number;
  seed: string;
  puzzleId: number;
}

export type CompletionType = ChallengeType | 'regular' | 'timed';

export interface HelperExpression {
  id: number;
  expression: string;
  color: string;
  visible: boolean;
}

export interface AccuracyScore {
  id: string;
  label: string;
  percent: number;
  color: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accent: string;
  enabledDifficulties: Difficulty[];
  showMathPreview: boolean;
  showGrid: boolean;
  showAxes: boolean;
  boldGuessLine: boolean;
  controlPanelWidth: number;
  historyWidth: number;
  functionLengthTarget: number;
  timedMinutes: number;
}
