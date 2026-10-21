/**
 * Safe, deterministic visualization payloads. Do not evaluate user/model
 * expressions or allow arbitrary scripts, markup, styling or SVG.
 */
export type QuestionVisualization =
  | { type: 'quadratic'; a: number; b: number; c: number }
  | { type: 'linear'; slope: number; intercept: number; variable: 'x' | 't' }
  | { type: 'trigonometry'; function: 'sin' | 'cos'; angleDegrees: number }
  | { type: 'atom'; atomicNumber: number }
  | { type: 'right_triangle'; legA: number; legB: number; unit: 'cm' }
  | { type: 'forces'; mass: number; appliedForce: number; frictionForce: number }
  | { type: 'binomial'; trials: number; probability: number }
  | { type: 'molecule'; formula: 'H2O' | 'CO2' }
  | {
      type: 'doppler';
      speedOfSound: number;
      sourceSpeed: number;
      emittedFrequency: number;
      direction: 'toward' | 'away';
    };

type Data = Record<string, unknown>;
const has = (value: unknown): value is Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function keysMatch(value: Data, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key))
    && keys.every((key) => Object.hasOwn(value, key));
}

function numeric(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value)
    && value >= min && value <= max;
}

export function validateVisualization(value: unknown): QuestionVisualization | null {
  if (!has(value)) return null;
  switch (value.type) {
    case 'quadratic': {
      if (!keysMatch(value, ['type', 'a', 'b', 'c'])
        || !numeric(value.a, -5, 5) || Math.abs(value.a) < 0.001
        || !numeric(value.b, -30, 30) || !numeric(value.c, -100, 100)) return null;
      const h = -value.b / (2 * value.a);
      const k = value.c - value.b ** 2 / (4 * value.a);
      // Keep verified graphs inside the existing legible mobile SVG viewport.
      if (Math.abs(h) > 5 || Math.abs(k) > 8) return null;
      return { type: 'quadratic', a: value.a, b: value.b, c: value.c };
    }
    case 'linear':
      return keysMatch(value, ['type', 'slope', 'intercept', 'variable'])
        && numeric(value.slope, -25, 25) && numeric(value.intercept, -1000, 1000)
        && (value.variable === 'x' || value.variable === 't')
        ? { type: 'linear', slope: value.slope, intercept: value.intercept, variable: value.variable }
        : null;
    case 'trigonometry':
      return keysMatch(value, ['type', 'function', 'angleDegrees'])
        && (value.function === 'sin' || value.function === 'cos')
        && numeric(value.angleDegrees, 0, 720)
        ? { type: 'trigonometry', function: value.function, angleDegrees: value.angleDegrees }
        : null;
    case 'atom':
      return keysMatch(value, ['type', 'atomicNumber'])
        && numeric(value.atomicNumber, 1, 10) && Number.isInteger(value.atomicNumber)
        ? { type: 'atom', atomicNumber: value.atomicNumber }
        : null;
    case 'right_triangle':
      return keysMatch(value, ['type', 'legA', 'legB', 'unit'])
        && numeric(value.legA, 0.5, 20) && numeric(value.legB, 0.5, 20)
        && value.unit === 'cm'
        ? { type: 'right_triangle', legA: value.legA, legB: value.legB, unit: 'cm' }
        : null;
    case 'forces':
      return keysMatch(value, ['type', 'mass', 'appliedForce', 'frictionForce'])
        && numeric(value.mass, 0.1, 100)
        && numeric(value.appliedForce, 0, 500)
        && numeric(value.frictionForce, 0, 500)
        ? { type: 'forces', mass: value.mass, appliedForce: value.appliedForce, frictionForce: value.frictionForce }
        : null;
    case 'binomial':
      return keysMatch(value, ['type', 'trials', 'probability'])
        && numeric(value.trials, 1, 20) && Number.isInteger(value.trials)
        && numeric(value.probability, 0, 1)
        ? { type: 'binomial', trials: value.trials, probability: value.probability }
        : null;
    case 'molecule':
      return keysMatch(value, ['type', 'formula'])
        && (value.formula === 'H2O' || value.formula === 'CO2')
        ? { type: 'molecule', formula: value.formula }
        : null;
    case 'doppler':
      return keysMatch(value, ['type', 'speedOfSound', 'sourceSpeed', 'emittedFrequency', 'direction'])
        && numeric(value.speedOfSound, 250, 400)
        && numeric(value.sourceSpeed, 0, 150)
        && value.sourceSpeed < value.speedOfSound
        && numeric(value.emittedFrequency, 50, 3000)
        && (value.direction === 'toward' || value.direction === 'away')
        ? {
            type: 'doppler',
            speedOfSound: value.speedOfSound,
            sourceSpeed: value.sourceSpeed,
            emittedFrequency: value.emittedFrequency,
            direction: value.direction,
          }
        : null;
    default:
      return null;
  }
}

