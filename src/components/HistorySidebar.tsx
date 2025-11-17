import { Difficulty, Puzzle } from '../core/types';
import Button from './ui/Button';
import { MathJax } from 'better-react-mathjax';

interface HistoryEntry {
  puzzle: Puzzle;
  solved: boolean;
  finalGuess: string;
  timestamp: number;
}

interface HistorySidebarProps {
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
}

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

const HistorySidebar = ({ entries, onLoad }: HistorySidebarProps) => {
  return (
    <aside className="hidden h-full flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-sm shadow-inner shadow-black/10 lg:flex">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">History</p>
        <span className="text-[11px] text-[var(--muted)]">{entries.length} saved</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {entries.length === 0 && (
          <p className="text-xs text-[var(--muted)]">No previous puzzles yet.</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.timestamp}
            className="rounded-md border border-[var(--border)] bg-[var(--panel-soft)] p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[var(--text)]">#{entry.puzzle.id}</span>
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{
                    backgroundColor: difficultyStyle(entry.puzzle.difficulty).bg,
                    color: difficultyStyle(entry.puzzle.difficulty).text
                  }}
                >
                  {entry.puzzle.difficulty}
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {entry.solved ? 'Solved' : 'Unsolved'}
                </span>
              </div>
              <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onLoad(entry)}>
                Load
              </Button>
            </div>
            <div className="mt-2 text-xs text-[var(--muted)] break-words">
              <MathJax dynamic inline>{`\\( f(x) = ${entry.puzzle.functionTex} \\)`}</MathJax>
            </div>
            {entry.finalGuess && (
              <div className="mt-1 text-[11px] text-[var(--muted)] break-words">
                <MathJax dynamic inline>{`\\( ${entry.finalGuess} \\)`}</MathJax>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default HistorySidebar;
