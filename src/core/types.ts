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
}

export interface HelperExpression {
  id: number;
  expression: string;
  color: string;
  visible: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accent: string;
  enabledDifficulties: Difficulty[];
  showMathPreview: boolean;
  showGrid: boolean;
  showAxes: boolean;
  boldGuessLine: boolean;
}
