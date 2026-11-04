export type FigureLesson = {
  question: string;
  choices: readonly [string, string];
  correct: 0 | 1;
  instruction: string;
  explanation: string;
  transfer: string;
  transferChoices: readonly [string, string];
  transferCorrect: 0 | 1;
};

export const FIGURE_LESSONS = {
  quadratic: {
    question: "If the vertical shift increases, where does the turning point move?",
    choices: ["Up", "Down"],
    correct: 0,
    instruction: "Move the vertical-shift slider. Watch the turning point and equation.",
    explanation:
      "In vertex form, increasing k shifts the whole parabola upward; its shape does not change.",
    transfer: "What happens if the coefficient a becomes negative?",
    transferChoices: ["The parabola opens down", "The parabola becomes a line"],
    transferCorrect: 0,
  },
  trigonometry: {
    question: "As an angle grows from 0° to 90°, what happens to sin θ?",
    choices: ["It increases to 1", "It decreases to −1"],
    correct: 0,
    instruction: "Move the angle slider from 0° toward 90° and watch the sin θ readout and the circle’s vertical coordinate.",
    explanation:
      "Sine is the vertical coordinate on the unit circle, rising from 0 to 1 in the first quadrant.",
    transfer: "At 90°, what is cos θ?",
    transferChoices: ["0", "1"],
    transferCorrect: 0,
  },
  atom: {
    question: "For a neutral atom, what changes when atomic number goes up by one?",
    choices: ["One more proton and electron", "One more neutron only"],
    correct: 0,
    instruction: "Increase the atomic number and compare the charge and electron count.",
    explanation: "Atomic number counts protons; neutral atoms have an equal number of electrons.",
    transfer: "If an atom loses one electron, is its charge positive or negative?",
    transferChoices: ["Positive", "Negative"],
    transferCorrect: 0,
  },
  linear: {
    question: "If the intercept increases without changing the slope, what happens?",
    choices: ["The line moves up", "The line becomes steeper"],
    correct: 0,
    instruction: "Change the intercept while keeping the slope fixed.",
    explanation:
      "The intercept controls the line's vertical position; slope controls its rate of change.",
    transfer: "If the slope doubles, what changes?",
    transferChoices: ["Its steepness", "Only its intercept"],
    transferCorrect: 0,
  },
  doppler: {
    question: "When a sound source moves toward the listener, what happens to heard pitch?",
    choices: ["It becomes higher", "It becomes lower"],
    correct: 0,
    instruction: "Select 'Toward listener', then adjust source speed and compare frequencies.",
    explanation:
      "Approaching wavefronts arrive more frequently, making the observed frequency higher.",
    transfer: "If the source moves away, does observed frequency rise or fall?",
    transferChoices: ["Fall", "Rise"],
    transferCorrect: 0,
  },
  right_triangle: {
    question: "If both perpendicular sides get longer, what happens to the hypotenuse?",
    choices: ["It gets longer", "It stays constant"],
    correct: 0,
    instruction: "Increase both leg lengths and read the resulting hypotenuse.",
    explanation:
      "The Pythagorean relation c² = a² + b² makes c increase when either positive leg increases.",
    transfer: "If both legs double, how does the hypotenuse change?",
    transferChoices: ["It doubles", "It quadruples"],
    transferCorrect: 0,
  },
  forces: {
    question: "With mass fixed, what does increasing net force do to acceleration?",
    choices: ["It increases", "It decreases"],
    correct: 0,
    instruction: "Keep mass fixed and change the net force; read the acceleration.",
    explanation: "Newton's second law gives acceleration = net force / mass.",
    transfer: "With a fixed positive net force, increasing mass does what to acceleration?",
    transferChoices: ["Decreases it", "Increases it"],
    transferCorrect: 0,
  },
  binomial: {
    question: "With trials fixed, what happens to expected successes if success chance increases?",
    choices: ["Expected successes rise", "Expected successes fall"],
    correct: 0,
    instruction: "Keep n fixed, increase p, and check the expected count n × p.",
    explanation: "For independent trials with constant chance p, the expected count is n × p.",
    transfer: "With p fixed, doubling n does what to expected successes?",
    transferChoices: ["Doubles them", "Leaves them unchanged"],
    transferCorrect: 0,
  },
  molecule: {
    question: "Which molecule has a straight rather than bent shape in this model?",
    choices: ["Carbon dioxide", "Water"],
    correct: 0,
    instruction: "Switch between water and carbon dioxide. Inspect the angle and central atom.",
    explanation:
      "CO₂ is linear (180°); water is bent (about 104.5°) because of electron-pair geometry.",
    transfer: "Does rotating the drawing change the molecule's chemical formula?",
    transferChoices: ["No", "Yes"],
    transferCorrect: 0,
  },
} satisfies Record<string, FigureLesson>;

export type GuidedFigureMode = keyof typeof FIGURE_LESSONS;
