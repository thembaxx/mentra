'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Check,
  SkipForward,
} from 'lucide-react';
import {
  SpringButton,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_GENTLE,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';
import { fireLearnFlowConfetti } from './DailyStudyGoalCard';
import { useNativeCapabilities } from '@/hooks/usePWAInstall';

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

interface PhaseConfig {
  id: PomodoroPhase;
  label: string;
  defaultMinutes: number;
  colorVar: '--pk' | '--gr' | '--bl';
  badgeText: string;
}

const PHASE_CONFIGS: Record<PomodoroPhase, PhaseConfig> = {
  focus: {
    id: 'focus',
    label: 'Focus Sprint',
    defaultMinutes: 25,
    colorVar: '--pk',
    badgeText: 'Deep Practice Interval',
  },
  short_break: {
    id: 'short_break',
    label: 'Short Break',
    defaultMinutes: 5,
    colorVar: '--gr',
    badgeText: 'Quick Mind Reset',
  },
  long_break: {
    id: 'long_break',
    label: 'Long Break',
    defaultMinutes: 15,
    colorVar: '--bl',
    badgeText: 'Full Recharge',
  },
};

const FOCUS_PRESETS = [15, 25, 45];

interface PomodoroFocusTimerProps {
  activeTrackLabel: string;
  onNotify: (msg: string) => void;
  onSprintCompleted?: () => void;
}

export function PomodoroFocusTimer({
  activeTrackLabel,
  onNotify,
  onSprintCompleted,
}: PomodoroFocusTimerProps) {
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [customMinutes, setCustomMinutes] = useState<Record<PomodoroPhase, number>>({
    focus: 25,
    short_break: 5,
    long_break: 15,
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSprints, setCompletedSprints] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const { wakeLockActive, toggleFocusWakeLock, triggerHaptic } = useNativeCapabilities();

  const totalPhaseSeconds = customMinutes[phase] * 60;
  const elapsedSeconds = Math.max(0, totalPhaseSeconds - secondsLeft);
  const progressPct =
    totalPhaseSeconds > 0
      ? Math.min(100, Math.round((elapsedSeconds / totalPhaseSeconds) * 100))
      : 0;

  const currentPhaseConfig = PHASE_CONFIGS[phase];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const switchPhase = useCallback(
    (nextPhase: PomodoroPhase, autoStart = false) => {
      setPhase(nextPhase);
      setSecondsLeft(customMinutes[nextPhase] * 60);
      setIsRunning(autoStart);
    },
    [customMinutes]
  );

  // Handle interval countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle timer reaching 00:00
  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;

    setIsRunning(false);
    triggerHaptic([20, 50, 20]);

    if (phase === 'focus') {
      const nextCount = completedSprints + 1;
      setCompletedSprints(nextCount);
      fireLearnFlowConfetti();
      onSprintCompleted?.();
      const nextBreak: PomodoroPhase =
        nextCount % 4 === 0 ? 'long_break' : 'short_break';
      onNotify(
        `Focus sprint #${nextCount} complete! Time for a ${
          nextBreak === 'long_break' ? '15-min long' : '5-min short'
        } break.`
      );
      switchPhase(nextBreak, false);
    } else {
      playSoundCue('step_reveal');
      onNotify('Break finished! Ready for your next Focus Sprint.');
      switchPhase('focus', false);
    }
  }, [
    secondsLeft,
    isRunning,
    phase,
    completedSprints,
    onNotify,
    onSprintCompleted,
    switchPhase,
    triggerHaptic,
  ]);

  const handleToggleRun = () => {
    triggerHaptic(12);
    playSoundCue('tap');
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    triggerHaptic(10);
    playSoundCue('option');
    setIsRunning(false);
    setSecondsLeft(customMinutes[phase] * 60);
  };

  const handleSkipPhase = () => {
    triggerHaptic(10);
    playSoundCue('option');
    if (phase === 'focus') {
      switchPhase('short_break', false);
      onNotify('Skipped to Short Break');
    } else {
      switchPhase('focus', false);
      onNotify('Returned to Focus Sprint');
    }
  };

  const handleAdjustMinutes = (newMins: number) => {
    const clamped = Math.max(1, Math.min(90, newMins));
    playSoundCue('option');
    setCustomMinutes((prev) => ({ ...prev, [phase]: clamped }));
    setIsRunning(false);
    setSecondsLeft(clamped * 60);
  };

  return (
    <motion.div
      layout
      transition={SPRING_GENTLE}
      className="rounded-3xl p-4 sm:px-5 transition-colors overflow-hidden"
      style={{
        backgroundColor: 'var(--card)',
        border: isRunning ? `2px solid var(${currentPhaseConfig.colorVar})` : '1px solid var(--line)',
      }}
    >
      {/* Top Compact Bar: Always Visible During Practice */}
      <motion.div
        layout="position"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        {/* Left: Conic Ring + Countdown + Phase Status */}
        <div className="flex items-center gap-3.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleRun}
            title={isRunning ? 'Pause Pomodoro timer' : 'Start Pomodoro timer'}
            className="relative w-12 h-12 rounded-full grid place-items-center shrink-0 cursor-pointer"
            style={{
              background: `conic-gradient(var(${currentPhaseConfig.colorVar}) ${progressPct}%, var(--line) 0)`,
            }}
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
            >
              {isRunning ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </span>
          </motion.button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight tabular-nums leading-none">
                {formatTime(secondsLeft)}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold"
                style={{
                  backgroundColor: `var(${currentPhaseConfig.colorVar})`,
                  color: '#2D2D2B',
                }}
              >
                {currentPhaseConfig.label}
              </span>
              {isRunning && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: `var(${currentPhaseConfig.colorVar})` }}
                />
              )}
            </div>

            <div
              className="text-xs font-semibold flex items-center gap-2 mt-0.5"
              style={{ color: 'var(--mute)' }}
            >
              <span>{activeTrackLabel} Focus Timer</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Sprint #{completedSprints}</span>
            </div>
          </div>
        </div>

        {/* Middle: Phase Switcher Pills (Desktop/Tablet) */}
        <div
          className="hidden md:inline-flex items-center p-1 rounded-full"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
          role="tablist"
          aria-label="Pomodoro interval mode"
        >
          {(['focus', 'short_break', 'long_break'] as PomodoroPhase[]).map((pId) => {
            const cfg = PHASE_CONFIGS[pId];
            const active = phase === pId;
            return (
              <button
                key={pId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  playSoundCue('option');
                  switchPhase(pId, false);
                }}
                className="relative px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap"
                style={{ color: active ? '#2D2D2B' : 'var(--mute)' }}
              >
                {active && (
                  <motion.span
                    layoutId="pomodoroPhasePill"
                    transition={SPRING_BOUNCY}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: `var(${cfg.colorVar})` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {pId === 'focus' ? (
                    <Flame className="w-3.5 h-3.5" />
                  ) : (
                    <Coffee className="w-3.5 h-3.5" />
                  )}
                  <span>{cfg.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Action Controls & Expand Toggle */}
        <div className="flex items-center gap-2">
          <SpringButton
            size="sm"
            variant={isRunning ? 'yellow' : 'pink'}
            soundCue={false}
            onClick={handleToggleRun}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{secondsLeft < totalPhaseSeconds ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </SpringButton>

          <button
            type="button"
            onClick={handleResetTimer}
            title="Reset current interval"
            aria-label="Reset current interval"
            className="p-2 rounded-full cursor-pointer"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              playSoundCue('tap');
              setIsExpanded((v) => !v);
            }}
            aria-expanded={isExpanded}
            aria-label="Customize Pomodoro timer intervals"
            className="px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            <span className="hidden sm:inline">Intervals</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Expandable Pomodoro Interval Customizer & 4-Sprint Cycle Tracker */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_SNAPPY}
            className="overflow-hidden"
          >
            <div
              className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              style={{ borderColor: 'var(--line)' }}
            >
              {/* Mobile Phase Switcher + Duration Presets (5 cols) */}
              <div className="md:col-span-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span style={{ color: 'var(--mute)' }}>
                    {currentPhaseConfig.label} duration (minutes):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustMinutes(customMinutes[phase] - 5)}
                      className="w-7 h-7 rounded-lg grid place-items-center cursor-pointer"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
                      aria-label="Decrease interval by 5 minutes"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-display font-extrabold text-sm px-2 tabular-nums">
                      {customMinutes[phase]}m
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustMinutes(customMinutes[phase] + 5)}
                      className="w-7 h-7 rounded-lg grid place-items-center cursor-pointer"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
                      aria-label="Increase interval by 5 minutes"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {FOCUS_PRESETS.map((mins) => {
                    const isPresetActive =
                      phase === 'focus' && customMinutes.focus === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setPhase('focus');
                          setCustomMinutes((prev) => ({ ...prev, focus: mins }));
                          setIsRunning(false);
                          setSecondsLeft(mins * 60);
                          playSoundCue('option');
                        }}
                        className="flex-1 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer tabular-nums"
                        style={{
                          backgroundColor: isPresetActive ? 'var(--pk)' : 'var(--bg)',
                          color: isPresetActive ? '#2D2D2B' : 'var(--ink)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        {mins}m Focus
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => switchPhase('short_break', false)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                    style={{
                      backgroundColor: phase === 'short_break' ? 'var(--gr)' : 'var(--bg)',
                      color: phase === 'short_break' ? '#2D2D2B' : 'var(--ink)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    5m Break
                  </button>
                </div>
              </div>

              {/* 4-Sprint Pomodoro Cycle Progress (4 cols) */}
              <div
                className="md:col-span-4 rounded-2xl p-3 flex items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
              >
                <div>
                  <div className="text-xs font-extrabold">4-Sprint Cycle</div>
                  <div className="text-[11px]" style={{ color: 'var(--mute)' }}>
                    Long break every 4 sprints
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((slot) => {
                    const cyclePos = ((completedSprints - 1) % 4) + 1;
                    const done = slot <= cyclePos;
                    return (
                      <span
                        key={slot}
                        className="w-7 h-7 rounded-xl grid place-items-center text-xs font-extrabold"
                        style={{
                          backgroundColor: done ? 'var(--gr)' : 'var(--card)',
                          color: done ? '#2D2D2B' : 'var(--mute)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        {done ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : slot}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Screen WakeLock & Skip Phase Controls (3 cols) */}
              <div className="md:col-span-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const active = await toggleFocusWakeLock();
                    playSoundCue('tap');
                    onNotify(
                      active
                        ? 'Screen WakeLock ON: Display stays awake during Pomodoro sprint'
                        : 'Screen WakeLock OFF'
                    );
                  }}
                  className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: wakeLockActive ? 'var(--yl)' : 'var(--bg)',
                    color: wakeLockActive ? '#2D2D2B' : 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>WakeLock {wakeLockActive ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipPhase}
                  title="Skip to next interval phase"
                  aria-label="Skip to next interval phase"
                  className="p-2.5 rounded-2xl cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
