# Mentra — LearnFlow

An interactive, Next.js-based study and practice prototype spanning exam preparation, interview practice, and language-learning concepts. The interface includes learning tracks, flashcards, a study catalog, progress visualizations, motion, and optional Gemini-assisted study features.

> **Project status:** Prototype. UI indicators, subscription controls and demonstration values must not be treated as evidence of live subscriptions, persisted learning analytics, completed payments or real customer results. Verify external AI configuration before using it with personal information.

## Stack

- Next.js App Router, React, TypeScript and Tailwind CSS
- Motion, Three.js, Recharts and KaTeX
- Optional Gemini integration, configured server-side

Use [package.json](package.json) for authoritative dependency versions.

## Run locally

Install dependencies with `npm ci`. Copy `.env.example` to `.env.local` and configure the server-side Gemini key only if exercising AI features. Never commit real keys.

```sh
npm ci
npm run dev
```

## Verify

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

The `test` command runs the existing visualization and tutor-step regression suite. GitHub's lightweight CI also runs this suite; a dedicated [visual-learning workflow](.github/workflows/visual-learning.yml) covers relevant changes.

## Engineering notes

- Treat generated explanations and solutions as fallible; educational outputs need user review.
- Preserve keyboard interaction and non-WebGL fallbacks for visual content.
- Validate production configuration and live integrations separately from a successful build.
- Do not infer enrollment, revenue, model accuracy or persistence from simulated UI.
