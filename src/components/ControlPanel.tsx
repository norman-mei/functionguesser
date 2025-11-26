import { useState } from 'react';
import { Puzzle, HelperExpression, AccuracyScore } from '../core/types';
import Button from './ui/Button';
import Input from './ui/Input';
import MathInput from './MathInput';
import { Difficulty } from '../core/types';
import { MathJax } from 'better-react-mathjax';

const difficultyStyle = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'very hard':
      return { bg: '#dc2626', text: '#fff' };
    case 'hard':
      return { bg: '#f87171', text: '#0f172a' };
    case 'hard-medium':
      return { bg: '#fb923c', text: '#0f172a' };
    case 'medium':
      return { bg: '#f97316', text: '#0f172a' };
    case 'medium-easy':
      return { bg: '#a3e635', text: '#0f172a' };
    case 'easy':
      return { bg: '#86efac', text: '#0f172a' };
    case 'very easy':
    default:
      return { bg: '#22c55e', text: '#0f172a' };
  }
};

interface ControlPanelProps {
  puzzle: Puzzle;
  helperExpressions: HelperExpression[];
  finalGuess: string;
  isCorrect: boolean | null;
  accuracyScores: AccuracyScore[];
  accuracyMessage?: string | null;
  hintsAllowed?: boolean;
  hintsLeft?: number;
  hintReveal?: string;
  onUseHint?: () => void;
  onHelperChange: (id: number, value: string) => void;
  onHelperColorChange: (id: number, color: string) => void;
  onToggleHelper: (id: number) => void;
  onRemoveHelper: (id: number) => void;
  onAddHelper: () => void;
  onFinalGuessChange: (value: string) => void;
  onNewPuzzle: () => void;
  onResetPuzzle: () => void;
  onOpenRules: () => void;
  showMathPreview: boolean;
  showSolution: boolean;
  onShowSolution: () => void;
  autoAdvanceSeconds: number | null;
  challengeLabel?: string | null;
  disableNewPuzzle?: boolean;
  lockedReason?: string;
  puzzleLabel?: string;
  showWeekInfo?: boolean;
  todayLabel?: string;
  onUserAction?: () => void;
  timeLeft?: number | null;
  hideSolutionActions?: boolean;
  solutionNote?: string;
}

