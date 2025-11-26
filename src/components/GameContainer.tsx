import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type MouseEvent as ReactMouseEvent
} from 'react';
import { MathJax } from 'better-react-mathjax';
import { evaluate } from 'mathjs';
import { Star } from 'lucide-react';
import GraphingCalculator from './GraphingCalculator';
import ControlPanel from './ControlPanel';
import Modal from './ui/Modal';
import HistorySidebar from './HistorySidebar';
import Button from './ui/Button';
import {
  ChallengeType,
  ChallengeWindow,
  CompletionType,
  HelperExpression,
  Puzzle,
  UserSettings,
  AccuracyScore
} from '../core/types';
import { generatePuzzle } from '../core/puzzles';
import { buildChallengePuzzle, formatChallengeTitle, formatResetCountdown } from '../lib/challenges';
import { recordCompletion } from '../lib/progress';
import { useAuth } from '@/context/AuthContext';

const colorPalette = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#f59e0b'];

const stripDefinition = (latex: string) =>
  latex.replace(/^\s*(?:[a-zA-Z](?:\([a-zA-Z]\))?\s*=|y\s*=)\s*/, '');

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
    [/\\left\|([^|]+)\\right\|/g, 'abs($1)'],
    [/\\sqrt{([^}]+)}/g, 'sqrt($1)'],
    [/\\pi/g, 'pi'],
    [/e\^\(/g, 'exp('],
    [/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)']
  ];

  replacements.forEach(([pattern, value]) => {
    expr = expr.replace(pattern, value);
  });

  expr = expr.replace(/\{([^{}]+)\}/g, '($1)');
  expr = expr.replace(/\|([^|]+)\|/g, 'abs($1)');
  expr = expr.replace(/\\+/g, '');
  expr = expr.replace(/(\d)x/g, '$1*x');
  expr = expr.replace(/x(\d)/g, 'x*$1');
  expr = expr.replace(/(\d)\(/g, '$1*(');
  expr = expr.replace(/\)(\d|x)/g, ')*$1');
  expr = expr.replace(/([a-df-zA-DF-Z])(\d)/g, '$1*$2');
  expr = expr.replace(/(\d)(sin|cos|tan|log|exp|abs|sqrt)/g, '$1*$2');
  return expr;
};

const evaluateIntegralIfPresent = (latex: string, x: number) => {
  const integralMatch = latex.match(/\\int_{([^}]*)}\\^{([^}]+)}\s*(.+)/);
  if (!integralMatch) return null;

  const [, lowerRaw, upperRaw, bodyRaw] = integralMatch;
  const body = bodyRaw.trim();
  const varMatch = body.match(/d([a-zA-Z])\s*$/);
  const variable = varMatch ? varMatch[1] : 't';
  const integrandLatex = varMatch ? body.slice(0, -varMatch[0].length).trim() : body;

  try {
    const integrandExpr = latexToMathExpression(integrandLatex);
    const lowerExpr = latexToMathExpression(lowerRaw);
    const upperExpr = latexToMathExpression(upperRaw);

    const steps = 80;
    const lowerVal = evaluate(lowerExpr, { x, [variable]: x }) as number;
    const upperVal = evaluate(upperExpr, { x, [variable]: x }) as number;
    const a = Math.min(lowerVal, upperVal);
    const b = Math.max(lowerVal, upperVal);
    const dir = upperVal >= lowerVal ? 1 : -1;
    const h = (b - a) / steps;
    let sum = 0;
    for (let i = 0; i <= steps; i++) {
      const t = a + h * i;
      const scope = { x, [variable]: t };
      const val = evaluate(integrandExpr, scope) as number;
      sum += i === 0 || i === steps ? val / 2 : val;
    }
    return dir * h * sum;
  } catch (err) {
    return null;
  }
};

const evaluateAt = (latex: string, x: number) => {
  const integralValue = evaluateIntegralIfPresent(latex, x);
  if (integralValue !== null) return integralValue;
  const expression = latexToMathExpression(latex);
  return evaluate(expression, { x });
};

