import { Puzzle, HelperExpression } from '../core/types';
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
}

const ControlPanel = ({
  puzzle,
  helperExpressions,
  finalGuess,
  isCorrect,
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
  autoAdvanceSeconds
}: ControlPanelProps) => {
  return (
    <aside className="flex h-full w-full flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm shadow-lg shadow-black/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Current puzzle</p>
          <p className="text-base font-semibold text-[var(--text)]">#{puzzle.id}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Difficulty:</span>
            <span
              className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: difficultyStyle(puzzle.difficulty).bg,
                color: difficultyStyle(puzzle.difficulty).text
              }}
            >
              {puzzle.difficulty}
            </span>
          </div>
        </div>
        <Button variant="secondary" onClick={onOpenRules}>
          Rules / Info
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] p-3">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Target Function</p>
        <div className="flex items-center gap-3">
          <span className="font-medium text-[var(--text)]">f(x) =</span>
          <div className="h-7 flex-1 rounded-md bg-black/80" aria-label="Hidden function" />
        </div>
        <div className="mt-2 flex items-center justify-end">
          {!showSolution ? (
            <Button variant="ghost" className="text-xs" onClick={onShowSolution}>
              Show solution (dev)
            </Button>
          ) : (
            <span className="text-xs text-[var(--muted)] break-all">
              <MathJax dynamic inline>{`\\( f(x) = ${puzzle.functionTex} \\)`}</MathJax>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Your Guess</label>
          {isCorrect !== null && (
            <span
              className={`text-xs font-semibold ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isCorrect ? 'Looks correct!' : 'Not quite yet'}
            </span>
          )}
        </div>
        <MathInput
          value={finalGuess}
          onChange={onFinalGuessChange}
          placeholder="Type your full function here"
          showPreview={showMathPreview}
        />
        {isCorrect && autoAdvanceSeconds !== null && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-2 text-xs text-[var(--text)]">
            Correct! Auto-moving to the next puzzle in {autoAdvanceSeconds}s, or click “New Puzzle”.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Helper Expressions</p>
          <Button variant="secondary" onClick={onAddHelper}>
            Add Helper
          </Button>
        </div>

        <div className="space-y-3">
          {helperExpressions.map((helper) => (
            <div
              key={helper.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] p-3 shadow-inner shadow-black/10"
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={helper.color}
                  onChange={(e) => onHelperColorChange(helper.id, e.target.value)}
                  className="h-9 w-10 cursor-pointer rounded-md border border-[var(--border)] bg-[var(--input-bg)]"
                  aria-label="Helper color"
                />
                <Input
                  value={helper.expression}
                  placeholder="sin(x), f(x) - sin(x), a*sin(x)..."
                  onChange={(e) => onHelperChange(helper.id, e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={helper.visible}
                    onChange={() => onToggleHelper(helper.id)}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  Show on graph
                </label>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => onRemoveHelper(helper.id)}>
                    🗑️ Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onResetPuzzle}>
          Reset
        </Button>
        <Button onClick={onNewPuzzle}>New Puzzle</Button>
      </div>
    </aside>
  );
};

export default ControlPanel;
