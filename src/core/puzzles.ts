import { Difficulty, Puzzle } from './types';

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const rndInt = (min: number, max: number) => Math.floor(rnd(min, max + 1));

type Term = {
  latex: string;
  complexity: number;
  tags: string[];
};

const polynomialTerm = (opts?: { integerOnly?: boolean }): Term => {
  const power = opts?.integerOnly ? rndInt(1, 2) : rndInt(1, 3);
  let coef: number;
  if (opts?.integerOnly) {
    const int = rndInt(-3, 3);
    coef = int === 0 ? 1 : int;
  } else {
    const coefRange = power === 1 ? 1 : power === 2 ? 0.2 : 0.02;
    coef = parseFloat(rnd(-coefRange, coefRange).toFixed(2)) || coefRange / 2;
  }
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const latex = power === 1 ? `${coefStr}x` : `${coefStr}x^{${power}}`;
  const complexity = 1 + power * 0.4 + Math.abs(coef) * 5;
  return { latex, complexity, tags: ['polynomial'] };
};

const trigTerm = (opts?: { integerOnly?: boolean }): Term => {
  const funcs = ['\\sin', '\\cos', '\\tan'];
  const fn = funcs[rndInt(0, funcs.length - 1)];
  const freq = opts?.integerOnly ? 1 : rndInt(1, 2);
  const coef = opts?.integerOnly
    ? (() => {
        const c = rndInt(-2, 2);
        return c === 0 ? 1 : c;
      })()
    : parseFloat(rnd(-2, 2).toFixed(1)) || 1;
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const latex = `${coefStr}${fn}(${freq === 1 ? 'x' : `${freq}x`})`;
  const complexity = 2.2 + Math.abs(coef) * 0.15 + (fn === '\\tan' ? 1 : 0);
  return { latex, complexity, tags: ['trigonometry'] };
};

const expTerm = (): Term => {
  const rate = parseFloat((rnd(0.05, 0.18)).toFixed(3));
  const coef = parseFloat((rnd(-1, 1)).toFixed(2)) || 0.5;
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const latex = `${coefStr}e^{${rate}x}`;
  // Increase complexity to avoid classifying exponential-heavy terms as "very easy"
  const complexity = 4 + rate * 15 + Math.abs(coef) * 1.2;
  return { latex, complexity, tags: ['exponential'] };
};

const logTerm = (): Term => {
  const coef = parseFloat((rnd(-1.5, 1.5)).toFixed(2)) || 0.6;
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const innerCoef = parseFloat((rnd(0.5, 1.2)).toFixed(2));
  const latex = `${coefStr}\\ln(\\left|${innerCoef}x\\right|+1)`;
  const complexity = 4 + Math.abs(coef) * 1.5 + Math.abs(innerCoef) * 0.5;
  return { latex, complexity, tags: ['logarithmic'] };
};

const absTerm = (): Term => {
  const coef = parseFloat((rnd(-1.2, 1.2)).toFixed(2)) || 0.8;
  const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
  const slope = parseFloat((rnd(0.5, 1.3)).toFixed(2));
  const shift = parseFloat((rnd(-1.5, 1.5)).toFixed(2));
  const latex = `${coefStr}\\left|${slope}x ${shift >= 0 ? '+' : '-'} ${Math.abs(shift)}\\right|`;
  const complexity = 1.8 + Math.abs(coef) * 0.25;
  return { latex, complexity, tags: ['absolute'] };
};

const makeTerm = (opts?: { excludeLog?: boolean; excludeAbs?: boolean; integerOnly?: boolean }): Term => {
  const candidates: Array<() => Term> = [() => polynomialTerm({ integerOnly: opts?.integerOnly })];

  candidates.push(() => trigTerm({ integerOnly: opts?.integerOnly }));

  if (!opts?.integerOnly) {
    candidates.push(() => expTerm());
  }

  if (!opts?.excludeAbs) {
    candidates.push(() => absTerm());
  }

  if (!opts?.excludeLog) {
    candidates.push(() => logTerm());
  }

  const pick = candidates[rndInt(0, candidates.length - 1)];
  return pick();
};

const determineDifficulty = (complexity: number, length: number): Difficulty => {
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

let nextId = 1;

export const generatePuzzle = (allowedDifficulties?: Difficulty[], attempt = 0): Puzzle => {
  const veryEasyOnly = allowedDifficulties?.length === 1 && allowedDifficulties[0] === 'very easy';
  const makeOpts = {
    excludeLog: veryEasyOnly,
    excludeAbs: veryEasyOnly,
    integerOnly: veryEasyOnly
  };

  const termCount = rndInt(2, 4);
  const terms: Term[] = [];
  for (let i = 0; i < termCount; i++) {
    terms.push(makeTerm(makeOpts));
  }

  const functionTex = terms
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
        const tweak = rnd(-0.5, 0.5);
        difficulty = determineDifficulty(complexity + tweak, functionTex.length);
        tries++;
      }
      if (!buckets.includes(difficulty)) {
        difficulty = buckets[rndInt(0, buckets.length - 1)];
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
      return generatePuzzle(allowedDifficulties, attempt + 1);
    }
    const containsDecimal = /[0-9]\\.[0-9]/.test(functionTex);
    if (containsDecimal) {
      return generatePuzzle(allowedDifficulties, attempt + 1);
    }
  }

  return {
    id: nextId++,
    functionTex,
    difficulty,
    allowedComponents
  };
};
