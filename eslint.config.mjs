import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Existing state-hydration effects across the legacy UI predate this PR.
// Keep these visible as warnings, while new modules remain subject to the rule.
const legacyEffectFiles = [
  "app/page.tsx",
  "components/CatalogAndHomework.tsx",
  "components/DailyStudyGoalCard.tsx",
  "components/FlashcardDeckStudio.tsx",
  "components/GlobalSearchBar.tsx",
  "components/HeroThreeScene.tsx",
  "components/PWAAndBrandBar.tsx",
  "components/PomodoroFocusTimer.tsx",
  "components/QuestionGeneratorStudio.tsx",
  "components/VoiceDictationBar.tsx",
  "components/WeeklyActivityReport.tsx",
  "hooks/use-mobile.ts",
  "hooks/usePWAInstall.ts",
  "lib/open-source-voices.ts",
  "lib/sound-effects.ts",
];

export default defineConfig([
  { extends: [...next] },
  {
    files: legacyEffectFiles,
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
]);
