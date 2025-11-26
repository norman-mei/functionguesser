import { useEffect, useRef, useState } from 'react';
import { createCalculator } from '../core/desmos';
import { HelperExpression } from '../core/types';

interface GraphingCalculatorProps {
  targetLatex: string;
  helperExpressions: HelperExpression[];
  finalGuess: string;
  showGrid: boolean;
  showAxes: boolean;
  boldGuessLine: boolean;
  zoomLimit?: number;
  onBoundsChange?: (bounds: { left: number; right: number }) => void;
  points?: { x: number; y: number }[];
}

const GraphingCalculator = ({
  targetLatex,
  helperExpressions,
  finalGuess,
  showGrid,
  showAxes,
  boldGuessLine,
  zoomLimit,
  onBoundsChange,
  points
}: GraphingCalculatorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calculatorRef = useRef<any>(null);
  const helperIdsRef = useRef<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    createCalculator(containerRef.current, {
      expressions: true,
      expressionsCollapsed: true,
      settingsMenu: false
    }).then((calculator) => {
      if (!mounted) {
        calculator?.destroy?.();
        return;
      }
      calculatorRef.current = calculator;
      calculator.setBlank();
      calculator.setMathBounds({
        left: -10,
        right: 10,
        bottom: -10,
        top: 10
      });
      setReady(true);
    });

    return () => {
      mounted = false;
      calculatorRef.current?.destroy?.();
      calculatorRef.current = null;
      helperIdsRef.current.clear();
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator || !targetLatex || !ready) return;

    calculator.setExpression({
      id: 'target-definition',
      latex: targetLatex,
      color: '#000000',
      secret: true,
      hidden: true
    });

    calculator.setExpression({
      id: 'target-curve',
      latex: 'y=f(x)',
      color: '#000000',
      secret: true
    });
  }, [targetLatex, ready]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator || !ready) return;

    calculator.updateSettings({
      expressionsCollapsed: true,
      keypad: false,
      showGrid,
      showXAxis: showAxes,
      showYAxis: showAxes
    });

    calculator.setMathBounds({
      left: -10,
      right: 10,
      bottom: -10,
      top: 10
    });
  }, [showAxes, showGrid, ready]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator || !ready) return;

    const existingHelperIds = (calculator.getExpressions?.() ?? [])
      .map((exp: { id?: string }) => exp.id)
      .filter((id: unknown): id is string => typeof id === 'string' && id.startsWith('helper-'));

    const nextIds = new Set<string>();

    // Remove any helpers that are no longer present in state
    existingHelperIds.forEach((id: string) => {
      const stillExists = helperExpressions.some((helper) => `helper-${helper.id}` === id && helper.expression.trim());
      if (!stillExists) {
        calculator.removeExpression({ id });
      }
    });

    helperExpressions.forEach((helper) => {
      const latex = helper.expression.trim();
      const id = `helper-${helper.id}`;
      if (!latex) {
        calculator.removeExpression({ id });
        return;
      }

      nextIds.add(id);
      calculator.setExpression({
        id,
        latex,
        color: helper.color,
        hidden: !helper.visible
      });
    });

    helperIdsRef.current.forEach((id) => {
      if (!nextIds.has(id)) {
        calculator.removeExpression({ id });
      }
    });

    helperIdsRef.current = nextIds;
  }, [helperExpressions, ready]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator || !ready) return;

    const latex = finalGuess.trim();
    if (!latex) {
      calculator.removeExpression({ id: 'final-guess' });
      return;
    }

    calculator.setExpression({
      id: 'final-guess',
      latex,
      color: '#228b22',
      lineStyle: boldGuessLine ? 'THICK' : 'SOLID',
      lineOpacity: 0.9
    });
  }, [boldGuessLine, finalGuess, ready]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator || !ready) return;

    if (!points || points.length === 0) {
      calculator.removeExpression({ id: 'scribble-points' });
      return;
    }

    calculator.setExpression({
      id: 'scribble-points',
      type: 'table',
      columns: [
        {
          latex: 'x_1',
          values: points.map((p) => p.x)
        },
        {
          latex: 'y_1',
          values: points.map((p) => p.y),
          color: '#000000',
          lines: true,
          points: false
        }
      ]
    });
  }, [points, ready]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator || !ready || !zoomLimit) return;

    const checkBounds = () => {
      const bounds = calculator.graphpaperBounds.mathCoordinates;
      if (!bounds) return;

      const { left, right, bottom, top } = bounds;
      const width = right - left;
      const height = top - bottom;
      const maxRange = zoomLimit * 2;

      if (width > maxRange || height > maxRange) {
        // Clamp to max range, keeping center
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        calculator.setMathBounds({
          left: centerX - zoomLimit,
          right: centerX + zoomLimit,
          bottom: centerY - zoomLimit,
          top: centerY + zoomLimit
        });
      }
    };

    // Desmos doesn't have a public event for bounds change in the API v1.x easily accessible 
    // without using internal properties or polling.
    // We'll use a polling interval for simplicity as strict event listeners are tricky.
    const interval = setInterval(() => {
      checkBounds();
      const bounds = calculator.graphpaperBounds.mathCoordinates;
      if (bounds && onBoundsChange) {
        onBoundsChange({ left: bounds.left, right: bounds.right });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [zoomLimit, ready, onBoundsChange]);

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]">
      <div ref={containerRef} className="desmos-calculator" />
    </div>
  );
};

export default GraphingCalculator;
