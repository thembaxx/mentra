# Mentra visual learning and motion quality

## Design intent

Keep Mentra's existing warm cream, yellow, blue, green and pink palette, typography, spring motion, and dark-mode support. The reference images inspire clear diagram-first learning but are not reproduced as static screenshots. Accessible, manipulable models are more helpful than ornamental animation.

## Implemented

- **Interactive visual lab** beside the existing practice question. It is only offered for clearly related exam topics, so an unrelated graph is never presented as if it were the AI question's solution.
- **Quadratic functions:** responsive SVG plot, reference parabola, turning point and symmetry guide, horizontal/vertical sliders, reflection toggle, reset action and live statement of the number of real roots. The starting example uses the existing exam parabola with vertex (3, 4).
- **Trigonometry:** synchronized cosine wave and unit circle, angle slider, live sin/cos values, play/pause animation.
- **Atomic models:** simplified neutral-atom shell explorer for elements H–Ne, atomic-number slider, electron animation and an explicit warning that electron 'orbits' are a teaching analogy, not quantum trajectories.
- **Animation preferences:** lab transitions and procedural animations respect reduced motion, and idle simulations do not advance in hidden tabs.
- **Flashcard rendering:** GPU-isolated front/back planes; angle-driven visibility avoids mirrored text on backfaces; scroll is inside the back's content region instead of on the rotated plane; longer text, code and labels are constrained to the card; responsive deck height and keyboard controls are improved.
- **Filtered queue:** mastering in the unmastered view no longer immediately mutates the deck under an exiting card and skips another card.
- **Accessibility and security:** explanation steps and tappable cards get keyboard handling/focus visibility; AI-provided LaTeX no longer opts into trusted KaTeX HTML.

## Architecture as of October 2026

The initial demo models have been expanded. The tutor and practice experience support nine validated visual types: quadratics, linear graphs, trigonometry, atoms, Doppler, right triangles, horizontal force diagrams, binomial probability, and H₂O/CO₂ molecular geometry.

- `lib/visualization-schema.ts` accepts a strict discriminated union and bounded numeric inputs. AI-suggested visualization JSON is **not trusted on its own**: `/api/visualization` checks the supplied question independently, and unsupported or ambiguous models remain concept examples.
- `components/InteractiveVisualLab.tsx` is an interactive, what-if model; question-matched values remain distinguishable from illustrative values.
- `lib/tutor-step-parser.ts` groups explanation paragraphs under their numbered headings and supplies stable step IDs during streamed responses.
- `lib/step-visualization.ts` computes deterministic concept checkpoints from the already validated question data. This is not mathematical proof that the AI explanation itself is correct.
- `components/StepVisualJourney.tsx` visually accompanies the Pro tutor's numbered explanation cards; the selected step is the single source of truth for the visual checkpoint and its navigation. When there are fewer than four explanation steps, intermediate visual milestones may be skipped so the last step still shows a complete diagram.
- The mobile visual viewport retains a readable SVG minimum width rather than shrinking all labels on phones. Users can swipe to pan it. Step-jump buttons and Previous/Next controls have 44px or larger targets and disclose the currently selected step to assistive technologies.
- Scene math handles stationary Doppler sources without a fictitious pitch shift; the simplified H₂O illustration uses a 104.5° bond angle. Reduced-motion preferences disable the visual checkpoint transition.

Use SVG for explanatory 2D plots and keyboard/pointer manipulation. Introduce 3D only when depth or orbital rotation materially changes the lesson.

## Automated verification

`npm run test:visualizations` executes both the schema and step-navigation Node regression suites. The dedicated **Visual learning verification** GitHub Action runs `npm ci`, TypeScript, ESLint, those tests, and the production build. Legacy React-hooks warnings in older components remain warnings. A green CI run is **not** proof of iPhone Safari rendering or VoiceOver usability.

## Manual device QA (outstanding until run on hardware)

1. On **iPhone Safari** at 320px, 390px and larger widths, navigate the visual tutor through 3-step, 4-step and 5+-step explanations. The selected card, stage indicator and spoken checkpoint should stay synchronized.
2. Swipe sideways inside the SVG viewport; it should pan without cropping key annotations or scrolling the entire page horizontally. Keyboard-focus the diagram region and scroll with arrow keys.
3. With **VoiceOver** on iOS, navigate numbered explanation cards, step-jump buttons, Previous/Next, and the live status. Verify the screen reader announces the current step without duplicating SVG descriptions.
4. Enable **Reduce Motion** in iOS accessibility settings. Step diagrams should update directly, without unnecessary movement.
5. Check all nine models, including H₂O's bent angle, CO₂'s linear geometry, source speed 0 in Doppler, zero horizontal force and probability extremes.
6. Test the dark/light themes and higher text sizes, including longer KaTeX in steps. The minimum SVG width should not force the main screen to overflow.
7. Revisit flashcard flips in Safari (exam, code and language), long back content, swipe gestures, VoiceOver and filtered queues to catch regressions from earlier work.

A physical-device and VoiceOver pass still requires a tester with access to the device; browser builds, screenshots and pure tests cannot establish that pass.
