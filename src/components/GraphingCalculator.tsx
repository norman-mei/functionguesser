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
}

const GraphingCalculator = ({
  targetLatex,
  helperExpressions,
  finalGuess,
  showGrid,
  showAxes,
  boldGuessLine
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

    const nextIds = new Set<string>();

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
      color: '#a855f7',
      lineStyle: boldGuessLine ? 'THICK' : 'SOLID',
      lineOpacity: 0.9
    });
  }, [boldGuessLine, finalGuess, ready]);

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]">
      <div ref={containerRef} className="desmos-calculator" />
    </div>
  );
};

export default GraphingCalculator;
