# Mentra · LearnFlow

**An interactive study and practice workspace** exploring how AI-assisted tutoring, visual explanations, flashcards and motivating feedback can make learning more engaging.

> **Project status:** actively developed prototype. The current application metadata still uses the name **LearnFlow**. Features below are evidenced in source code, not a claim that the live production deployment or every integration currently works. No public deployment URL or screenshot is included without independent verification.

## Product experience

- **Practice across different tracks:** exam preparation, coding interviews and language learning, with a topic explorer and question-generation studio.
- **Multiple study modes:** question practice, flashcard decks, study notes, daily study goals and weekly activity summaries.
- **Visual learning experiments:** mathematics rendering, interactive visual lab components, animated diagrams and a Three.js hero scene.
- **Interface systems:** light/dark/system themes, brand variants, responsive component interactions, loading states and PWA manifest/shortcuts.
- **AI-backed paths:** tutor and visualization API route implementations exist. Running real generation requires appropriate server-side API configuration.

The project currently contains both demonstration state and paid-plan/paywall UI experiments. Their presence in source is not evidence of a production billing system or verified persistent learner accounts.

## Engineering highlights

- Component-based React/TypeScript architecture and Next.js App Router.
- Motion-powered interaction patterns, Three.js scenes, KaTeX formulas and Recharts-based reporting/visualization dependencies.
- Dedicated tests for tutor visual steps and visualization schemas in `tests/`.
- Native capability hooks and PWA packaging work, with browser-local UI preferences.

## Technology

From the current [package manifest](package.json): **Next.js 16**, **React 19**, **TypeScript 7**, **Tailwind CSS 4**, **Motion 14**, **Three.js**, **KaTeX**, **Recharts**, **Google GenAI SDK**, **Oxlint** and **Oxfmt**.

## Run locally

Requirements: a compatible Node.js/npm environment and an API key if testing actual Gemini-backed generation.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Replace the example value with a real `GEMINI_API_KEY` in `.env.local`; never commit secrets. The bundled example also documents `APP_URL` for hosted environments. Some UI may use demonstration values without a configured API.

Available repository scripts:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:visualizations
npm run build
```

**Verification notice:** the presence of these scripts and tests does not mean they currently pass. Investigate the GitHub Actions and deployment results before describing Mentra as production-ready.

## Explore the implementation

- [Main application and study navigation](app/page.tsx)
- [Flashcard deck studio](components/FlashcardDeckStudio.tsx)
- [Interactive visual learning lab](components/InteractiveVisualLab.tsx)
- [Visual model implementations](components/ExpandedVisualModels.tsx)
- [Tutor API endpoint](app/api/tutor/route.ts)
- [Visualization API endpoint](app/api/visualization/route.ts)
- [Visualization schema tests](tests/visualization-schema.test.mjs)

## Screenshots and deployment

No fresh, exportable 1440 × 900 desktop or 390 × 844 mobile screenshots were available when this README was authored. Screenshots should only be added to `docs/screenshots/` after capturing the actual working interface. A live URL should be added only once it is verified to load successfully.

---

[Source repository](https://github.com/thembaxx/mentra)