const buildSamplePoints = (min: number, max: number) => {
  const steps = 300;
  const stepSize = (max - min) / steps;
  const points: number[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(min + stepSize * i);
  }
  return points;
};

const isClose = (a: number, b: number, tolerance = 0.01) => Math.abs(a - b) <= tolerance;

const createHelpers = (): HelperExpression[] => [
  { id: 1, expression: '', color: colorPalette[0], visible: true },
  { id: 2, expression: '', color: colorPalette[1], visible: true }
];

const deriveCustomPuzzleId = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 1000000;
};

interface HistoryEntry {
  puzzle: Puzzle;
  solved: boolean;
  finalGuess: string;
  timestamp: number;
  source: CompletionType;
}

interface GameContainerProps {
  settings: UserSettings;
  onNotify?: (message: string) => void;
  onSettingsChange: (next: Partial<UserSettings>) => void;
  challengeType?: ChallengeType;
  disableAutoAdvance?: boolean;
  onPuzzleSolved?: (puzzle: Puzzle) => void;
  completionType?: CompletionType;
  persistKey?: string | null;
  onUserAction?: () => void;
  customLevelId?: string;
  customLevelData?: any;
}

export type GameContainerHandle = {
  newPuzzle: () => void;
  archivePuzzle: () => void;
  resetPuzzleState: () => void;
};

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 560;
const MIN_HISTORY_WIDTH = 240;
const MAX_HISTORY_WIDTH = 520;
const STORED_PUZZLE_KEY = 'fg-current-puzzle';

