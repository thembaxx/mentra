import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVisualization,
  inferVisualizationFromQuestion,
  resolveQuestionVisualization,
} from '../lib/visualization-schema.ts';

test('extracts an exact numeric quadratic from LaTeX without swallowing prose', () => {
  assert.deepEqual(
    inferVisualizationFromQuestion('Draw $f(x) = x^2 - 6x + 13$ and explain its roots.'),
    { type: 'quadratic', a: 1, b: -6, c: 13 },
  );
  assert.deepEqual(
    inferVisualizationFromQuestion('Draw $y = -2x^2 + 4x - 1$.'),
    { type: 'quadratic', a: -2, b: 4, c: -1 },
  );
});

test('does not pretend a symbolic unknown is a concrete graph', () => {
  assert.equal(
    inferVisualizationFromQuestion('Given $f(x) = x^2 - 6x + k$, solve for k.'),
    null,
  );
  assert.equal(
    inferVisualizationFromQuestion('Explain $f(x)=Math.random()$'),
    null,
  );
});

test('parses a fixed linear function in the actual streamed fallback', () => {
  assert.deepEqual(
    inferVisualizationFromQuestion('After t hours, $E(t) = 18 + 4.5t = 63\\text{ kWh}$.'),
    { type: 'linear', slope: 4.5, intercept: 18, variable: 't' },
  );
  assert.deepEqual(
    inferVisualizationFromQuestion('Sketch $y=2x+3$.'),
    { type: 'linear', slope: 2, intercept: 3, variable: 'x' },
  );
});

test('derives safe named atomic numbers and explicit trigonometric angles', () => {
  assert.deepEqual(
    inferVisualizationFromQuestion('Explain a neutral carbon atom and its electrons.'),
    { type: 'atom', atomicNumber: 6 },
  );
  assert.deepEqual(
    inferVisualizationFromQuestion('Evaluate cos(60°) and show the unit circle.'),
    { type: 'trigonometry', function: 'cos', angleDegrees: 60 },
  );
});

test('extracts the lesson Doppler example without evaluating formulas', () => {
  assert.deepEqual(inferVisualizationFromQuestion(
    'Doppler: an ambulance approaches with $v_S = 30$ m/s, emits $f_S = 850$ Hz and sound has $v = 340$ m/s.',
  ), { type: 'doppler', speedOfSound: 340, sourceSpeed: 30, emittedFrequency: 850, direction: 'toward' });
});

test('rejects malformed, unsafe or out-of-range model data', () => {
  assert.equal(validateVisualization({ type: 'quadratic', a: 0, b: 1, c: 2 }), null);
  assert.equal(validateVisualization({ type: 'quadratic', a: 1, b: 0, c: 1, arbitraryJs: 'alert(1)' }), null);
  assert.equal(validateVisualization({ type: 'linear', slope: Infinity, intercept: 1, variable: 'x' }), null);
  assert.equal(validateVisualization({ type: 'atom', atomicNumber: 12 }), null);
  assert.equal(validateVisualization({
    type: 'doppler', speedOfSound: 340, sourceSpeed: 345,
    emittedFrequency: 900, direction: 'toward',
  }), null);
});

test('a wrong model prediction cannot replace coefficients verified from the prompt', () => {
  const prompt = 'Sketch $f(x)=x^2-6x+13$.';
  assert.deepEqual(resolveQuestionVisualization(prompt, {
    type: 'quadratic', a: 1, b: -6, c: 9,
  }), { type: 'quadratic', a: 1, b: -6, c: 13 });
  assert.equal(resolveQuestionVisualization('Explain the quadratic formula.', {
    type: 'quadratic', a: 1, b: 0, c: -4,
  }), null);
});

test('oversized and arbitrary input cannot create a diagram', () => {
  assert.equal(inferVisualizationFromQuestion('x'.repeat(12001)), null);
  assert.equal(validateVisualization({ type: 'unknown', src: '<svg onload=alert(1) />' }), null);
});
