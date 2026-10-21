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

## Architecture and future work
The current models are deterministic examples, not AI-generated geometry, and values may not match every individual streamed question. This is disclosed in the lab.

For accurate **AI-specific** diagrams, extend `PracticeQuestion` with an optional validated `visualization` discriminated union. Let the model select a safe type and bounded numeric parameters (for example `{type:'quadratic', a:1, b:-6, c:13}`); never evaluate AI-created JavaScript, arbitrary function strings, JSX or raw SVG. Parse and validate server-side with strict ranges and known topic schema; render only known visual components. The UI should report when a visualization is illustrative rather than an exact representation.

Longer-term opportunities: physics free-body and wave diagrams, geometry constructions, interactive probability distributions, force diagrams and chemistry electron-density visualizations. Add these one validated component at a time.

Use SVG for explanatory 2D plots and pointer/keyboard manipulation. Use Three.js / React Three Fiber only when meaningful 3D rotation/depth is essential; avoid three.js for 2D function plots to reduce initial bundle and battery drain.

## Verification checklist
1. On Safari iOS, Chrome mobile and desktop, flip an exam, coding and language flashcard repeatedly. The hidden face must never bleed through, mirror or overlap. Test both themes.
2. Swipe in each direction, use keyboard Space/Enter, and use the back-side copy button. Copy must not flip the card.
3. Switch to **Unmastered**, mark multiple cards mastered, and confirm no card is skipped and no card is accidentally marked mastered twice.
4. Test unusually long AI-generated front titles, formula blocks and code snippets at 320px, 390px, tablet, and desktop widths. Back content should scroll independently; footer stays visible.
5. Open a quadratic question and inspect the (3, 4) vertex; move both sliders and reflect the parabola. The root status must follow the signs of the parabola's vertex and opening.
6. In trigonometry, check 0°, 90°, 180°, 270° and 360° on the circle/graph. Pause and resume. Change models.
7. Inspect neutral atoms H, He, C and Ne, count shell electrons, and test pause/resume.
8. Enable reduce motion and test focusable sliders, buttons, model switcher and explanation steps.
9. Review dark theme contrast, horizontal overflow, text wrapping and screen-reader labels. Then run lint, TypeScript, build and mobile browser smoke testing before merging.

Note: the repository's current reusable GitHub quality workflow disables its build and test stages. Successful lint alone does not constitute visual or browser QA.
