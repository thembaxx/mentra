import type { QuestionVisualization } from './visualization-schema';
import { binomialMass, horizontalAcceleration, triangleHypotenuse } from './visualization-schema';

export type VisualCheckpoint = {
  title: string;
  detail: string;
  metric: string;
};
export type VisualCheckpoints = readonly [VisualCheckpoint, VisualCheckpoint, VisualCheckpoint, VisualCheckpoint];

const fmt = (n: number, places = 2) => Number(n.toFixed(places)).toString();
const atomNames = ['Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon'];

/**
 * No AI-authored SVG, executable maths, or step-level model predictions.
 * Each checkpoint is deterministically computed from a validated question model.
 * These checkpoints illustrate known relationships; they do not certify the AI tutor's proof.
 */
export function getVisualCheckpoints(model: QuestionVisualization): VisualCheckpoints {
  switch (model.type) {
    case 'quadratic': {
      const h = -model.b / (2 * model.a);
      const k = model.a * h * h + model.b * h + model.c;
      const discriminant = model.b ** 2 - 4 * model.a * model.c;
      const roots = Math.abs(discriminant) < 1e-8 ? 'One repeated real root'
        : discriminant > 0 ? 'Two distinct real roots' : 'No real roots';
      return [
        { title: 'Identify the coefficients', detail: 'Read a, b and c from f(x) = ax² + bx + c.', metric: 'a = ' + fmt(model.a) + ' · b = ' + fmt(model.b) + ' · c = ' + fmt(model.c) },
        { title: 'Locate the vertex', detail: 'Use h = −b/(2a); then evaluate k = f(h).', metric: 'Vertex (' + fmt(h) + ', ' + fmt(k) + ')' },
        { title: 'Check the discriminant', detail: 'Compute Δ = b² − 4ac to determine the x-intercepts.', metric: 'Δ = ' + fmt(discriminant) },
        { title: 'Interpret the graph', detail: 'The sign of Δ determines the number of real roots.', metric: roots },
      ];
    }
    case 'linear': {
      const f0 = model.intercept;
      const f1 = model.intercept + model.slope;
      return [
        { title: 'Read the relationship', detail: 'Identify the starting value and constant rate of change.', metric: 'm = ' + fmt(model.slope) + ', c = ' + fmt(model.intercept) },
        { title: 'Mark the intercept', detail: 'At input 0, the function equals its intercept.', metric: 'f(0) = ' + fmt(f0) },
        { title: 'Move one input unit', detail: 'A one-unit increase changes the output by the slope.', metric: 'f(1) = ' + fmt(f1) },
        { title: 'Interpret the trend', detail: 'The slope determines whether the line rises, falls or stays level.', metric: model.slope > 0 ? 'Increasing' : model.slope < 0 ? 'Decreasing' : 'Constant' },
      ];
    }
    case 'trigonometry': {
      const angle = model.angleDegrees * Math.PI / 180;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const ordinate = model.function === 'cos' ? cosine : sine;
      return [
        { title: 'Locate the angle', detail: 'Rotate from the positive horizontal axis.', metric: 'θ = ' + fmt(model.angleDegrees) + '°' },
        { title: 'Draw the unit circle', detail: 'Its point has coordinates (cos θ, sin θ).', metric: '(' + fmt(cosine, 3) + ', ' + fmt(sine, 3) + ')' },
        { title: 'Project to the axis', detail: model.function === 'cos' ? 'Cosine is the horizontal coordinate.' : 'Sine is the vertical coordinate.', metric: model.function + ' θ = ' + fmt(ordinate, 3) },
        { title: 'Check the range', detail: 'Both sine and cosine lie between −1 and +1.', metric: '−1 ≤ ' + model.function + ' θ ≤ 1' },
      ];
    }
    case 'atom': {
      const first = Math.min(2, model.atomicNumber);
      const second = model.atomicNumber - first;
      return [
        { title: 'Identify the element', detail: 'The atomic number gives the number of protons.', metric: atomNames[model.atomicNumber - 1] + ' · Z = ' + model.atomicNumber },
        { title: 'Fill the first shell', detail: 'The first shell holds a maximum of 2 electrons.', metric: 'First shell: ' + first + ' e⁻' },
        { title: 'Fill the second shell', detail: 'For the first ten elements, additional electrons occupy the second shell.', metric: 'Second shell: ' + second + ' e⁻' },
        { title: 'Check neutrality', detail: 'A neutral atom has equal numbers of protons and electrons.', metric: model.atomicNumber + ' protons = ' + model.atomicNumber + ' electrons' },
      ];
    }
    case 'doppler': {
      const divisor = model.speedOfSound + (model.direction === 'toward' ? -model.sourceSpeed : model.sourceSpeed);
      const heard = model.emittedFrequency * model.speedOfSound / divisor;
      return [
        { title: 'Identify the waves', detail: 'A stationary listener observes the moving source.', metric: 'Source: ' + fmt(model.emittedFrequency) + ' Hz' },
        { title: 'Choose the direction', detail: model.direction === 'toward' ? 'Approaching waves are compressed.' : 'Receding waves are spread apart.', metric: 'v = ' + fmt(model.speedOfSound) + ' m/s · vₛ = ' + fmt(model.sourceSpeed) + ' m/s' },
        { title: 'Compute heard frequency', detail: 'Apply fₗ = fₛ × v/(v ∓ vₛ) for a stationary listener.', metric: 'fₗ = ' + fmt(heard) + ' Hz' },
        { title: 'Verify the pitch', detail: 'Approaching increases pitch; receding decreases it.', metric: model.sourceSpeed === 0 ? 'Unchanged pitch' : model.direction === 'toward' ? 'Higher pitch' : 'Lower pitch' },
      ];
    }
    case 'right_triangle': {
      const c = triangleHypotenuse(model.legA, model.legB);
      return [
        { title: 'Identify the legs', detail: 'The two given sides meet at a right angle.', metric: 'a = ' + fmt(model.legA) + ' cm · b = ' + fmt(model.legB) + ' cm' },
        { title: 'Apply Pythagoras', detail: 'The squared hypotenuse equals the sum of the squared legs.', metric: 'c² = ' + fmt(model.legA ** 2 + model.legB ** 2) + ' cm²' },
        { title: 'Find the hypotenuse', detail: 'Take the positive square root to get the length.', metric: 'c = ' + fmt(c) + ' cm' },
        { title: 'Check the area', detail: 'Use half the product of the perpendicular legs.', metric: 'Area = ' + fmt(model.legA * model.legB / 2) + ' cm²' },
      ];
    }
    case 'forces': {
      const net = model.appliedForce - model.frictionForce;
      const acceleration = horizontalAcceleration(model.mass, model.appliedForce, model.frictionForce);
      return [
        { title: 'Identify the forces', detail: 'Choose applied force as the positive horizontal direction.', metric: fmt(model.appliedForce) + ' N right · ' + fmt(model.frictionForce) + ' N left' },
        { title: 'Calculate the resultant', detail: 'Subtract the opposing force from the applied force.', metric: 'ΣF = ' + fmt(net) + ' N' },
        { title: 'Apply Newton’s second law', detail: 'Divide the resultant horizontal force by mass.', metric: 'a = ' + fmt(acceleration) + ' m/s²' },
        { title: 'Check the direction', detail: 'Acceleration points in the direction of the resultant force.', metric: net > 0 ? 'Rightward' : net < 0 ? 'Leftward' : 'No horizontal acceleration' },
      ];
    }
    case 'binomial': {
      const mode = Math.min(model.trials, Math.floor((model.trials + 1) * model.probability));
      return [
        { title: 'Identify the trials', detail: 'Each trial has the same chance of success.', metric: 'n = ' + model.trials + ' · p = ' + fmt(model.probability, 3) },
        { title: 'Locate the expected value', detail: 'The distribution has mean n × p.', metric: 'E(X) = ' + fmt(model.trials * model.probability) },
        { title: 'Explore the distribution', detail: 'A highlighted modal outcome is an example, not necessarily the target k in the question.', metric: 'Example: P(X = ' + mode + ') = ' + fmt(binomialMass(model.trials, model.probability, mode) * 100) + '%' },
        { title: 'Check the spread', detail: 'Variance equals n × p × (1 − p).', metric: 'Var(X) = ' + fmt(model.trials * model.probability * (1 - model.probability)) },
      ];
    }
    case 'molecule': {
      const water = model.formula === 'H2O';
      return [
        { title: 'Identify the formula', detail: 'Check the central atom and attached elements.', metric: model.formula },
        { title: 'Inspect the bonds', detail: water ? 'Oxygen makes two single bonds to hydrogen.' : 'Carbon makes two double bonds to oxygen.', metric: water ? '2 O–H single bonds' : '2 C=O double bonds' },
        { title: 'Determine the shape', detail: water ? 'Two lone pairs on O produce a bent molecular shape.' : 'Two electron domains on C produce a linear shape.', metric: water ? 'Bent (V-shaped)' : 'Linear' },
        { title: 'Interpret the angle', detail: 'Bond geometry is a simplified model, not an electron-density simulation.', metric: water ? 'H–O–H ≈ 104.5°' : 'O–C–O = 180°' },
      ];
    }
  }
}

export function phaseForStep(index: number, verification: boolean): 0 | 1 | 2 | 3 {
  if (verification) return 3;
  if (!Number.isFinite(index) || index <= 0) return 0;
  if (index === 1) return 1;
  return 2;
}
