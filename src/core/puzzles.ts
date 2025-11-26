import { Difficulty, Puzzle } from './types';

const rnd = (rng: () => number, min: number, max: number) => rng() * (max - min) + min;
const rndInt = (rng: () => number, min: number, max: number) => Math.floor(rnd(rng, min, max + 1));

type Term = {
  latex: string;
  complexity: number;
  tags: string[];
};

const nonZeroInt = (rng: () => number, min: number, max: number) => {
  let val = 0;
  while (val === 0) {
    val = rndInt(rng, min, max);
  }
  return val;
};

const polynomialTerm = (rng: () => number): Term => {
  const power = rndInt(rng, 1, 3);
  const coef = nonZeroInt(rng, -4, 4);
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const latex = power === 1 ? `${coefStr}x` : `${coefStr}x^{${power}}`;
  const complexity = 1 + power * 0.4 + Math.abs(coef) * 5;
  return { latex, complexity, tags: ['polynomial'] };
};

const trigTerm = (rng: () => number): Term => {
  const funcs = ['\\sin', '\\cos', '\\tan'];
  const fn = funcs[rndInt(rng, 0, funcs.length - 1)];
  const freq = rndInt(rng, 1, 3);
  const coef = nonZeroInt(rng, -3, 3);
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const latex = `${coefStr}${fn}(${freq === 1 ? 'x' : `${freq}x`})`;
  const complexity = 2.2 + Math.abs(coef) * 0.15 + (fn === '\\tan' ? 1 : 0);
  return { latex, complexity, tags: ['trigonometry'] };
};

const expTerm = (rng: () => number): Term => {
  const rate = nonZeroInt(rng, -2, 2);
  const coef = nonZeroInt(rng, -3, 3);
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const latex = `${coefStr}e^{${rate}x}`;
  // Increase complexity to avoid classifying exponential-heavy terms as "very easy"
  const complexity = 4 + Math.abs(rate) * 7 + Math.abs(coef) * 1.2;
  return { latex, complexity, tags: ['exponential'] };
};

const logTerm = (rng: () => number): Term => {
  const coef = nonZeroInt(rng, -3, 3);
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const innerCoef = nonZeroInt(rng, 1, 3);
  const latex = `${coefStr}\\ln(\\left|${innerCoef}x\\right|+1)`;
  const complexity = 4 + Math.abs(coef) * 1.5 + Math.abs(innerCoef) * 0.5;
  return { latex, complexity, tags: ['logarithmic'] };
};

const absTerm = (rng: () => number): Term => {
  const coef = nonZeroInt(rng, -3, 3);
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const slope = nonZeroInt(rng, 1, 3);
  const shift = nonZeroInt(rng, -3, 3);
  const latex = `${coefStr}\\left|${slope}x ${shift >= 0 ? '+' : '-'} ${Math.abs(shift)}\\right|`;
  const complexity = 1.8 + Math.abs(coef) * 0.25;
  return { latex, complexity, tags: ['absolute'] };
};

const makeTerm = (rng: () => number, opts?: { excludeLog?: boolean; excludeAbs?: boolean }): Term => {
  const candidates: Array<() => Term> = [() => polynomialTerm(rng)];

  candidates.push(() => trigTerm(rng));

  candidates.push(() => expTerm(rng));

  if (!opts?.excludeAbs) {
    candidates.push(() => absTerm(rng));
  }

  if (!opts?.excludeLog) {
    candidates.push(() => logTerm(rng));
  }

  const pick = candidates[rndInt(rng, 0, candidates.length - 1)];
  return pick();
};

export const determineDifficulty = (complexity: number, length: number): Difficulty => {
  const score = complexity + length * 0.05;
  if (score < 3) return 'very easy';
  if (score < 4) return 'easy';
  if (score < 5) return 'medium-easy';
  if (score < 6.5) return 'medium';
  if (score < 8) return 'hard-medium';
  if (score < 9.5) return 'hard';
  return 'very hard';
};

const allowedFromTags = (tags: string[]) => Array.from(new Set(tags));

let nextId = 0;

