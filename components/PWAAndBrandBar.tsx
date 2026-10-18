'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Share2,
  Smartphone,
  Check,
  WifiOff,
  Sun,
  Moon,
  Monitor,
  Zap,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Target,
  Clock,
  RotateCcw,
  Plus,
  Minus,
  Crown,
  ArrowUpRight,
  SlidersHorizontal,
  Palette,
} from 'lucide-react';
import {
  usePWAInstall,
  useOnlineStatus,
  useNativeCapabilities,
} from '@/hooks/usePWAInstall';
import {
  BrandSquircleLogo,
  BrandLogoVariant,
  BRAND_IDENTITY_PRESETS,
} from './BrandMotifs';
import { SpringButton, BouncySurface, SPRING_SNAPPY, SPRING_BOUNCY } from './PhysicsUI';
import { useSoundSettings, SoundCueType } from '@/lib/sound-effects';
import { HOMEWORK_ORDER_STORAGE_KEY } from './CatalogAndHomework';

export type ThemeMode = 'system' | 'light' | 'dark';
type SettingsTab = 'study' | 'appearance' | 'system';

const GOAL_PRESETS = [3, 5, 10, 15, 20];
const POMODORO_PRESETS = [
  { mins: 15, label: '15m Sprint', desc: 'Fast recall burst' },
  { mins: 25, label: '25m Classic', desc: 'Standard Pomodoro' },
  { mins: 45, label: '45m Deep Work', desc: 'Exam simulation' },
];

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={SPRING_SNAPPY}
          role="status"
          className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg"
          style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Cached study sets & local AI fallback active</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PWAInstallButton({
  brandVariant,
  brandName,
  onOpenBrandStudio,
  onNotify,
}: {
  brandVariant: BrandLogoVariant;
  brandName: string;
  onOpenBrandStudio: () => void;
  onNotify: (msg: string) => void;
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { triggerHaptic } = useNativeCapabilities();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic(15);
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        onNotify(`${brandName} installed to your home screen!`);
      }
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    setShowIOSGuide(true);
  };

  return (
    <>
      <SpringButton
        size="sm"
        variant="card"
        onClick={handleInstallClick}
        aria-label={`Install ${brandName} Progressive Web App`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </SpringButton>

      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(28, 28, 26, 0.62)' }}
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 14 }}
              transition={SPRING_BOUNCY}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl"
              style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandSquircleLogo variant={brandVariant} size="lg" />
                  <div>
                    <h3 className="font-display font-extrabold text-xl">
                      Install {brandName}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--mute)' }}>
                      Full-screen standalone PWA · Offline ready
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 rounded-full cursor-pointer"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="rounded-2xl p-4 space-y-2.5 text-sm"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <div className="font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Add to Home Screen / Desktop Dock</span>
                </div>
                <ol
                  className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm"
                  style={{ color: 'var(--mute)' }}
                >
                  <li>
                    On <strong>iOS Safari</strong>: Tap the <strong>Share</strong> icon in the browser bar, then select <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    On <strong>Chrome / Edge / Desktop</strong>: Click the install badge in the address bar (or open inside a top-level tab if viewing in a preview frame).
                  </li>
                  <li>
                    Launch <strong>{brandName}</strong> directly from your home screen with adaptive status-bar theming and offline practice.
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <SpringButton
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    setShowIOSGuide(false);
                    onOpenBrandStudio();
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Customize App Icon & Brand</span>
                </SpringButton>
                <SpringButton
                  size="sm"
                  variant="pink"
                  onClick={() => setShowIOSGuide(false)}
                >
                  Got it
                </SpringButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function BrandAndNativeStudioModal({
  open,
  onClose,
  brandVariant,
  onSelectBrandVariant,
  themeMode,
  onSelectThemeMode,
  dailyTarget = 5,
  dailyCompleted = 3,
  onUpdateDailyTarget,
  onResetTodayProgress,
  isPro = false,
  freeQuestionsLeft = 5,
  onUpgradeToPro,
  onOpenPlansView,
  onNotify,
}: {
  open: boolean;
  onClose: () => void;
  brandVariant: BrandLogoVariant;
  onSelectBrandVariant: (v: BrandLogoVariant) => void;
  themeMode: ThemeMode;
  onSelectThemeMode: (m: ThemeMode) => void;
  dailyTarget?: number;
  dailyCompleted?: number;
  onUpdateDailyTarget?: (newTarget: number) => void;
  onResetTodayProgress?: () => void;
  isPro?: boolean;
  freeQuestionsLeft?: number;
  onUpgradeToPro?: () => void;
  onOpenPlansView?: () => void;
  onNotify: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('study');
  const [pomodoroDefaultMins, setPomodoroDefaultMins] = useState<number>(25);

  const { swRegistered, isInstalled } = usePWAInstall();
  const {
    triggerHaptic,
    shareStudyProgress,
    wakeLockActive,
    toggleFocusWakeLock,
  } = useNativeCapabilities();
  const { muted: audioMuted, toggleMute: toggleAudioMute, playSound } = useSoundSettings();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPom = localStorage.getItem('learnflow-pomodoro-default-mins');
    if (savedPom) {
      const parsed = parseInt(savedPom, 10);
      if (!isNaN(parsed)) setPomodoroDefaultMins(parsed);
    }
  }, [open]);

  const handleSelectPomodoroDefault = (mins: number) => {
    triggerHaptic(10);
    playSound('option');
    setPomodoroDefaultMins(mins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnflow-pomodoro-default-mins', String(mins));
      window.dispatchEvent(new Event('learnflow-pomodoro-updated'));
    }
    onNotify(`Default Pomodoro focus sprint set to ${mins} minutes`);
  };

  const handleResetHomeworkQueue = () => {
    triggerHaptic(10);
    playSound('tap');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HOMEWORK_ORDER_STORAGE_KEY);
      window.dispatchEvent(new Event('learnflow-homework-order-updated'));
    }
    onNotify('Homework priority queue order reset to default');
  };

  const currentBrand =
    BRAND_IDENTITY_PRESETS.find((b) => b.id === brandVariant) || BRAND_IDENTITY_PRESETS[0];

  const soundPreviewButtons: { label: string; cue: SoundCueType }[] = [
    { label: 'Button Tap', cue: 'tap' },
    { label: 'Quiz Mastered', cue: 'grade_success' },
    { label: 'Step Unfold', cue: 'step_reveal' },
    { label: 'Daily Goal Fanfare', cue: 'goal_reached' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(28, 28, 26, 0.65)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 14 }}
            transition={SPRING_BOUNCY}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-[32px] p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90dvh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <BrandSquircleLogo variant={brandVariant} size="lg" />
                <div>
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
                    Settings & Study Preferences
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
                    Study goals, membership plan, theme sync, brand icons & audio cues
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full cursor-pointer"
                style={{ backgroundColor: 'var(--card)' }}
                aria-label="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Category Tabs */}
            <div
              className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
              role="tablist"
              aria-label="Settings Categories"
            >
              {(
                [
                  { id: 'study', label: 'Study & Plan', icon: SlidersHorizontal },
                  { id: 'appearance', label: 'Theme & Brand', icon: Palette },
                  { id: 'system', label: 'Audio & PWA', icon: Volume2 },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_SNAPPY}
                    onClick={() => {
                      playSound('option');
                      setActiveTab(tab.id);
                    }}
                    className="relative py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer"
                    style={{ color: active ? '#2D2D2B' : 'var(--ink)' }}
                  >
                    {active && (
                      <motion.span
                        layoutId="settingsModalTabPill"
                        transition={SPRING_BOUNCY}
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: 'var(--pk)' }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* TAB 1: STUDY GOALS, FOCUS TIMER, HOMEWORK QUEUE & PRO PLANS */}
            {activeTab === 'study' && (
              <motion.div
                key="tab-study"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_SNAPPY}
                className="space-y-5"
              >
                {/* Membership & Pro Plan Card */}
                <div
                  className="rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4"
                  style={{
                    backgroundColor: isPro ? 'var(--gr)' : '#2D2D2B',
                    color: isPro ? '#2D2D2B' : '#FFFCF5',
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider opacity-85">
                      <Crown className="w-4 h-4" />
                      <span>
                        {isPro ? `${currentBrand.name} Pro Active` : 'Starter Free Plan'}
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-xl">
                      {isPro
                        ? 'Unlimited AI questions & step-by-step tutor unlocked'
                        : `${freeQuestionsLeft} of 5 free daily AI questions remaining`}
                    </h3>
                    <p className="text-xs opacity-80">
                      {isPro
                        ? 'Thank you for supporting adaptive AI learning.'
                        : 'Upgrade to Pro for unlimited questions, full rubric breakdowns & exam mocks.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isPro && onUpgradeToPro && (
                      <SpringButton
                        size="sm"
                        variant="yellow"
                        onClick={() => {
                          onUpgradeToPro();
                          onClose();
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Start 7-Day Pro Trial</span>
                      </SpringButton>
                    )}
                    {onOpenPlansView && (
                      <SpringButton
                        size="sm"
                        variant={isPro ? 'card' : 'pink'}
                        onClick={() => {
                          onOpenPlansView();
                          onClose();
                        }}
                      >
                        <span>Compare Plans</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </SpringButton>
                    )}
                  </div>
                </div>

                {/* Daily Study Goal Target & Progress Reset */}
                <div
                  className="rounded-2xl p-4 sm:p-5 space-y-3.5"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>Daily Study Goal Target</span>
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--mute)' }}>
                        Today’s progress: {dailyCompleted} / {dailyTarget} questions completed
                      </p>
                    </div>

                    {onUpdateDailyTarget && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateDailyTarget(Math.max(1, dailyTarget - 1))}
                          className="w-8 h-8 rounded-xl grid place-items-center cursor-pointer"
                          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                          aria-label="Decrease daily target"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-display font-extrabold text-base px-2.5 tabular-nums">
                          {dailyTarget}/day
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateDailyTarget(Math.min(50, dailyTarget + 1))}
                          className="w-8 h-8 rounded-xl grid place-items-center cursor-pointer"
                          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                          aria-label="Increase daily target"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {onUpdateDailyTarget && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 flex-1">
                        {GOAL_PRESETS.map((preset) => {
                          const active = dailyTarget === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => onUpdateDailyTarget(preset)}
                              className="flex-1 py-2 rounded-xl text-xs font-extrabold cursor-pointer tabular-nums transition-transform active:scale-95"
                              style={{
                                backgroundColor: active ? 'var(--yl)' : 'var(--bg)',
                                color: active ? '#2D2D2B' : 'var(--ink)',
                                border: '1px solid var(--line)',
                              }}
                            >
                              {preset} Qs
                            </button>
                          );
                        })}
                      </div>

                      {onResetTodayProgress && dailyCompleted > 0 && (
                        <SpringButton
                          size="sm"
                          variant="soft"
                          onClick={onResetTodayProgress}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Today ({dailyCompleted})</span>
                        </SpringButton>
                      )}
                    </div>
                  )}
                </div>

                {/* Default Pomodoro Focus Timer Preset */}
                <div
                  className="rounded-2xl p-4 sm:p-5 space-y-3"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <div>
                    <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Default Pomodoro Focus Sprint</span>
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--mute)' }}>
                      Sets the default countdown interval in the AI Practice studio
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {POMODORO_PRESETS.map((preset) => {
                      const active = pomodoroDefaultMins === preset.mins;
                      return (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => handleSelectPomodoroDefault(preset.mins)}
                          className="p-3 rounded-xl text-left cursor-pointer transition-transform active:scale-95"
                          style={{
                            backgroundColor: active ? 'var(--bl)' : 'var(--bg)',
                            color: active ? '#2D2D2B' : 'var(--ink)',
                            border: active ? '2px solid #2D2D2B' : '1px solid var(--line)',
                          }}
                        >
                          <div className="font-display font-extrabold text-sm">
                            {preset.label}
                          </div>
                          <div className="text-[11px] opacity-75">{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Homework Priority Queue Reset */}
                <div
                  className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <div>
                    <div className="font-display font-extrabold text-base">
                      Homework Priority Queue Order
                    </div>
                    <p className="text-xs" style={{ color: 'var(--mute)' }}>
                      Restore the default priority sequence for your drag-and-drop homework cards
                    </p>
                  </div>
                  <SpringButton
                    size="sm"
                    variant="soft"
                    onClick={handleResetHomeworkQueue}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Homework Order</span>
                  </SpringButton>
                </div>
              </motion.div>
            )}

            {/* TAB 2: APPEARANCE, THEME SYNC & BRAND IDENTITY */}
            {activeTab === 'appearance' && (
              <motion.div
                key="tab-appearance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_SNAPPY}
                className="space-y-5"
              >
                {/* Seamless Browser & System Theme Synchronization */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-extrabold text-lg">
                      Seamless Browser & OS Theme Sync
                    </h3>
                    <span className="text-xs" style={{ color: 'var(--mute)' }}>
                      Syncs status bar, overscroll & color-scheme
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                  >
                    {(
                      [
                        { id: 'system', label: 'System Auto', icon: Monitor },
                        { id: 'light', label: 'Warm Cream', icon: Sun },
                        { id: 'dark', label: 'Obsidian Ink', icon: Moon },
                      ] as const
                    ).map((mode) => {
                      const Icon = mode.icon;
                      const active = themeMode === mode.id;
                      return (
                        <motion.button
                          key={mode.id}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            triggerHaptic(10);
                            playSound('option');
                            onSelectThemeMode(mode.id);
                          }}
                          className="py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
                          style={{
                            backgroundColor: active ? 'var(--yl)' : 'transparent',
                            color: active ? '#2D2D2B' : 'var(--ink)',
                          }}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{mode.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Squircle App Icon & Brand Name Switcher */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-extrabold text-lg">
                      Brand Identity & Squircle App Icon
                    </h3>
                    <span className="text-xs font-semibold" style={{ color: 'var(--mute)' }}>
                      Active: {currentBrand.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BRAND_IDENTITY_PRESETS.map((preset) => {
                      const active = preset.id === brandVariant;
                      return (
                        <BouncySurface
                          key={preset.id}
                          onClick={() => {
                            triggerHaptic(12);
                            onSelectBrandVariant(preset.id);
                            onNotify(`Switched brand identity to ${preset.name}`);
                          }}
                          style={{
                            backgroundColor: active ? 'var(--pks)' : 'var(--card)',
                            border: active ? '2px solid var(--pk)' : '1px solid var(--line)',
                          }}
                          className="rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer"
                        >
                          <BrandSquircleLogo variant={preset.id} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-display font-extrabold text-lg">
                                {preset.name}
                              </span>
                              {active && <Check className="w-4 h-4 shrink-0" />}
                            </div>
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: 'var(--mute)' }}
                            >
                              {preset.inspirationNote}
                            </p>
                          </div>
                        </BouncySurface>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: AUDIO CUES & NATIVE PWA CAPABILITIES */}
            {activeTab === 'system' && (
              <motion.div
                key="tab-system"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_SNAPPY}
                className="space-y-5"
              >
                {/* Subtle Tactile Audio Cues & Mute Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-extrabold text-lg">
                        Subtle Audio Cues & Sound Feedback
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--mute)' }}>
                        Synthesized harmonic cues for button presses, quiz grading & daily study goals
                      </p>
                    </div>

                    <SpringButton
                      size="sm"
                      variant={audioMuted ? 'card' : 'green'}
                      soundCue={false}
                      onClick={() => {
                        triggerHaptic(10);
                        const nowMuted = toggleAudioMute();
                        onNotify(
                          nowMuted
                            ? 'Interaction audio cues muted'
                            : 'Interaction audio cues enabled'
                        );
                      }}
                    >
                      {audioMuted ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span>Muted</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>Sound On</span>
                        </>
                      )}
                    </SpringButton>
                  </div>

                  <div
                    className="rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--mute)' }}>
                      Test sound cues:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {soundPreviewButtons.map((item) => (
                        <motion.button
                          key={item.cue}
                          type="button"
                          disabled={audioMuted}
                          whileHover={audioMuted ? undefined : { scale: 1.03 }}
                          whileTap={audioMuted ? undefined : { scale: 0.94 }}
                          onClick={() => playSound(item.cue)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {item.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Native Device & PWA Capabilities */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display font-extrabold text-lg">
                      Native PWA & Hardware Integration
                    </h3>
                    <PWAInstallButton
                      brandVariant={brandVariant}
                      brandName={currentBrand.name}
                      onOpenBrandStudio={() => setActiveTab('appearance')}
                      onNotify={onNotify}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <SpringButton
                      variant="card"
                      size="sm"
                      onClick={async () => {
                        const active = await toggleFocusWakeLock();
                        triggerHaptic(15);
                        onNotify(
                          active
                            ? 'Study Focus WakeLock ON: Screen will stay awake during practice'
                            : 'Study Focus WakeLock OFF'
                        );
                      }}
                      className="justify-between py-3 px-4"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Screen WakeLock</span>
                      </span>
                      <span className="font-bold">{wakeLockActive ? 'ON' : 'OFF'}</span>
                    </SpringButton>

                    <SpringButton
                      variant="card"
                      size="sm"
                      onClick={async () => {
                        triggerHaptic([12, 40, 12]);
                        const res = await shareStudyProgress(
                          `${currentBrand.name} Study Streak`,
                          `Practicing adaptive AI questions on ${currentBrand.name}!`
                        );
                        onNotify(
                          res === 'shared'
                            ? 'Shared via native OS share sheet!'
                            : 'Study link copied to clipboard!'
                        );
                      }}
                      className="justify-center py-3 px-4"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Native Share Sheet</span>
                    </SpringButton>

                    <div
                      className="rounded-full px-4 py-3 text-xs font-semibold flex items-center justify-between"
                      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                    >
                      <span>Service Worker</span>
                      <span className="font-bold">
                        {isInstalled ? 'Standalone' : swRegistered ? 'Active' : 'Ready'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

