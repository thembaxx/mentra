'use client';

import React, { useState } from 'react';
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

export type ThemeMode = 'system' | 'light' | 'dark';

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
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
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
  onNotify,
}: {
  open: boolean;
  onClose: () => void;
  brandVariant: BrandLogoVariant;
  onSelectBrandVariant: (v: BrandLogoVariant) => void;
  themeMode: ThemeMode;
  onSelectThemeMode: (m: ThemeMode) => void;
  onNotify: (msg: string) => void;
}) {
  const { swRegistered, isInstalled } = usePWAInstall();
  const {
    triggerHaptic,
    shareStudyProgress,
    wakeLockActive,
    toggleFocusWakeLock,
  } = useNativeCapabilities();
  const { muted: audioMuted, toggleMute: toggleAudioMute, playSound } = useSoundSettings();

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
                    Brand, Audio & Native PWA Settings
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
                    Squircle icons, tactile audio cues, theme sync & native capabilities
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

            {/* 1. Interactive Squircle App Icon & Brand Name Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-lg">
                  1. Choose Brand Name & Squircle Icon Style
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
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--mute)' }}>
                          {preset.inspirationNote}
                        </p>
                      </div>
                    </BouncySurface>
                  );
                })}
              </div>
            </div>

            {/* 2. Subtle Tactile Audio Cues & Mute Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-lg">
                    2. Subtle Audio Cues & Sound Feedback
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

            {/* 3. Seamless Browser & System Theme Synchronization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-lg">
                  3. Seamless Browser & OS Theme Sync
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
                    { id: 'system', label: 'System Auto', icon: Monitor, colorHex: 'Auto' },
                    { id: 'light', label: 'Warm Cream', icon: Sun, colorHex: '#FFFCF5' },
                    { id: 'dark', label: 'Obsidian Ink', icon: Moon, colorHex: '#1C1C1A' },
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

            {/* 4. Native Device & PWA Capabilities */}
            <div className="space-y-3">
              <h3 className="font-display font-extrabold text-lg">
                4. Native PWA & Hardware Integration
              </h3>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