export const resetPuzzleCounter = () => {
  nextId = 0;
};

const applyVeryHardModifiers = (latex: string, rng: () => number) => {
  let expr = latex;
  const modifiers: Array<'integral' | 'factorial'> = [];
  if (rng() < 0.6) modifiers.push('integral');
  if (rng() < 0.6) modifiers.push('factorial');

  modifiers.forEach((mod) => {
    if (mod === 'integral') {
      const integrand = latex.replace(/x/g, 't');
      expr = `\\int_{0}^{x} (${integrand})\\, dt`;
    } else if (mod === 'factorial') {
      const scalarOptions = ['\\frac{1}{24}', '\\frac{1}{12}', '\\frac{1}{6}'];
      const scalar = scalarOptions[rndInt(rng, 0, scalarOptions.length - 1)];
      expr = `${expr} + ${scalar}\\cdot\\left|x\\right|!`;
    }
  });

  return expr;
};

interface GeneratePuzzleOptions {
  rng?: () => number;
  idOverride?: number;
  attempt?: number;
  maxLength?: number;
}

export const generatePuzzle = (
  allowedDifficulties?: Difficulty[],
  options?: GeneratePuzzleOptions
): Puzzle => {
  const rng = options?.rng ?? Math.random;
  const attempt = options?.attempt ?? 0;
  const maxLength = options?.maxLength;
  const veryEasyOnly = allowedDifficulties?.length === 1 && allowedDifficulties[0] === 'very easy';
  const makeOpts = {
    excludeLog: veryEasyOnly,
    excludeAbs: veryEasyOnly
  };

  const termCount = rndInt(rng, 2, 4);
  const terms: Term[] = [];
  for (let i = 0; i < termCount; i++) {
    terms.push(makeTerm(rng, makeOpts));
  }

  let functionTex = terms
    .map((t, idx) => {
      if (idx === 0) return t.latex;
      return t.latex.startsWith('-') ? t.latex : `+ ${t.latex}`;
    })
    .join(' ');

  const complexity = terms.reduce((acc, t) => acc + t.complexity, 0);
  let difficulty = determineDifficulty(complexity, functionTex.length);
  if (allowedDifficulties && allowedDifficulties.length > 0) {
    if (!allowedDifficulties.includes(difficulty)) {
      // if not in allowed set, perturb complexity until we land in allowed bucket
      const buckets = allowedDifficulties;
      let tries = 0;
      while (!buckets.includes(difficulty) && tries < 10) {
        const tweak = rnd(rng, -0.5, 0.5);
        difficulty = determineDifficulty(complexity + tweak, functionTex.length);
        tries++;
      }
      if (!buckets.includes(difficulty)) {
        difficulty = buckets[rndInt(rng, 0, buckets.length - 1)];
      }
    }
  }
  const allowedComponents = allowedFromTags(terms.flatMap((t) => t.tags));

  // Avoid log terms in very easy puzzles entirely.
  const hasLog = allowedComponents.includes('logarithmic');
  const hasAbs = allowedComponents.includes('absolute');
  // Re-roll if very easy and unwanted components or non-integer-like coefficients slip in.
  if (difficulty === 'very easy' && attempt < 8) {
    if (hasLog || hasAbs) {
      return generatePuzzle(allowedDifficulties, { ...(options ?? {}), attempt: attempt + 1, rng });
    }
  }

  const containsDecimal = /[0-9]\\.[0-9]/.test(functionTex);
  if (containsDecimal && attempt < 8) {
    return generatePuzzle(allowedDifficulties, { ...(options ?? {}), attempt: attempt + 1, rng });
  }

  if (difficulty === 'very hard') {
    functionTex = applyVeryHardModifiers(functionTex, rng);
    allowedComponents.push('factorial', 'integral');
  }

  if (maxLength && functionTex.length > maxLength && attempt < 12) {
    return generatePuzzle(allowedDifficulties, { ...(options ?? {}), attempt: attempt + 1, rng });
  }

  return {
    id: options?.idOverride ?? nextId++,
    functionTex,
    difficulty,
    allowedComponents
  };
};
