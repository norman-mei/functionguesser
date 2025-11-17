import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluate } from 'mathjs';
import GraphingCalculator from './GraphingCalculator';
import ControlPanel from './ControlPanel';
import Modal from './ui/Modal';
import HistorySidebar from './HistorySidebar';
import Button from './ui/Button';
import { HelperExpression, Puzzle, UserSettings } from '../core/types';
import { generatePuzzle } from '../core/puzzles';

const colorPalette = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#f59e0b'];

const stripDefinition = (latex: string) => latex.replace(/^[a-zA-Z]\(x\)\s*=\s*/, '');

const latexToMathExpression = (latex: string) => {
  let expr = stripDefinition(latex);
  const replacements: Array<[RegExp, string]> = [
    [/\\left|\\right/g, ''],
    [/\\cdot/g, '*'],
    [/\\times/g, '*'],
    [/\\sin/g, 'sin'],
    [/\\cos/g, 'cos'],
    [/\\tan/g, 'tan'],
    [/\\ln/g, 'log'],
    [/\\log/g, 'log'],
    [/\\exp/g, 'exp'],
    [/e\^{([^}]+)}/g, 'exp($1)'],
    [/\\abs{([^}]+)}/g, 'abs($1)'],
    [/\\sqrt{([^}]+)}/g, 'sqrt($1)'],
    [/\\pi/g, 'pi'],
    [/e\^\(/g, 'exp(']
  ];

  replacements.forEach(([pattern, value]) => {
    expr = expr.replace(pattern, value);
  });

  expr = expr.replace(/\{([^{}]+)\}/g, '($1)');
  expr = expr.replace(/\\+/g, '');
  expr = expr.replace(/(\d)x/g, '$1*x');
  expr = expr.replace(/x(\d)/g, 'x*$1');
  expr = expr.replace(/(\d)\(/g, '$1*(');
  expr = expr.replace(/\)(\d|x)/g, ')*$1');
  expr = expr.replace(/([a-df-zA-DF-Z])(\d)/g, '$1*$2');
  return expr;
};

const evaluateAt = (latex: string, x: number) => {
  const expression = latexToMathExpression(latex);
  return evaluate(expression, { x });
};

const isClose = (a: number, b: number, tolerance = 0.01) => Math.abs(a - b) <= tolerance;

const createHelpers = (): HelperExpression[] => [
  { id: 1, expression: '', color: colorPalette[0], visible: true },
  { id: 2, expression: '', color: colorPalette[1], visible: true }
];

interface HistoryEntry {
  puzzle: Puzzle;
  solved: boolean;
  finalGuess: string;
  timestamp: number;
}

interface GameContainerProps {
  settings: UserSettings;
}

