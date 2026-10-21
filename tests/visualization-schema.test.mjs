import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVisualization,
  inferVisualizationFromQuestion,
  resolveQuestionVisualization,
  triangleHypotenuse, horizontalAcceleration, binomialMass,
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


test('exact right-angle geometry requires two named centimetre legs', () => {
  const q = 'A right-angled triangle with legs a = 6 cm and b = 8 cm has hypotenuse c.';
  assert.deepEqual(inferVisualizationFromQuestion(q),
    { type:'right_triangle', legA:6, legB:8, unit:'cm' });
  assert.equal(triangleHypotenuse(6,8),10);
  assert.equal(inferVisualizationFromQuestion('A right-angled triangle has sides 6 cm and 8 m.'),null);
  assert.equal(validateVisualization({type:'right_triangle',legA:-2,legB:5,unit:'cm'}),null);
});

test('horizontal force model requires explicit opposing friction and mass', () => {
  const q = 'An object in horizontal motion: mass = 5 kg, applied force = 30 N, opposing friction = 10 N.';
  assert.deepEqual(inferVisualizationFromQuestion(q),
    { type:'forces', mass:5, appliedForce:30, frictionForce:10 });
  assert.equal(horizontalAcceleration(5,30,10),4);
  assert.equal(horizontalAcceleration(5,10,30),-4);
  assert.equal(inferVisualizationFromQuestion('A horizontal object of 5 kg is pushed 30 N with some friction.'),null);
  assert.equal(validateVisualization({type:'forces',mass:0,appliedForce:30,frictionForce:10}),null);
});

test('binomial distribution matches an explicit n and probability only', () => {
  const q = 'Let X ~ Bin(10, 0.3) represent successes in independent trials. Find P(X=3).';
  assert.deepEqual(inferVisualizationFromQuestion(q), {type:'binomial',trials:10,probability:0.3});
  assert.ok(Math.abs(binomialMass(10,0.3,3)-0.266827932) < 1e-8);
  assert.ok(Math.abs(Array.from({length:11},(_,k)=>binomialMass(10,0.3,k)).reduce((a,b)=>a+b,0)-1)<1e-12);
  assert.equal(binomialMass(10,0.3,11),0);
  assert.equal(inferVisualizationFromQuestion('A random variable X follows an unspecified binomial distribution.'),null);
  assert.equal(validateVisualization({type:'binomial',trials:1000000,probability:0.3}),null);
  assert.equal(validateVisualization({type:'binomial',trials:10,probability:1.3}),null);
});

test('molecular geometry recognizes only supported unambiguous formulas', () => {
  assert.deepEqual(inferVisualizationFromQuestion('What is the bond angle in the H2O molecule?'),
    {type:'molecule',formula:'H2O'});
  assert.deepEqual(inferVisualizationFromQuestion('Explain bonding in molecule CO2.'),
    {type:'molecule',formula:'CO2'});
  assert.equal(inferVisualizationFromQuestion('Compare H2O and CO2 molecular geometry.'),null);
  assert.equal(validateVisualization({type:'molecule',formula:'CH4'}),null);
});

test('an AI candidate cannot replace verified science and probability parameters', () => {
  const q = 'Horizontal force question: mass = 5 kg, applied force = 30 N, opposing friction = 10 N.';
  assert.deepEqual(resolveQuestionVisualization(q,{type:'forces',mass:20,appliedForce:30,frictionForce:10}),
    {type:'forces',mass:5,appliedForce:30,frictionForce:10});
  assert.deepEqual(resolveQuestionVisualization('X ~ Bin(10, 0.3)',{type:'binomial',trials:10,probability:0.4}),
    {type:'binomial',trials:10,probability:0.3});
  assert.equal(resolveQuestionVisualization('What is the molecular geometry of methane?',{type:'molecule',formula:'H2O'}),null);
});