const ELEMENT_NAMES = [
  'hydrogen', 'helium', 'lithium', 'beryllium', 'boron',
  'carbon', 'nitrogen', 'oxygen', 'fluorine', 'neon',
];

/** Only deterministic, explicitly stated numeric equations are considered exact. */
export function inferVisualizationFromQuestion(question: string): QuestionVisualization | null {
  if (typeof question !== 'string' || question.length > 12000 || !question.trim()) return null;
  const text = question
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\(?:,|;|!)/g, '')
    .replace(/\s+/g, '')
    .replace(/\^\{2\}/g, '^2')
    .replace(/\u2212/g, '-')
    // Preserve LaTeX delimiters as boundaries, otherwise adjoining prose
    // can be mistaken for part of the mathematical expression.
    .replace(/\$/g, ';');

  // We only parse trusted numeric subsets. Unknown symbols (k, fractions,
  // arbitrary functions) are rejected instead of being interpreted as zero.
  const matches = text.matchAll(/(?:f\(x\)|g\(x\)|y)\s*=\s*([+\-.\da-zA-Z^]+)/g);
  for (const match of matches) {
    const expression = match[1];
    const quadratic = /^([+-]?(?:\d+(?:\.\d+)?)?)x\^2([+-](?:\d+(?:\.\d+)?)?x)?([+-]\d+(?:\.\d+)?)?$/.exec(expression);
    if (quadratic) {
      const a = coefficient(quadratic[1]);
      const b = coefficient((quadratic[2] ?? '').replace(/x$/, ''));
      const c = Number(quadratic[3] || 0);
      const result = validateVisualization({ type: 'quadratic', a, b, c });
      if (result) return result;
    }
  }

  // Do not capture a truncated 'x' prefix from x^2 (or other powers).
  const linear = /(?:E\(t\)|f\(t\)|y|f\(x\))=([+\-.\dtx]+)(?!\^)/g;
  for (const match of text.matchAll(linear)) {
    const variable = match[0].includes('(x)') || match[0].startsWith('y=') ? 'x' : 't';
    const variableSymbol = variable;
    const exp = match[1];
    const terms = new RegExp('^([+-]?\\d+(?:\\.\\d+)?)?([+-]?\\d*(?:\\.\\d+)?)' + variableSymbol + '$');
    const reversed = new RegExp('^([+-]?\\d*(?:\\.\\d+)?)' + variableSymbol + '([+-]\\d+(?:\\.\\d+)?)?$');
    let slope: number, intercept: number;
    const m1 = terms.exec(exp);
    const m2 = reversed.exec(exp);
    if (m1) {
      slope = coefficient(m1[2]);
      intercept = Number(m1[1] || 0);
    } else if (m2) {
      slope = coefficient(m2[1]);
      intercept = Number(m2[2] || 0);
    } else continue;
    const result = validateVisualization({ type: 'linear', slope, intercept, variable });
    if (result) return result;
  }

  // Presets and AI questions about specified neutral atoms.
  if (/\b(atom|atomic|element|electrons?|nucleus)\b/i.test(question)) {
    const numberMatch = /\batomic number\s*(?:of|=|:)?\s*(\d{1,2})\b/i.exec(question);
    if (numberMatch) {
      const atom = validateVisualization({ type: 'atom', atomicNumber: Number(numberMatch[1]) });
      if (atom) return atom;
    }
    for (let i = 0; i < ELEMENT_NAMES.length; i++) {
      if (new RegExp('\\b' + ELEMENT_NAMES[i] + '\\b', 'i').test(question)) {
        return { type: 'atom', atomicNumber: i + 1 };
      }
    }
  }

  if (/\bdoppler\b/i.test(question) || /\b(ambulance|siren)\b/i.test(question)) {
    const sourceSpeed = /v_?\{?S\}?\s*=\s*(\d+(?:\.\d+)?)/i.exec(question)?.[1];
    const frequency = /f_?\{?S\}?\s*=\s*(\d+(?:\.\d+)?)/i.exec(question)?.[1];
    const soundSpeed = /\bv\s*=\s*(\d+(?:\.\d+)?)/i.exec(question)?.[1]
      ?? /\bspeed of sound[^.\n]*?(?:is|as|=)\s*\$?\s*(\d+(?:\.\d+)?)/i.exec(question)?.[1];
    const direction = /\b(approach(?:es|ing)?|towards?|closing in)\b/i.test(question)
      ? 'toward'
      : /\b(away|reced(?:es|ing)|depart(?:s|ing))\b/i.test(question) ? 'away' : null;
    if (sourceSpeed && frequency && soundSpeed && direction) {
      return validateVisualization({
        type: 'doppler', speedOfSound: Number(soundSpeed),
        sourceSpeed: Number(sourceSpeed), emittedFrequency: Number(frequency), direction,
      });
    }
  }

  // Accept only the explicit, canonical numeric wording below. Geometry
  // lengths must have the same unit; forces require an opposing horizontal
  // friction force. Partial or ambiguous stories are illustrative only.
  if (/\bright[- ]angled triangle\b/i.test(question)) {
    const rightTriangle = /\blegs?\s+a\s*=\s*(\d+(?:\.\d+)?)\s*cm\s+and\s+b\s*=\s*(\d+(?:\.\d+)?)\s*cm\b/i.exec(question);
    if (rightTriangle) {
      const result = validateVisualization({
        type: 'right_triangle',
        legA: Number(rightTriangle[1]),
        legB: Number(rightTriangle[2]),
        unit: 'cm',
      });
      if (result) return result;
    }
  }

  if (/\bhorizontal\b/i.test(question)) {
    const mass = /\bmass\s*=\s*(\d+(?:\.\d+)?)\s*kg\b/i.exec(question)?.[1];
    const applied = /\bapplied force\s*=\s*(\d+(?:\.\d+)?)\s*N\b/i.exec(question)?.[1];
    const friction = /\bopposing friction\s*=\s*(\d+(?:\.\d+)?)\s*N\b/i.exec(question)?.[1];
    if (mass && applied && friction) {
      const result = validateVisualization({
        type: 'forces',
        mass: Number(mass),
        appliedForce: Number(applied),
        frictionForce: Number(friction),
      });
      if (result) return result;
    }
  }

  const distribution = /\bX\s*(?:~|\\sim)\s*(?:\\mathrm\{)?Bin\}?\s*\(\s*(\d{1,2})\s*,\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*\)/i.exec(question);
  if (distribution) {
    const result = validateVisualization({
      type: 'binomial', trials: Number(distribution[1]), probability: Number(distribution[2]),
    });
    if (result) return result;
  }

  if (/\b(molecular|molecule|bonding|bond angle)\b/i.test(question)) {
    const formulas = Array.from(question.matchAll(/\b(H2O|CO2)\b/gi), (m) => m[1].toUpperCase());
    if (formulas.length === 1) {
      const result = validateVisualization({ type: 'molecule', formula: formulas[0] });
      if (result) return result;
    }
  }

  // A specific angle tied to sin/cos is unambiguous; do not assume other
  // identities or functions whose parameters have not been provided.
  const trig = /\b(sin|cos)\s*\(?\s*(\d{1,3})(?:°|\^?\\circ|degrees?)\s*\)?/i.exec(question);
  if (trig) return validateVisualization({
    type: 'trigonometry', function: trig[1].toLowerCase(),
    angleDegrees: Number(trig[2]),
  });
  return null;
}

