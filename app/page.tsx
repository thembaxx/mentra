'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  PenTool,
  Compass,
  Sparkles,
  Clock,
  Play,
  Share2,
  BarChart3,
  SlidersHorizontal,
  Crown,
} from 'lucide-react';
import { TrackId } from '@/lib/study-data';
import { useSoundSettings } from '@/lib/sound-effects';
import {
  BrandSquircleLogo,
  BrandLogoVariant,
  BRAND_IDENTITY_PRESETS,
  FlowerShape,
  StarburstShape,
  SquiggleBoltShape,
} from '@/components/BrandMotifs';
import {
  SpringButton,
  BouncySurface,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from '@/components/PhysicsUI';
import { HeroThreeScene } from '@/components/HeroThreeScene';
import { QuestionGeneratorStudio } from '@/components/QuestionGeneratorStudio';
import {
  HomeworkAndNotesSection,
  CatalogExplorerView,
} from '@/components/CatalogAndHomework';
import { PlansSectionView, PaywallModal } from '@/components/PlansAndPaywall';
import {
  OfflineIndicator,
  BrandAndNativeStudioModal,
  ThemeMode,
} from '@/components/PWAAndBrandBar';
import {
  DailyStudyGoalCard,
  fireLearnFlowConfetti,
} from '@/components/DailyStudyGoalCard';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { WeeklyActivityReport } from '@/components/WeeklyActivityReport';
import { useNativeCapabilities } from '@/hooks/usePWAInstall';

type ViewId = 'home' | 'practice' | 'catalog' | 'activity' | 'plans';

export default function LearnFlowApp() {
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [activeTrack, setActiveTrack] = useState<TrackId>('exam');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('');
  const [practiceMode, setPracticeMode] = useState<'questions' | 'flashcards'>('questions');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogProgramId, setCatalogProgramId] = useState<string>('');
  const [isPro, setIsPro] = useState<boolean>(false);
  const [freeQuestionsLeft, setFreeQuestionsLeft] = useState<number>(5);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [resolvedDark, setResolvedDark] = useState<boolean>(false);
  const [brandVariant, setBrandVariant] = useState<BrandLogoVariant>('flow');
  const [brandStudioOpen, setBrandStudioOpen] = useState<boolean>(false);
  const [heroPulse, setHeroPulse] = useState<number>(0);

  // Daily Study Goal & Streak Tracking state
  const [dailyTarget, setDailyTarget] = useState<number>(5);
  const [dailyCompleted, setDailyCompleted] = useState<number>(3);
  const [streakDays, setStreakDays] = useState<number>(7);
  const [celebratedToday, setCelebratedToday] = useState<boolean>(false);

  // Paywall & Toast states
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { triggerHaptic, shareStudyProgress } = useNativeCapabilities();
  const { muted: audioMuted, toggleMute: toggleAudioMute, playSound } = useSoundSettings();

  const currentBrand =
    BRAND_IDENTITY_PRESETS.find((b) => b.id === brandVariant) || BRAND_IDENTITY_PRESETS[0];

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Synchronize browser theme-color meta tags, color-scheme, and document background seamlessly
  const applyBrowserThemeSync = useCallback((mode: ThemeMode) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    if (mode === 'light' || mode === 'dark') {
      root.dataset.theme = mode;
      localStorage.setItem('learnflow-theme', mode);
    } else {
      delete root.dataset.theme;
      localStorage.removeItem('learnflow-theme');
    }

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isNowDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);
    setResolvedDark(isNowDark);

    const bgHex = isNowDark ? '#1C1C1A' : '#FFFCF5';
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    metaTags.forEach((meta) => meta.setAttribute('content', bgHex));
  }, []);

  // Hydrate saved theme, brand variant, daily study goal, and PWA shortcut query params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('learnflow-theme') as ThemeMode | null;
    const initialMode: ThemeMode =
      savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system';
    setThemeMode(initialMode);
    applyBrowserThemeSync(initialMode);

    const savedBrand = localStorage.getItem('learnflow-brand') as BrandLogoVariant | null;
    if (savedBrand && BRAND_IDENTITY_PRESETS.some((b) => b.id === savedBrand)) {
      setBrandVariant(savedBrand);
    }

    const savedTarget = localStorage.getItem('learnflow-daily-target');
    if (savedTarget) {
      const parsed = parseInt(savedTarget, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) setDailyTarget(parsed);
    }

    const savedCompleted = localStorage.getItem('learnflow-daily-completed');
    if (savedCompleted) {
      const parsed = parseInt(savedCompleted, 10);
      if (!isNaN(parsed) && parsed >= 0) setDailyCompleted(parsed);
    }

    const savedStreak = localStorage.getItem('learnflow-streak-days');
    if (savedStreak) {
      const parsed = parseInt(savedStreak, 10);
      if (!isNaN(parsed) && parsed >= 1) setStreakDays(parsed);
    }

    // Handle native PWA launcher shortcut URLs (/?track=exam | code | lang)
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track') as TrackId | null;
    if (trackParam === 'exam' || trackParam === 'code' || trackParam === 'lang') {
      setActiveTrack(trackParam);
      setActiveView('practice');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentSaved = localStorage.getItem('learnflow-theme') as ThemeMode | null;
      if (!currentSaved) {
        applyBrowserThemeSync('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [applyBrowserThemeSync]);

  // Update document title when brand identity changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${currentBrand.name} — AI Study & Practice Tutor`;
    }
  }, [currentBrand]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleUpdateDailyTarget = useCallback(
    (newTarget: number) => {
      triggerHaptic(10);
      setDailyTarget(newTarget);
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnflow-daily-target', String(newTarget));
      }
      if (dailyCompleted >= newTarget && !celebratedToday) {
        setCelebratedToday(true);
        fireLearnFlowConfetti();
        showToast(`Daily goal of ${newTarget} questions achieved! Streak extended!`);
      } else {
        showToast(`Daily study target updated to ${newTarget} questions/day`);
      }
    },
    [dailyCompleted, celebratedToday, showToast, triggerHaptic]
  );

  const handleIncrementDailyCompleted = useCallback(() => {
    triggerHaptic(15);
    setDailyCompleted((prev) => {
      const next = prev + 1;
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnflow-daily-completed', String(next));
      }
      if (next >= dailyTarget && prev < dailyTarget) {
        setCelebratedToday(true);
        setStreakDays((s) => {
          const nextStreak = s + 1;
          if (typeof window !== 'undefined') {
            localStorage.setItem('learnflow-streak-days', String(nextStreak));
          }
          return nextStreak;
        });
        fireLearnFlowConfetti();
        showToast(`Daily study goal complete (${next}/${dailyTarget})! Streak extended!`);
      } else {
        showToast(`Progress logged: ${next} of ${dailyTarget} daily questions completed`);
      }
      return next;
    });
    setHeroPulse((p) => p + 1);
  }, [dailyTarget, showToast, triggerHaptic]);

  const handleResetTodayProgress = useCallback(() => {
    triggerHaptic(10);
    setDailyCompleted(0);
    setCelebratedToday(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnflow-daily-completed', '0');
    }
    showToast("Reset today's study goal counter");
  }, [showToast, triggerHaptic]);

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyBrowserThemeSync(mode);
  };

  const toggleQuickTheme = () => {
    triggerHaptic(10);
    const nextMode: ThemeMode = resolvedDark ? 'light' : 'dark';
    handleSelectThemeMode(nextMode);
  };

  const handleSelectBrandVariant = (variant: BrandLogoVariant) => {
    setBrandVariant(variant);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnflow-brand', variant);
    }
    setHeroPulse((p) => p + 1);
  };

  const consumeQuota = useCallback((): boolean => {
    if (isPro) return true;
    if (freeQuestionsLeft <= 0) {
      setPaywallReason(
        `You've used today's 5 free AI questions. Start your 7-day ${currentBrand.name} Pro trial for unlimited practice.`
      );
      setPaywallOpen(true);
      return false;
    }
    setFreeQuestionsLeft((prev) => Math.max(0, prev - 1));
    return true;
  }, [isPro, freeQuestionsLeft, currentBrand.name]);

  const handleOpenPaywall = useCallback((reason: string) => {
    setPaywallReason(reason);
    setPaywallOpen(true);
  }, []);

  const handleUpgradeToPro = useCallback(() => {
    triggerHaptic([15, 40, 20]);
    setIsPro(true);
    setPaywallOpen(false);
    fireLearnFlowConfetti();
    showToast('Pro 7-day trial started! Unlimited AI questions & step-by-step tutor unlocked.');
  }, [showToast, triggerHaptic]);

  const navigateToPractice = (
    track: TrackId,
    topic = '',
    mode: 'questions' | 'flashcards' = 'questions'
  ) => {
    triggerHaptic(10);
    playSound('tap');
    setActiveTrack(track);
    setSelectedTopicFilter(topic);
    setPracticeMode(mode);
    setHeroPulse((p) => p + 1);
    setActiveView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateView = (v: ViewId) => {
    triggerHaptic(8);
    playSound('tap');
    setActiveView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goalCompletedToday = dailyCompleted >= dailyTarget;

  return (
    <div className="min-h-[100dvh] pb-32">
      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        {/* Top Navigation Header with Global Search Bar */}
        <header
          className="flex items-center justify-between gap-3 sm:gap-5 py-4 border-b"
          style={{ borderColor: 'var(--line)' }}
        >
          {/* Zone 1: Brand Wordmark + Tactile Squircle Logo */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={() => navigateView('home')}
            className="flex items-center gap-2.5 sm:gap-3 font-display font-extrabold text-xl sm:text-[26px] tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BrandSquircleLogo variant={brandVariant} size="md" />
            <span>{currentBrand.name}</span>
          </motion.button>

          {/* Global Header Search Bar (Topics, 3D Flashcards, Curriculum & Mentors) */}
          <GlobalSearchBar
            onSelectTopicPractice={(track, topic, mode) => {
              navigateToPractice(track, topic, mode);
              showToast(
                mode === 'flashcards'
                  ? `Opened 3D Flashcards: ${topic}`
                  : `Opened AI Practice: ${topic}`
              );
            }}
            onSelectCatalogProgram={(programId, q) => {
              setCatalogProgramId(programId);
              setCatalogSearchQuery(q);
              navigateView('catalog');
            }}
            onSelectCatalogSearch={(q) => {
              setCatalogProgramId('');
              setCatalogSearchQuery(q);
              navigateView('catalog');
            }}
          />

          {/* Zone 2: Primary Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-semibold shrink-0"
            aria-label="Primary Navigation"
          >
            {(
              [
                { id: 'home', label: 'Overview' },
                { id: 'practice', label: 'AI Practice' },
                { id: 'catalog', label: 'Curriculum' },
                { id: 'activity', label: 'Activity Report' },
              ] as const
            ).map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateView(item.id)}
                  className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active ? 'font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ color: 'var(--ink)' }}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="topNavUnderline"
                      transition={SPRING_SNAPPY}
                      className="absolute left-0 right-0 -bottom-1 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--pk)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Plans & Settings Actions (Moved out of Bottom Navbar) */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_SNAPPY}
              onClick={() => navigateView('plans')}
              className="px-3 sm:px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor:
                  activeView === 'plans'
                    ? 'var(--pk)'
                    : isPro
                    ? 'var(--gr)'
                    : 'var(--yl)',
                color: '#2D2D2B',
                outline: activeView === 'plans' ? '2px solid #2D2D2B' : 'none',
              }}
              aria-label="Open Pro Plans & Membership"
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span>{isPro ? 'Pro Active' : 'Plans'}</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_SNAPPY}
              onClick={() => {
                playSound('tap');
                setBrandStudioOpen(true);
              }}
              className="px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--card)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
              aria-label="Open Settings & Study Preferences"
              title="Settings, Theme, Brand Icons, Audio & Study Goals"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </motion.button>
          </div>
        </header>

        {/* Main Workspace Content with Smooth Physics View Transitions */}
        <main className="pt-6">
          <AnimatePresence mode="wait">
            {activeView === 'home' && (
              <motion.section
                key="view-home"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={SPRING_SNAPPY}
                className="space-y-9"
              >
                {/* Hero Card with Background Geometric Shapes + Live Interactive Three.js 3D Scene */}
                <div
                  className="relative overflow-hidden rounded-[32px] min-h-[430px] sm:min-h-[460px] p-6 sm:p-8 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--bl)', color: '#2D2D2B' }}
                >
                  {/* CSS Geometric Backdrop Layers matching attached HTML */}
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      backgroundColor: 'var(--gr)',
                      width: '68%',
                      aspectRatio: '1 / 1',
                      right: '-18%',
                      top: '-46%',
                    }}
                  />
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      backgroundColor: 'var(--pk)',
                      width: '124px',
                      height: '124px',
                      left: '5%',
                      top: '13%',
                    }}
                  />
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      backgroundColor: 'var(--yl)',
                      left: '-4%',
                      bottom: '-8%',
                      width: '46%',
                      height: '48%',
                      transform: 'rotate(-5deg)',
                      borderRadius: '28px',
                    }}
                  />

                  {/* Interactive Three.js WebGL 3D Sculptures */}
                  <HeroThreeScene activeTrack={activeTrack} pulseTrigger={heroPulse} />

                  {/* Clean Hero Top Status Badge (Settings, Audio, Theme & PWA moved to Settings Modal) */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span
                      className="px-3.5 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'rgba(255, 252, 245, 0.88)', color: '#2D2D2B' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Adaptive AI Studio · {currentBrand.tagline}</span>
                    </span>
                  </div>

                  {/* Giant Hero Display Wordmark */}
                  <motion.h1
                    key={currentBrand.name}
                    initial={{ scale: 0.96, opacity: 0, y: 8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={SPRING_BOUNCY}
                    className="relative z-10 font-display font-extrabold select-none pointer-events-none my-4"
                    style={{
                      fontSize: 'clamp(64px, 16vw, 195px)',
                      color: '#FFFCF5',
                      letterSpacing: '-0.06em',
                      lineHeight: 0.86,
                    }}
                  >
                    {currentBrand.name}
                  </motion.h1>

                  {/* Bottom Hero Copy & Bouncy CTAs */}
                  <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 pt-2">
                    <p
                      className="max-w-[380px] font-semibold text-base sm:text-[18px] leading-snug"
                      style={{ color: '#2D2D2B', textWrap: 'balance' }}
                    >
                      AI practice that grades you, explains every step, and never runs out of questions.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <SpringButton
                        variant="pink"
                        size="lg"
                        magnetic
                        onClick={() => navigateToPractice('exam')}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Start free practice</span>
                      </SpringButton>
                      <SpringButton
                        variant="soft"
                        size="lg"
                        onClick={() => navigateView('plans')}
                      >
                        <span>See Pro</span>
                      </SpringButton>
                    </div>
                  </div>
                </div>

                {/* Greeting & Daily Study Goal Tracking Section */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2
                      className="font-display font-extrabold"
                      style={{ fontSize: 'clamp(36px, 6vw, 58px)' }}
                    >
                      Hi, Alex
                    </h2>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs sm:text-sm font-semibold tabular-nums"
                        style={{ color: 'var(--mute)' }}
                      >
                        {streakDays}-day study streak ·{' '}
                        {isPro
                          ? 'Pro Member'
                          : `${freeQuestionsLeft}/5 free daily AI questions`}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigateView('activity')}
                        className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                        style={{
                          backgroundColor: 'var(--yl)',
                          color: '#2D2D2B',
                        }}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Weekly Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic(10);
                          const res = await shareStudyProgress(
                            `${currentBrand.name} Study Progress`,
                            `${streakDays}-day study streak (${dailyCompleted}/${dailyTarget} daily goal) on ${currentBrand.name}!`
                          );
                          showToast(
                            res === 'shared'
                              ? 'Shared study streak!'
                              : 'Study progress link copied!'
                          );
                        }}
                        className="p-2 rounded-full cursor-pointer"
                        style={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--line)',
                        }}
                        title="Share study progress"
                        aria-label="Share study progress"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Daily Study Goal Tracker Card with Visual Progress Ring & Confetti */}
                  <DailyStudyGoalCard
                    completedCount={dailyCompleted}
                    targetCount={dailyTarget}
                    streakDays={streakDays}
                    goalCompletedToday={goalCompletedToday}
                    onUpdateTarget={handleUpdateDailyTarget}
                    onIncrementCompleted={handleIncrementDailyCompleted}
                    onResetTodayProgress={handleResetTodayProgress}
                    onStartPractice={() => navigateToPractice(activeTrack)}
                  />

                  {/* Next AI Session Banner Card matching HTML .sess */}
                  <BouncySurface
                    onClick={() => navigateToPractice('exam', 'Linear equations')}
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                    }}
                    className="rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <BrandSquircleLogo variant={brandVariant} size="md" />
                      <div>
                        <div className="font-bold text-base sm:text-lg">
                          SAT Math: algebra sprint
                        </div>
                        <div className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
                          Your AI tutor · 15-minute adaptive drill
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm sm:text-base flex items-center justify-end gap-1.5 tabular-nums">
                        <Clock className="w-4 h-4" />
                        <span>Today 18:00</span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--mute)' }}>
                        Click to start early
                      </div>
                    </div>
                  </BouncySurface>

                  {/* Horizontal Quick-Launch Tiles Row matching HTML .row & Classly Stories */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={SPRING_BOUNCY}
                      onClick={() => navigateToPractice('exam', 'Linear equations')}
                      className="h-40 rounded-3xl p-4 relative overflow-hidden text-left flex items-end font-display font-extrabold text-lg leading-tight cursor-pointer"
                      style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
                    >
                      <FlowerShape
                        className="w-24 h-24 absolute -right-2 -top-2"
                        color="var(--bl)"
                        centerColor="var(--yl)"
                      />
                      <span className="relative z-10">Daily quiz</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={SPRING_BOUNCY}
                      onClick={() =>
                        navigateToPractice('lang', 'Ongoing actions (Llevar + Gerund)')
                      }
                      className="h-40 rounded-3xl p-4 relative overflow-hidden text-left flex items-end font-display font-extrabold text-lg leading-tight cursor-pointer"
                      style={{ backgroundColor: 'var(--bl)', color: '#2D2D2B' }}
                    >
                      <StarburstShape
                        className="w-24 h-24 absolute -right-2 -top-2"
                        color="var(--yl)"
                      />
                      <span className="relative z-10">Spanish level test</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={SPRING_BOUNCY}
                      onClick={() => navigateToPractice('code', 'Two pointers')}
                      className="h-40 rounded-3xl p-4 relative overflow-hidden text-left flex items-end font-display font-extrabold text-lg leading-tight cursor-pointer"
                      style={{ backgroundColor: 'var(--gr)', color: '#2D2D2B' }}
                    >
                      <SquiggleBoltShape
                        className="w-28 h-24 absolute -right-2 -top-1"
                        waveColor="var(--pk)"
                        boltColor="var(--bl)"
                      />
                      <span className="relative z-10">Ask the AI tutor</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={SPRING_BOUNCY}
                      onClick={() => navigateToPractice('code', 'Sliding window', 'flashcards')}
                      className="h-40 rounded-3xl p-4 relative overflow-hidden text-left flex items-end font-display font-extrabold text-lg leading-tight cursor-pointer"
                      style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
                    >
                      <StarburstShape
                        className="w-24 h-24 absolute -right-2 -top-2"
                        color="var(--gr)"
                      />
                      <span className="relative z-10">3D Flashcards · Swipe to master</span>
                    </motion.button>
                  </div>
                </div>

                {/* Popular Tracks Section matching HTML .grid3 */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl sm:text-3xl font-display font-extrabold">
                      Popular tracks
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateView('catalog')}
                      className="text-xs sm:text-sm font-semibold underline cursor-pointer"
                      style={{ color: 'var(--mute)' }}
                    >
                      Explore full catalog
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'exam' as TrackId,
                        title: 'Exam prep',
                        desc: 'SAT, ACT, GRE and more. Questions adapt to your level in real time.',
                        rating: '4.8',
                        symbol: '∑',
                        bg: 'var(--gr)',
                      },
                      {
                        id: 'code' as TrackId,
                        title: 'Coding interviews',
                        desc: 'Explain your approach out loud and get graded like a real interviewer would.',
                        rating: '4.9',
                        symbol: '</>',
                        bg: 'var(--bl)',
                      },
                      {
                        id: 'lang' as TrackId,
                        title: 'Languages',
                        desc: 'Translate, conjugate and fix grammar with instant streaming feedback.',
                        rating: '4.7',
                        symbol: 'Ñ',
                        bg: 'var(--yl)',
                      },
                    ].map((trk) => (
                      <BouncySurface
                        key={trk.id}
                        onClick={() => navigateToPractice(trk.id)}
                        style={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--line)',
                        }}
                        className="rounded-3xl p-6 min-h-[210px] flex flex-col justify-between cursor-pointer relative"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="w-12 h-12 rounded-2xl grid place-items-center font-display font-extrabold text-xl"
                            style={{ backgroundColor: trk.bg, color: '#2D2D2B' }}
                          >
                            {trk.symbol}
                          </div>
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: 'var(--mute)' }}
                          >
                            ★ {trk.rating}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-6">
                          <h4 className="text-2xl font-display font-extrabold">{trk.title}</h4>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
                            {trk.desc}
                          </p>
                        </div>
                      </BouncySurface>
                    ))}
                  </div>
                </div>

                {/* Homework Practice Sets & Study Notes Section */}
                <HomeworkAndNotesSection
                  onLaunchTopic={(track, topic) => navigateToPractice(track, topic)}
                  onNotify={showToast}
                />
              </motion.section>
            )}

            {activeView === 'practice' && (
              <motion.section
                key="view-practice"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={SPRING_SNAPPY}
              >
                <QuestionGeneratorStudio
                  activeTrack={activeTrack}
                  onSelectTrack={(t) => setActiveTrack(t)}
                  isPro={isPro}
                  freeLeft={freeQuestionsLeft}
                  onConsumeQuota={consumeQuota}
                  onOpenPaywall={handleOpenPaywall}
                  onNotify={showToast}
                  initialTopicFilter={selectedTopicFilter}
                  initialPracticeMode={practiceMode}
                  onQuestionCompleted={handleIncrementDailyCompleted}
                />
              </motion.section>
            )}

            {activeView === 'catalog' && (
              <motion.section
                key="view-catalog"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={SPRING_SNAPPY}
              >
                <CatalogExplorerView
                  onStartProgramTrack={(track, topic) => navigateToPractice(track, topic)}
                  onNotify={showToast}
                  initialSearchQuery={catalogSearchQuery}
                  initialProgramId={catalogProgramId}
                />
              </motion.section>
            )}

            {activeView === 'activity' && (
              <motion.section
                key="view-activity"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={SPRING_SNAPPY}
              >
                <WeeklyActivityReport
                  dailyCompleted={dailyCompleted}
                  dailyTarget={dailyTarget}
                  streakDays={streakDays}
                  onStartTrackPractice={(track, topic) => navigateToPractice(track, topic)}
                  onNotify={showToast}
                />
              </motion.section>
            )}

            {activeView === 'plans' && (
              <motion.section
                key="view-plans"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={SPRING_SNAPPY}
              >
                <PlansSectionView
                  isPro={isPro}
                  onUpgradePro={handleUpgradeToPro}
                  onNotify={showToast}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Compact 4-Item Floating Bottom Navigation Dock with Safe-Area Inset */}
      <nav
        aria-label="Bottom Dock Navigation"
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 sm:gap-1 p-1.5 rounded-full shadow-xl max-w-fit"
        style={{
          bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--line)',
        }}
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'practice', label: 'Practice', icon: PenTool },
            { id: 'catalog', label: 'Catalog', icon: Compass },
            { id: 'activity', label: 'Activity', icon: BarChart3 },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => navigateView(item.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING_SNAPPY}
              className="relative px-3.5 sm:px-4 py-1.5 rounded-full flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
              style={{
                color: active ? '#2D2D2B' : 'var(--mute)',
              }}
            >
              {active && (
                <motion.span
                  layoutId="bottomNavHighlight"
                  transition={SPRING_BOUNCY}
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: 'var(--pk)' }}
                />
              )}
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" strokeWidth={2} />
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Unified Settings, Study Goals, Membership, Brand & Native PWA Modal */}
      <BrandAndNativeStudioModal
        open={brandStudioOpen}
        onClose={() => setBrandStudioOpen(false)}
        brandVariant={brandVariant}
        onSelectBrandVariant={handleSelectBrandVariant}
        themeMode={themeMode}
        onSelectThemeMode={handleSelectThemeMode}
        dailyTarget={dailyTarget}
        dailyCompleted={dailyCompleted}
        onUpdateDailyTarget={handleUpdateDailyTarget}
        onResetTodayProgress={handleResetTodayProgress}
        isPro={isPro}
        freeQuestionsLeft={freeQuestionsLeft}
        onUpgradeToPro={handleUpgradeToPro}
        onOpenPlansView={() => navigateView('plans')}
        onNotify={showToast}
      />

      {/* Pro Paywall Modal */}
      <PaywallModal
        open={paywallOpen}
        reason={paywallReason}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={handleUpgradeToPro}
      />

      {/* Physics Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={SPRING_BOUNCY}
            className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg max-w-[90vw] text-center"
            style={{ backgroundColor: '#2D2D2B', color: '#FFFCF5' }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