const ControlPanel = ({
  puzzle,
  helperExpressions,
  finalGuess,
  isCorrect,
  accuracyScores,
  accuracyMessage,
  hintsAllowed = false,
  hintsLeft = 0,
  hintReveal = '',
  onUseHint,
  onHelperChange,
  onHelperColorChange,
  onToggleHelper,
  onRemoveHelper,
  onAddHelper,
  onFinalGuessChange,
  onNewPuzzle,
  onResetPuzzle,
  onOpenRules,
  showMathPreview,
  showSolution,
  onShowSolution,
  autoAdvanceSeconds,
  challengeLabel,
  disableNewPuzzle = false,
  lockedReason,
  puzzleLabel,
  showWeekInfo = false,
  todayLabel,
  onUserAction,
  timeLeft,
  hideSolutionActions = false,
  solutionNote
}: ControlPanelProps) => {
  const [copied, setCopied] = useState(false);

  const percentColor = (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    const hue = (clamped / 100) * 120; // 0 = red, 120 = green
    return `hsl(${hue}deg 70% 45%)`;
  };

  const handleCopySolution = async () => {
    const text = `f(x) = ${puzzle.functionTex}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col gap-6 rounded-xl border bg-card p-6 text-sm shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current puzzle</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-lg font-bold tracking-tight text-foreground">
              {puzzleLabel ?? `#${puzzle.id}`}
            </p>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm"
              style={{
                backgroundColor: difficultyStyle(puzzle.difficulty).bg,
                color: difficultyStyle(puzzle.difficulty).text
              }}
            >
              {puzzle.difficulty}
            </span>
          </div>

          {challengeLabel && (
            <div className="mt-3 inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {challengeLabel}
                {showWeekInfo && (
                  <span
                    role="img"
                    aria-label="Info"
                    title={`Weekly challenges start on Sunday and ramp difficulty through Saturday.${todayLabel ? ` Today is ${todayLabel}.` : ''}`}
                    className="cursor-help opacity-70 hover:opacity-100"
                  >
                    ℹ️
                  </span>
                )}
              </p>
            </div>
          )}
          {timeLeft !== undefined && timeLeft !== null && (
            <div className="mt-2 text-lg font-bold text-primary tabular-nums">
              ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onOpenRules}>
          Rules
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target Function</p>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">
            <MathJax dynamic inline>{'\\( f(x) = \\)'}</MathJax>
          </span>
          {showSolution ? (
            <div className="flex flex-1 items-center justify-between gap-2 rounded-md border bg-background px-3 py-1.5 shadow-sm">
              <span className="text-sm font-medium text-foreground break-all">
                <MathJax dynamic inline>{`\\( ${puzzle.functionTex} \\)`}</MathJax>
              </span>
              {!hideSolutionActions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] uppercase tracking-wider"
                  onClick={handleCopySolution}
                  aria-label="Copy solution"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>
          ) : (
            <div className="h-9 flex-1 rounded-md bg-foreground/10 animate-pulse" aria-label="Hidden function" />
          )}
        </div>
        {solutionNote && (
          <p className="mt-2 text-xs text-muted-foreground">{solutionNote}</p>
        )}
        {!hideSolutionActions && (
          <div className="mt-2 flex items-center justify-end">
            {!showSolution && (
              <Button variant="ghost" size="sm" className="h-auto py-1 text-xs text-muted-foreground hover:text-foreground" onClick={onShowSolution}>
                Reveal Solution
              </Button>
            )}
          </div>
        )}
        {hintsAllowed && (
          <div className="mt-3 rounded-md border bg-background px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Hints</span>
              <span className="text-muted-foreground">Left: {hintsLeft}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onUseHint}
                disabled={hintsLeft <= 0}
                className="h-7 text-xs"
              >
                Reveal character
              </Button>
              {hintReveal && (
                <span className="text-[11px] font-mono text-foreground break-all">
                  hint: f(x)= {hintReveal}
                  {hintReveal.length < (puzzle.functionTex?.length ?? 0) ? '…' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Guess</label>
          {isCorrect !== null && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCorrect ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          )}
        </div>
        <MathInput
          value={finalGuess}
          onChange={onFinalGuessChange}
          placeholder="Type your full function here"
          showPreview={showMathPreview}
          onInteract={onUserAction}
        />
        {isCorrect && autoAdvanceSeconds !== null && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-800 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-300">
            Correct! Next puzzle in {autoAdvanceSeconds}s...
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accuracy Function</p>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">0-100%</span>
        </div>
        {accuracyMessage ? (
          <p className="text-xs text-muted-foreground">{accuracyMessage}</p>
        ) : (
          <div className="space-y-3">
            {accuracyScores.map((score) => (
              <div key={score.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-[var(--border)] shadow-inner"
                      style={{ backgroundColor: score.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">{score.label}</span>
                  </div>
                  <span className="font-semibold text-foreground">{score.percent.toFixed(2)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full shadow-sm transition-all duration-500"
                    style={{
                      width: `${score.percent}%`,
                      backgroundColor: percentColor(score.percent)
                    }}
                  />
                </div>
              </div>
            ))}
            {accuracyScores.length === 0 && (
              <p className="text-xs text-muted-foreground">No accuracy data yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        <div className="flex items-center justify-between sticky top-0 bg-card pb-2 z-10">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Helper Expressions</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onUserAction?.();
              onAddHelper();
            }}
          >
            + Add Helper
          </Button>
        </div>

        <div className="space-y-3">
          {helperExpressions.map((helper) => (
            <div
              key={helper.id}
              className="group rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-[var(--border)] shadow-inner"
                    style={{ backgroundColor: helper.color }}
                    aria-hidden="true"
                  />
                  <input
                    type="color"
                    value={helper.color}
                    onChange={(e) => {
                      onUserAction?.();
                      onHelperColorChange(helper.id, e.target.value);
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Helper color"
                  />
                </div>
                <div className="relative flex-1">
                  <Input
                    value={helper.expression}
                    onChange={(e) => {
                      onUserAction?.();
                      onHelperChange(helper.id, e.target.value);
                    }}
                    spellCheck={false}
                    className="h-9 text-sm"
                  />
                  {!helper.expression.trim() && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">
                      <MathJax dynamic inline>{'\\( \\sin(x),\\; f(x)-\\sin(x) \\)'}</MathJax>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-2 opacity-60 transition-opacity group-hover:opacity-100">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={helper.visible}
                    onChange={() => {
                      onUserAction?.();
                      onToggleHelper(helper.id);
                    }}
                    className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                  />
                  Show on graph
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    onUserAction?.();
                    onRemoveHelper(helper.id);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onResetPuzzle}>
          Reset
        </Button>
        {disableNewPuzzle ? (
          <Button disabled className="opacity-50 cursor-not-allowed" title={lockedReason ?? 'Locked'}>
            Locked
          </Button>
        ) : (
          <Button onClick={onNewPuzzle} className="bg-primary text-primary-foreground hover:bg-primary/90">
            New Puzzle
          </Button>
        )}
      </div>
    </aside>
  );
};

export default ControlPanel;
