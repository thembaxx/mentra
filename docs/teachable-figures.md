# Teachable figures · Mentra

The existing interactive visual lab stays available without a learning gate. Select **Start guide** to use a predict → try → explain sequence for any of its nine visual modes.

- **Claim:** Changing a single control produces a causal change visible in the model.
- **Misconception:** The changed outcome is arbitrary or explained by an unrelated input.
- **Prediction:** Two options are shown before the model mounts in guided mode.
- **Experiment:** Reuse the existing visual model and its sliders.
- **Explanation and transfer:** Learners compare the result with a plain-language model and apply it to another question.
- **Assumptions:** All visuals are simplified educational representations. Question-specific data remains in the existing visualization.
- **Privacy:** No learner identity or answer history is stored by this pilot.

Upstream method: https://github.com/ywEdAi/teachable-figures (predict / try / explain). The code here is an original React integration, not a vendored copy of the upstream skill.

## Validation
Run \`npm run test:visualizations\`, \`npm run typecheck\`, \`npm run lint\`, \`npm run format:check\`, and \`npm run build\`. Manually check guided steps and ordinary mode on 320px, 390px and desktop, with keyboard and reduced motion.