const GameContainer = ({ settings }: GameContainerProps) => {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(settings.enabledDifficulties));
  const [helpers, setHelpers] = useState<HelperExpression[]>(createHelpers);
  const [nextHelperId, setNextHelperId] = useState(3);
  const [finalGuess, setFinalGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showSolutionPrompt, setShowSolutionPrompt] = useState(false);
  const [solutionError, setSolutionError] = useState('');
  const [solutionPassword, setSolutionPassword] = useState('');
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionAuthorized, setSolutionAuthorized] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const advanceIntervalRef = useRef<number | null>(null);

  const checkGuess = useCallback(
    (guessLatex: string) => {
      const cleanGuess = stripDefinition(guessLatex.trim());
      if (!cleanGuess) {
        setIsCorrect(null);
        return;
      }

      const samplePoints = [-4, -2, -1, 0, 1, 2, 3, 4];
      try {
        const correct = samplePoints.every((x) => {
          const targetY = evaluateAt(puzzle.functionTex, x);
          const guessY = evaluateAt(cleanGuess, x);
          return isClose(targetY as number, guessY as number);
        });
        setIsCorrect(correct);
      } catch (err) {
        setIsCorrect(false);
      }
    },
    [puzzle.functionTex]
  );

  const handleAddHelper = () => {
    const color = colorPalette[(helpers.length + 1) % colorPalette.length];
    setHelpers((prev) => [...prev, { id: nextHelperId, expression: '', color, visible: true }]);
    setNextHelperId((id) => id + 1);
  };

  const handleHelperChange = (id: number, expression: string) => {
    setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, expression } : h)));
  };

  const handleHelperColorChange = (id: number, color: string) => {
    setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, color } : h)));
  };

  const handleToggleHelper = (id: number) => {
    setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, visible: !h.visible } : h)));
  };

  const handleRemoveHelper = (id: number) => {
    setHelpers((prev) => prev.filter((h) => h.id !== id));
  };

  const handleFinalGuessChange = (value: string) => {
    setFinalGuess(value);
    checkGuess(value);
  };

  const clearAdvanceTimers = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    if (advanceIntervalRef.current !== null) {
      window.clearInterval(advanceIntervalRef.current);
      advanceIntervalRef.current = null;
    }
    setAutoAdvanceSeconds(null);
  }, []);

  const handleReset = useCallback(() => {
    clearAdvanceTimers();
    setHelpers(createHelpers());
    setNextHelperId(3);
    setFinalGuess('');
    setIsCorrect(null);
    setShowSolution(false);
    setShowSolutionPrompt(false);
    setSolutionError('');
    setSolutionPassword('');
    setSolutionLoading(false);
  }, [clearAdvanceTimers]);

  const archiveCurrentPuzzle = useCallback(() => {
    setHistory((prev) => [
      {
        puzzle,
        solved: isCorrect === true,
        finalGuess,
        timestamp: Date.now()
      },
      ...prev
    ]);
  }, [finalGuess, isCorrect, puzzle]);

  const handleNewPuzzle = useCallback(() => {
    clearAdvanceTimers();
    archiveCurrentPuzzle();
    setPuzzle(generatePuzzle(settings.enabledDifficulties));
    handleReset();
  }, [archiveCurrentPuzzle, clearAdvanceTimers, handleReset, settings.enabledDifficulties]);

  useEffect(() => {
    // Regenerate when enabled difficulties change to reflect user preference immediately.
    setPuzzle(generatePuzzle(settings.enabledDifficulties));
    handleReset();
  }, [settings.enabledDifficulties, handleReset]);

  const handleLoadFromHistory = useCallback(
    (entry: HistoryEntry) => {
      clearAdvanceTimers();
      setPuzzle(entry.puzzle);
      setFinalGuess(entry.finalGuess);
      setIsCorrect(entry.solved ? true : null);
      setShowSolution(false);
      setHelpers(createHelpers());
      setHistory((prev) => prev.filter((h) => h.timestamp !== entry.timestamp));
    },
    [clearAdvanceTimers]
  );

  const handleVerifySolution = useCallback(async () => {
    if (!solutionPassword) {
      setSolutionError('Please enter the password.');
      return;
    }

    setSolutionLoading(true);
    setSolutionError('');

    try {
      const response = await fetch('/api/verify-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: solutionPassword })
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      const message = payload?.message ?? 'Unable to verify password.';

      if (!response.ok) {
        setSolutionError(response.status === 401 ? 'Incorrect password.' : message);
        return;
      }

      setShowSolution(true);
      setShowSolutionPrompt(false);
      setSolutionAuthorized(true);
      setSolutionPassword('');
    } catch (err) {
      setSolutionError('Unable to contact the server. Please try again.');
    } finally {
      setSolutionLoading(false);
    }
  }, [solutionPassword]);

  const handleRequestShowSolution = useCallback(() => {
    if (solutionAuthorized) {
      setShowSolution(true);
      setShowSolutionPrompt(false);
      return;
    }

    setShowSolutionPrompt(true);
  }, [solutionAuthorized]);

  useEffect(() => {
    clearAdvanceTimers();
    if (!isCorrect) return;

    setAutoAdvanceSeconds(10);
    advanceIntervalRef.current = window.setInterval(
      () =>
        setAutoAdvanceSeconds((s) => {
          if (s === null) return s;
          return Math.max(0, s - 1);
        }),
      1000
    );

    advanceTimeoutRef.current = window.setTimeout(() => {
      handleNewPuzzle();
    }, 10000);

    return () => {
      clearAdvanceTimers();
    };
  }, [isCorrect, handleNewPuzzle, clearAdvanceTimers]);

  const puzzleLatex = `f(x)=${puzzle.functionTex}`;
  const guessLatex = finalGuess.includes('=') ? finalGuess : `g(x)=${finalGuess}`;

  return (
    <div className="grid h-full min-h-[80vh] grid-cols-1 gap-4 md:grid-cols-[380px_1fr] lg:grid-cols-[380px_1fr_340px]">
      <ControlPanel
        puzzle={puzzle}
        helperExpressions={helpers}
        finalGuess={finalGuess}
        isCorrect={isCorrect}
        onHelperChange={handleHelperChange}
        onHelperColorChange={handleHelperColorChange}
        onToggleHelper={handleToggleHelper}
        onRemoveHelper={handleRemoveHelper}
        onAddHelper={handleAddHelper}
        onFinalGuessChange={handleFinalGuessChange}
        onNewPuzzle={handleNewPuzzle}
        onResetPuzzle={handleReset}
        onOpenRules={() => setShowRules(true)}
        showMathPreview={settings.showMathPreview}
        showSolution={showSolution}
        onShowSolution={handleRequestShowSolution}
        autoAdvanceSeconds={autoAdvanceSeconds}
      />

      <GraphingCalculator
        targetLatex={puzzleLatex}
        helperExpressions={helpers}
        finalGuess={guessLatex}
        showGrid={settings.showGrid}
        showAxes={settings.showAxes}
        boldGuessLine={settings.boldGuessLine}
      />

      <HistorySidebar entries={history} onLoad={handleLoadFromHistory} />

      <Modal title="How to Play" isOpen={showRules} onClose={() => setShowRules(false)}>
        <div className="space-y-2 text-[var(--text)]">
          <p className="text-sm">
            The graph shows a secret function <code>f(x)</code>. It’s drawn, but the equation is hidden.
            Your job: use helper lines to peel it apart, then submit your best full guess.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Type helper expressions (e.g., <code>sin(x)</code> or <code>f(x)-sin(x)</code>) to compare shapes.</li>
            <li>Use sliders Desmos offers (e.g., <code>a*sin(x)</code>) to tune coefficients.</li>
            <li>Type your full function in “Your Guess” and watch it overlay the target.</li>
            <li>Green message means correct; you’ll auto-advance in 10s or click New Puzzle.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-[var(--text)]">What functions are allowed?</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text)]">
            <li>Polynomials and roots</li>
            <li>sin, cos, tan</li>
            <li>exp / e^x, ln / log</li>
            <li>Absolute value and simple piecewise</li>
          </ul>
        </div>

        <div className="space-y-1 text-xs text-[var(--muted)]">
          <p>Tips: keep expressions within x,y ≈ [-10, 10] to stay in view.</p>
          <p>Use the math keypad for common symbols, and “Show solution (dev)” if you’re debugging.</p>
        </div>
      </Modal>

      <Modal
        title="Developer Reveal"
        isOpen={showSolutionPrompt}
        onClose={() => {
          setShowSolutionPrompt(false);
          setSolutionError('');
          setSolutionPassword('');
          setSolutionLoading(false);
        }}
      >
        <div className="space-y-3 text-sm text-[var(--text)]">
          <p>Enter the developer password to reveal the solution.</p>
          <input
            type="password"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text)] outline-none"
            placeholder="Password"
            value={solutionPassword}
            onChange={(e) => {
              setSolutionPassword(e.target.value);
              setSolutionError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleVerifySolution();
              }
            }}
          />
          {solutionError && <p className="text-xs text-rose-400">{solutionError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSolutionPrompt(false);
                setSolutionError('');
                setSolutionPassword('');
                setSolutionLoading(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleVerifySolution()}
              disabled={solutionLoading}
            >
              {solutionLoading ? 'Checking...' : 'Reveal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GameContainer;