function coefficient(value: string): number {
  if (!value || value === '+') return 1;
  if (value === '-') return -1;
  return Number(value);
}

/**
 * Verify AI-suggested JSON against independent numeric parsing of the
 * actual question. A merely well-formed payload is not proof of accuracy.
 */
export function resolveQuestionVisualization(
  question: string, aiCandidate: unknown,
): QuestionVisualization | null {
  const inferred = inferVisualizationFromQuestion(question);
  if (!inferred) return null;
  const candidate = validateVisualization(aiCandidate);
  if (!candidate || candidate.type !== inferred.type) return inferred;
  for (const key of Object.keys(inferred)) {
    const actual = (inferred as unknown as Data)[key];
    const predicted = (candidate as unknown as Data)[key];
    if (typeof actual === 'number' && typeof predicted === 'number') {
      if (Math.abs(actual - predicted) > 1e-6) return inferred;
    } else if (actual !== predicted) return inferred;
  }
  return candidate;
}

/** Small pure maths functions shared by the models and regression tests. */
export function triangleHypotenuse(legA: number, legB: number): number {
  return Math.hypot(legA, legB);
}

export function horizontalAcceleration(
  mass: number, appliedForce: number, frictionForce: number,
): number {
  return (appliedForce - frictionForce) / mass;
}

export function binomialMass(trials: number, probability: number, successes: number): number {
  if (!Number.isInteger(trials) || !Number.isInteger(successes)
    || trials < 0 || successes < 0 || successes > trials
    || !Number.isFinite(probability) || probability < 0 || probability > 1) return 0;
  let choose = 1;
  for (let i = 1; i <= successes; i++) choose = choose * (trials - i + 1) / i;
  return choose * probability ** successes * (1 - probability) ** (trials - successes);
}