const GameContainer = forwardRef<GameContainerHandle, GameContainerProps>(
  (
    {
      settings,
      onNotify,
      onSettingsChange,
      challengeType,
      disableAutoAdvance = false,
      onPuzzleSolved,
      completionType,
      persistKey = STORED_PUZZLE_KEY,
      onUserAction,
      customLevelId,
      customLevelData
    }: GameContainerProps,
    ref
  ) => {
    const { user } = useAuth();
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [challengeWindow, setChallengeWindow] = useState<ChallengeWindow | null>(null);
    const [resetCountdown, setResetCountdown] = useState('');
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
    const [historyOpen, setHistoryOpen] = useState(true);
    const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
    const [panelWidth, setPanelWidth] = useState(settings.controlPanelWidth);
    const [sidebarWidth, setSidebarWidth] = useState(settings.historyWidth);
    const [ratingAvg, setRatingAvg] = useState<number | null>(null);
    const [ratingCount, setRatingCount] = useState(0);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [hintReveal, setHintReveal] = useState('');
    const [accuracyScores, setAccuracyScores] = useState<AccuracyScore[]>([]);
    const [accuracyMessage, setAccuracyMessage] = useState<string | null>(
      'Enter a guess or a helper expression to see accuracy.'
    );
    const [viewBounds, setViewBounds] = useState<{ left: number; right: number } | null>(null);
    const dragStateRef = useRef<{ target: 'panel' | 'history'; startX: number; startWidth: number } | null>(null);
    const hasGeneratedInitialPuzzle = useRef(false);
    const challengeWindowRef = useRef<ChallengeWindow | null>(null);
    const lastDifficultyKeyRef = useRef<string | null>(null);
    const lastRecordedKeyRef = useRef<string | null>(null);
    const solvedRef = useRef(false);
    const buildPuzzle = useCallback(
      () => generatePuzzle(settings.enabledDifficulties, { maxLength: settings.functionLengthTarget }),
      [settings.enabledDifficulties, settings.functionLengthTarget]
    );
    const difficultyKey = useMemo(() => settings.enabledDifficulties.join(','), [settings.enabledDifficulties]);
    const isCustomLevel = !!customLevelId || !!customLevelData;
    const triggerUserAction = useCallback(() => {
      onUserAction?.();
    }, [onUserAction]);

    useEffect(() => {
      setPanelWidth(settings.controlPanelWidth);
    }, [settings.controlPanelWidth]);

    useEffect(() => {
      setSidebarWidth(settings.historyWidth);
    }, [settings.historyWidth]);
    useEffect(() => {
      if (!customLevelId) {
        setRatingAvg(null);
        setRatingCount(0);
        setUserRating(null);
      }
    }, [customLevelId]);
    const advanceTimeoutRef = useRef<number | null>(null);
    const advanceIntervalRef = useRef<number | null>(null);

    const checkGuess = useCallback(
      (guessLatex: string) => {
        if (!puzzle) {
          setIsCorrect(null);
          return;
        }

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
      [puzzle]
    );

    const handleRateLevel = useCallback(
      async (rating: number) => {
        if (!customLevelId) return;
        try {
          const res = await fetch(`/api/levels/${customLevelId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rate', rating })
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            onNotify?.(data.error ?? 'Failed to rate level');
            return;
          }
          setUserRating(rating);
          setRatingAvg(data.avgRating ?? null);
          setRatingCount(data.ratingCount ?? 0);
          onNotify?.('Thanks for rating!');
        } catch {
          onNotify?.('Failed to rate level');
        }
      },
      [customLevelId, onNotify]
    );

    const handleAddHelper = () => {
      triggerUserAction();
      const color = colorPalette[(helpers.length + 1) % colorPalette.length];
      setHelpers((prev) => [...prev, { id: nextHelperId, expression: '', color, visible: true }]);
      setNextHelperId((id) => id + 1);
    };

    const handleHelperChange = (id: number, expression: string) => {
      triggerUserAction();
      setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, expression } : h)));
    };

    const handleHelperColorChange = (id: number, color: string) => {
      triggerUserAction();
      setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, color } : h)));
    };

    const handleToggleHelper = (id: number) => {
      triggerUserAction();
      setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, visible: !h.visible } : h)));
    };

    const handleRemoveHelper = (id: number) => {
      triggerUserAction();
      setHelpers((prev) => prev.filter((h) => h.id !== id));
    };

    const handleFinalGuessChange = (value: string) => {
      triggerUserAction();
      setFinalGuess(value);
      checkGuess(value);
    };

    useEffect(() => {
      solvedRef.current = false;
      setHintsUsed(0);
      setHintReveal('');
    }, [puzzle?.id]);

    useEffect(() => {
      if (!puzzle) {
        setAccuracyScores([]);
        setAccuracyMessage(null);
        return;
      }

      const guessExpr = stripDefinition(finalGuess.trim());
      const filledHelpers = helpers.filter((helper) => helper.expression.trim());
      const hasAnyInput = !!guessExpr || filledHelpers.length > 0;

      if (!hasAnyInput) {
        setAccuracyScores([]);
        setAccuracyMessage('Enter a guess or a helper expression to see accuracy.');
        return;
      }

      const span = Math.min(Math.max(puzzle.zoomLimit ?? 10, 6), 18);
      const bounds = viewBounds ?? { left: -span, right: span };
      const samplePoints = buildSamplePoints(bounds.left, bounds.right);
      const targetPoints = samplePoints
        .map((x) => {
          try {
            const y = evaluateAt(puzzle.functionTex, x);
            return typeof y === 'number' && Number.isFinite(y) ? { x, y: y as number } : null;
          } catch {
            return null;
          }
        })
        .filter((point): point is { x: number; y: number } => !!point);

      if (targetPoints.length < 4) {
        setAccuracyScores([]);
        setAccuracyMessage('Accuracy is unavailable for this puzzle range.');
        return;
      }

      const computePercent = (expr: string): number | null => {
        const clean = stripDefinition(expr.trim());
        if (!clean) return null;

        const diffs: number[] = [];
        const magnitudes: number[] = [];

        targetPoints.forEach(({ x, y }) => {
          try {
            const value = evaluateAt(clean, x);
            if (typeof value !== 'number' || !Number.isFinite(value)) return;
            diffs.push(Math.abs((value as number) - y));
            magnitudes.push(Math.abs(y));
          } catch {
            // Ignore invalid points for this expression
          }
        });

        if (diffs.length < Math.max(3, Math.floor(targetPoints.length / 2))) {
          return null;
        }

        const mse = diffs.reduce((sum, v) => sum + v * v, 0) / diffs.length;
        const rmse = Math.sqrt(mse);
        const avgMag = magnitudes.reduce((sum, v) => sum + v, 0) / magnitudes.length;
        const normalized = rmse / Math.max(1, avgMag);
        const rawPercent = 100 / (1 + normalized);
        const percent = Math.max(0, Math.min(100, Number(rawPercent.toFixed(2))));
        return percent;
      };

      const nextScores: AccuracyScore[] = [];
      if (guessExpr) {
        const guessScore = computePercent(guessExpr);
        if (guessScore !== null) {
          nextScores.push({
            id: 'guess',
            label: 'Your guess',
            percent: guessScore,
            color: '#228b22'
          });
        }
      }

      filledHelpers.forEach((helper, idx) => {
        const score = computePercent(helper.expression);
        if (score !== null) {
          nextScores.push({
            id: `helper-${helper.id}`,
            label: `Helper ${idx + 1}`,
            percent: score,
            color: helper.color
          });
        }
      });

      if (nextScores.length === 0) {
        setAccuracyScores([]);
        setAccuracyMessage('Accuracy unavailable. Adjust your expressions to stay within view.');
        return;
      }

      setAccuracyScores(nextScores);
      setAccuracyMessage(null);
    }, [finalGuess, helpers, puzzle, viewBounds]);

    useEffect(() => {
      if (isCorrect && puzzle && !solvedRef.current) {
        solvedRef.current = true;
        onPuzzleSolved?.(puzzle);
      }
    }, [isCorrect, onPuzzleSolved, puzzle]);

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
      setAccuracyScores([]);
      setAccuracyMessage('Enter a guess or a helper expression to see accuracy.');
      setIsCorrect(null);
      setHintsUsed(0);
      setHintReveal('');
      solvedRef.current = false;
      setShowSolution(false);
      setShowSolutionPrompt(false);
      setSolutionError('');
      setSolutionPassword('');
      setSolutionLoading(false);
    }, [clearAdvanceTimers]);

    const archiveCurrentPuzzle = useCallback(() => {
      if (!puzzle) return;

      const entry = {
        puzzle,
        solved: isCorrect === true,
        finalGuess,
        timestamp: Date.now(),
        source: completionType ?? (challengeType ?? 'regular')
      };

      setHistory((prev) => {
        const filtered = prev.filter((h) => h.puzzle.id !== puzzle.id);
        return [entry, ...filtered];
      });
    }, [challengeType, completionType, finalGuess, isCorrect, puzzle]);

    const handleNewPuzzle = useCallback(() => {
      if (challengeType) return;

      clearAdvanceTimers();
      archiveCurrentPuzzle();
      setPuzzle(buildPuzzle());
      handleReset();
    }, [archiveCurrentPuzzle, buildPuzzle, challengeType, clearAdvanceTimers, handleReset]);

    useEffect(() => {
      if (challengeType) return;
      if (customLevelData) {
        const customPuzzleId = Math.abs(deriveCustomPuzzleId(
          customLevelData.name ?? customLevelData.functionTex ?? 'custom-level'
        ));
        setPuzzle({
          id: Math.max(1, customPuzzleId), // Ensure it's at least 1
          functionTex: customLevelData.functionTex,
          difficulty: customLevelData.difficulty,
          allowedComponents: [], // TODO: derive from functionTex if needed
          hintsEnabled:
            customLevelData.hintsEnabled ??
            (customLevelData.difficulty === 'very easy' || customLevelData.difficulty === 'easy')
        });
        hasGeneratedInitialPuzzle.current = true;
        return;
      }
      if (customLevelId) {
        // Fetch level data
        fetch(`/api/levels/${customLevelId}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              onNotify?.('Failed to load level');
              return;
            }
            const customPuzzleId = Math.abs(deriveCustomPuzzleId(customLevelId));
            setPuzzle({
              id: Math.max(1, customPuzzleId), // Ensure it's at least 1
              functionTex: data.functionTex,
              difficulty: data.difficulty,
              allowedComponents: [],
              hintsEnabled:
                data.hintsEnabled ??
                (data.difficulty === 'very easy' || data.difficulty === 'easy')
            });
            setRatingAvg(data.avgRating ?? null);
            setRatingCount(data.ratingCount ?? 0);
            setUserRating(data.userRating ?? null);
            // TODO: Handle timed mode and zoom limit from data
          })
          .catch(() => onNotify?.('Failed to load level'));
        hasGeneratedInitialPuzzle.current = true;
        return;
      }

      if (!hasGeneratedInitialPuzzle.current) {
        lastDifficultyKeyRef.current = difficultyKey;
        if (!puzzle) {
          setPuzzle(buildPuzzle());
        }
        hasGeneratedInitialPuzzle.current = true;
        return;
      }
      if (lastDifficultyKeyRef.current !== difficultyKey) {
        lastDifficultyKeyRef.current = difficultyKey;
        setPuzzle(buildPuzzle());
        handleReset();
      }
    }, [buildPuzzle, challengeType, difficultyKey, handleReset, customLevelData, customLevelId, onNotify, puzzle]);

    useEffect(() => {
      if (!challengeType) {
        challengeWindowRef.current = null;
        setChallengeWindow(null);
        if (isCustomLevel) return;
        // Load persisted puzzle for main play mode if available and difficulty set matches.
        if (persistKey) {
          const raw = localStorage.getItem(persistKey);
          if (raw) {
            try {
              const saved = JSON.parse(raw) as { puzzle: Puzzle; difficultyKey: string };
              if (saved.puzzle.id < 0) {
                localStorage.removeItem(persistKey);
                return;
              }
              if (saved.difficultyKey === difficultyKey) {
                setPuzzle(saved.puzzle);
                hasGeneratedInitialPuzzle.current = true;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
        return;
      }

      const refreshChallenge = () => {
        const { window, puzzle: challengePuzzle } = buildChallengePuzzle(challengeType);
        const hasChanged = !challengeWindowRef.current || challengeWindowRef.current.key !== window.key;
        if (hasChanged) {
          challengeWindowRef.current = window;
          setChallengeWindow(window);
          setPuzzle(challengePuzzle);
          handleReset();
        }
      };

      refreshChallenge();
      const interval = window.setInterval(refreshChallenge, 60000);
      return () => window.clearInterval(interval);
    }, [challengeType, difficultyKey, handleReset, isCustomLevel, persistKey]);

    useEffect(() => {
      if (!challengeWindow) {
        setResetCountdown('');
        return;
      }

      const updateCountdown = () => {
        setResetCountdown(formatResetCountdown(challengeWindow.resetAt));
      };

      updateCountdown();
      const interval = window.setInterval(updateCountdown, 60000);
      return () => window.clearInterval(interval);
    }, [challengeWindow]);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
      if (puzzle?.timeLimit) {
        setTimeLeft(puzzle.timeLimit);
        const interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev === null || prev <= 0) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      } else {
        setTimeLeft(null);
      }
    }, [puzzle?.id, puzzle?.timeLimit]);

    useEffect(() => {
      if (timeLeft === 0 && !isCorrect) {
        onNotify?.("Time's up!");
        // Optionally reveal solution or disable input
      }
    }, [timeLeft, isCorrect, onNotify]);

    useEffect(() => {
      if (challengeType) return;
      if (!puzzle) return;
      if (!persistKey) return;
      const payload = JSON.stringify({ puzzle, difficultyKey });
      localStorage.setItem(persistKey, payload);
    }, [challengeType, difficultyKey, persistKey, puzzle]);

    const handleLoadFromHistory = useCallback(
      (entry: HistoryEntry) => {
        if (challengeType) return;

        clearAdvanceTimers();
        setPuzzle(entry.puzzle);
        setFinalGuess(entry.finalGuess);
        setIsCorrect(entry.solved ? true : null);
        setShowSolution(false);
        setHelpers(createHelpers());
      },
      [challengeType, clearAdvanceTimers]
    );

    useImperativeHandle(
      ref,
      () => ({
        newPuzzle: () => {
          handleNewPuzzle();
        },
        archivePuzzle: () => {
          archiveCurrentPuzzle();
        },
        resetPuzzleState: () => {
          handleReset();
        }
      }),
      [archiveCurrentPuzzle, handleNewPuzzle, handleReset]
    );

    const clampWidth = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const handleDrag = useCallback(
      (event: MouseEvent) => {
        if (!dragStateRef.current) return;
        event.preventDefault();
        const { target, startX, startWidth } = dragStateRef.current;
        const delta = target === 'panel' ? event.clientX - startX : startX - event.clientX;
        if (target === 'panel') {
          const next = clampWidth(startWidth + delta, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH);
          setPanelWidth(next);
        } else {
          const next = clampWidth(startWidth + delta, MIN_HISTORY_WIDTH, MAX_HISTORY_WIDTH);
          setSidebarWidth(next);
        }
      },
      []
    );

    const stopDragListener = useCallback(
      (event: MouseEvent) => {
        if (!dragStateRef.current) return;
        const { target, startX, startWidth } = dragStateRef.current;
        const delta = target === 'panel' ? event.clientX - startX : startX - event.clientX;
        const nextWidth =
          target === 'panel'
            ? clampWidth(startWidth + delta, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH)
            : clampWidth(startWidth + delta, MIN_HISTORY_WIDTH, MAX_HISTORY_WIDTH);

        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', stopDragListener);
        dragStateRef.current = null;
        if (typeof nextWidth === 'number') {
          onSettingsChange(
            target === 'panel' ? { controlPanelWidth: nextWidth } : { historyWidth: nextWidth }
          );
        }
      },
      [handleDrag, onSettingsChange]
    );

    const startDragging = useCallback(
      (target: 'panel' | 'history') => (event: ReactMouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        const startWidth = target === 'panel' ? panelWidth : sidebarWidth;
        dragStateRef.current = {
          target,
          startX: event.clientX,
          startWidth
        };
        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', stopDragListener);
      },
      [handleDrag, panelWidth, sidebarWidth, stopDragListener]
    );

    useEffect(() => {
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', stopDragListener);
      };
    }, [handleDrag, stopDragListener]);

    const handleBoundsChange = useCallback((bounds: { left: number; right: number }) => {
      // Only update if significantly different to avoid thrashing
      setViewBounds((prev) => {
        if (!prev) return bounds;
        if (Math.abs(prev.left - bounds.left) < 0.1 && Math.abs(prev.right - bounds.right) < 0.1) {
          return prev;
        }
        return bounds;
      });
    }, []);

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
        onNotify?.('Settings saved');
      } catch (err) {
        setSolutionError('Unable to contact the server. Please try again.');
      } finally {
        setSolutionLoading(false);
      }
    }, [onNotify, solutionPassword]);

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
      if (challengeType || disableAutoAdvance) return;
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
    }, [challengeType, clearAdvanceTimers, disableAutoAdvance, handleNewPuzzle, isCorrect]);

    useEffect(() => {
      if (!user || !isCorrect || !puzzle) return;
      const type: CompletionType = completionType ?? (challengeType ?? 'regular');
      const key = challengeType && challengeWindow ? challengeWindow.key : `puzzle-${puzzle.id}`;
      if (lastRecordedKeyRef.current === key) return;
      const periodStart = challengeWindow?.startAt ?? Date.now();
      void recordCompletion({
        type,
        key,
        periodStart
      });
      lastRecordedKeyRef.current = key;
    }, [challengeType, challengeWindow, completionType, isCorrect, puzzle, user]);

    const puzzleLatex = puzzle ? `f(x)=${puzzle.functionTex}` : '';
    const guessLatex = finalGuess.includes('=') ? finalGuess : `g(x)=${finalGuess}`;
    const [isWide, setIsWide] = useState(false);

    useEffect(() => {
      const media = window.matchMedia('(min-width: 768px)');
      const update = () => setIsWide(media.matches);
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }, []);

    const gridTemplateColumns = isWide
      ? historyOpen
        ? `${panelWidth}px 12px 1fr 12px ${sidebarWidth}px`
        : `${panelWidth}px 12px 1fr`
      : '1fr';

    const challengeLabel =
      challengeWindow && resetCountdown
        ? `${challengeWindow.label} · resets in ${resetCountdown}`
        : challengeWindow?.label ?? null;
    const puzzleLabel =
      challengeType && challengeWindow ? formatChallengeTitle(challengeWindow) : undefined;
    const showWeekInfo = challengeType === 'weekly';
    const todayLabel = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    const displayRating = hoverRating ?? userRating ?? 0;

    useEffect(() => {
      lastRecordedKeyRef.current = null;
    }, [puzzle?.id, challengeWindow?.key]);

    return (
      <div className="relative">
        {puzzle ? (
          <>
            {customLevelId && !challengeType && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Rate this community level</p>
                  <p className="text-xs text-[var(--muted)]">
                    {ratingCount > 0
                      ? `${(ratingAvg ?? 0).toFixed(1)} average · ${ratingCount} rating${ratingCount === 1 ? '' : 's'}`
                      : 'No ratings yet'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => handleRateLevel(n)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
                    >
                      <Star
                        className={`h-5 w-5 ${n <= displayRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-[var(--border)]'
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-[var(--muted)]">({ratingCount})</span>
                </div>
              </div>
            )}
            <div
              className="grid h-full min-h-[calc(100vh-8rem)] grid-cols-1 gap-6 md:gap-8"
              style={{ gridTemplateColumns }}
            >
              <ControlPanel
                puzzle={puzzle}
                helperExpressions={helpers}
                finalGuess={finalGuess}
                isCorrect={isCorrect}
                accuracyScores={accuracyScores}
                accuracyMessage={accuracyMessage}
                hintsAllowed={
                  (puzzle.difficulty === 'very easy' || puzzle.difficulty === 'easy') &&
                  puzzle.hintsEnabled !== false
                }
                hintsLeft={Math.max(0, 3 - hintsUsed)}
                hintReveal={hintReveal}
                onUseHint={() => {
                  const allowed =
                    (puzzle.difficulty === 'very easy' || puzzle.difficulty === 'easy') &&
                    puzzle.hintsEnabled !== false;
                  if (!allowed) return;
                  setHintsUsed((n) => {
                    const next = Math.min(3, n + 1);
                    const revealLength = Math.min(puzzle.functionTex.length, next);
                    setHintReveal(puzzle.functionTex.slice(0, revealLength));
                    return next;
                  });
                }}
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
                challengeLabel={challengeLabel}
                disableNewPuzzle={!!challengeType}
                lockedReason="Challenge puzzles stay fixed until the next reset."
                puzzleLabel={puzzleLabel}
                showWeekInfo={showWeekInfo}
                todayLabel={showWeekInfo ? todayLabel : undefined}
                timeLeft={timeLeft}
              />

              {isWide && (
                <ResizeHandle onMouseDown={startDragging('panel')} label="Resize left sidebar" />
              )}

              <div className="rounded-xl border bg-card shadow-sm overflow-hidden h-full">
                <GraphingCalculator
                  targetLatex={puzzleLatex}
                  helperExpressions={helpers}
                  finalGuess={guessLatex}
                  showGrid={settings.showGrid}
                  showAxes={settings.showAxes}
                  boldGuessLine={settings.boldGuessLine}
                  zoomLimit={puzzle?.zoomLimit}
                  onBoundsChange={handleBoundsChange}
                />
              </div>

              {isWide && historyOpen && (
                <ResizeHandle onMouseDown={startDragging('history')} label="Resize history sidebar" />
              )}

              {historyOpen && (
                <HistorySidebar
                  entries={history}
                  onLoad={handleLoadFromHistory}
                  onClose={() => setHistoryOpen(false)}
                  disableLoad={!!challengeType}
                  loadLabel="Challenge puzzles cannot be swapped."
                />
              )}

              <Modal title="How to Play" isOpen={showRules} onClose={() => setShowRules(false)}>
                <div className="space-y-2 text-[var(--text)]">
                  <p className="text-sm">
                    The graph shows a secret function{' '}
                    <MathJax dynamic inline>{'\\( f(x) \\)'}</MathJax>. It’s drawn, but the equation is hidden.
                    Your job: use helper lines to peel it apart, then submit your best full guess.
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    <li>
                      Type helper expressions (e.g.,{' '}
                      <MathJax dynamic inline>{'\\( \\sin(x) \\)'}</MathJax> or{' '}
                      <MathJax dynamic inline>{'\\( f(x)-\\sin(x) \\)'}</MathJax>) to compare shapes.
                    </li>
                    <li>
                      Use sliders Desmos offers (e.g.,{' '}
                      <MathJax dynamic inline>{'\\( a\\cdot\\sin(x) \\)'}</MathJax>) to tune coefficients.
                    </li>
                    <li>
                      Type your full function in “Your Guess” and watch it overlay the target{' '}
                      <MathJax dynamic inline>{'\\( f(x) \\)'}</MathJax>.
                    </li>
                    <li>Green message means correct; you’ll auto-advance in 10s or click New Puzzle.</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[var(--text)]">What functions are allowed?</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text)]">
                    <li>
                      <MathJax dynamic inline>{'\\( x^n,\\; \\sqrt{x} \\)'}</MathJax> and other polynomials/roots
                    </li>
                    <li>
                      <MathJax dynamic inline>{'\\( \\sin,\\; \\cos,\\; \\tan \\)'}</MathJax>
                    </li>
                    <li>
                      <MathJax dynamic inline>{'\\( e^x,\\; \\exp(x),\\; \\ln(x),\\; \\log(x) \\)'}</MathJax>
                    </li>
                    <li>
                      <MathJax dynamic inline>{'\\( |x| \\)'}</MathJax> and simple piecewise forms
                    </li>
                  </ul>
                </div>

                <div className="space-y-1 text-xs text-[var(--muted)]">
                  <p>
                    Tips: keep expressions within{' '}
                    <MathJax dynamic inline>{'\\( x,y \\approx [-10, 10] \\)'}</MathJax> to stay in view.
                  </p>
                  <p>Use the math keypad for common symbols, and “Show solution” if you’re debugging.</p>
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
                  onNotify?.('Settings saved');
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
                        onNotify?.('Settings saved');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => void handleVerifySolution()} disabled={solutionLoading}>
                      {solutionLoading ? 'Checking...' : 'Reveal'}
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>

            {!historyOpen && (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="hidden lg:flex items-center gap-1 absolute right-0 top-1/2 -translate-y-1/2 rounded-l-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] shadow-lg shadow-black/20 hover:border-[var(--accent)]"
                aria-label="Show history sidebar"
              >
                &gt;&gt;
              </button>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-[80vh] items-center justify-center">
            <p className="text-sm text-[var(--muted)]">Loading puzzle...</p>
          </div>
        )}
      </div>
    );
  });

GameContainer.displayName = 'GameContainer';

export default GameContainer;

function ResizeHandle({
  onMouseDown,
  label
}: {
  onMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
  label: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onMouseDown={onMouseDown}
      className="group relative hidden h-full w-3 cursor-col-resize items-center justify-center bg-[var(--panel)]/30 md:flex"
    >
      <div className="pointer-events-none h-full w-[2px] rounded bg-[var(--border)] transition group-hover:bg-[var(--accent)]" />
      <div className="absolute inset-0" />
    </div>
  );
}
