'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Trophy,
  Plus,
  Minus,
  Check,
  Sparkles,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import { FlowerShape, StarburstShape } from './BrandMotifs';
import {
  SpringButton,
  BouncySurface,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';

const PRESET_TARGETS = [3, 5, 10, 15, 20];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function fireLearnFlowConfetti() {
  if (typeof window === 'undefined') return;
  playSoundCue('goal_reached');
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const colors = ['#FFB2DD', '#F7D66E', '#9AAB65', '#B6CAEB', '#FFFCF5'];

  // Center burst
  confetti({
    particleCount: 75,
    spread: 80,
    origin: { y: 0.62 },
    colors,
  });

  // Left & Right side cannons after 160ms
  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.08, y: 0.68 },
      colors,
    });
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.92, y: 0.68 },
      colors,
    });
  }, 160);
}

interface DailyStudyGoalCardProps {
  completedCount: number;
  targetCount: number;
  streakDays: number;
  goalCompletedToday: boolean;
  onUpdateTarget: (newTarget: number) => void;
  onIncrementCompleted: () => void;
  onResetTodayProgress: () => void;
  onStartPractice: () => void;
}

export function DailyStudyGoalCard({
  completedCount,
  targetCount,
  streakDays,
  goalCompletedToday,
  onUpdateTarget,
  onIncrementCompleted,
  onResetTodayProgress,
  onStartPractice,
}: DailyStudyGoalCardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const progressRatio = Math.min(1, targetCount > 0 ? completedCount / targetCount : 0);
  const progressPercent = Math.round(progressRatio * 100);
  const remaining = Math.max(0, targetCount - completedCount);

  return (
    <div
      className="rounded-[28px] p-5 sm:p-7 relative overflow-hidden"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--line)',
      }}
    >
      {/* Subtle decorative corner motif */}
      {goalCompletedToday ? (
        <StarburstShape
          className="w-28 h-28 absolute -right-6 -top-6 opacity-35"
          color="var(--yl)"
        />
      ) : (
        <FlowerShape
          className="w-28 h-28 absolute -right-6 -top-6 opacity-25"
          color="var(--pk)"
        />
      )}

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Visual Conic Progress Ring + Goal Status (5 cols) */}
        <div className="lg:col-span-5 flex items-center gap-5">
          {/* Animated Conic Progress Ring */}
          <motion.div
            key={`${completedCount}-${targetCount}-${goalCompletedToday}`}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={SPRING_BOUNCY}
            onClick={() => {
              if (goalCompletedToday) {
                fireLearnFlowConfetti();
              } else {
                onIncrementCompleted();
              }
            }}
            title={
              goalCompletedToday
                ? 'Click to celebrate your daily goal!'
                : 'Click to log +1 completed practice question'
            }
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full grid place-items-center shrink-0 cursor-pointer select-none shadow-sm"
            style={{
              background: `conic-gradient(${
                goalCompletedToday ? 'var(--gr)' : 'var(--pk)'
              } ${progressPercent}%, var(--line) 0)`,
            }}
          >
            <div
              className="w-[86px] h-[86px] sm:w-[98px] sm:h-[98px] rounded-full flex flex-col items-center justify-center text-center px-2"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
            >
              <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight tabular-nums leading-none">
                {completedCount}
                <span className="text-base sm:text-lg opacity-55">/{targetCount}</span>
              </span>
              <span
                className="text-[11px] font-bold mt-1 tabular-nums"
                style={{ color: goalCompletedToday ? 'var(--gr)' : 'var(--mute)' }}
              >
                {goalCompletedToday ? 'Goal Met!' : `${progressPercent}% done`}
              </span>
            </div>
          </motion.div>

          {/* Goal Headline & Streak */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--mute)' }}>
              <Flame
                className="w-4 h-4 shrink-0"
                style={{ color: goalCompletedToday ? 'var(--pk)' : 'var(--ink)' }}
              />
              <span className="tabular-nums" style={{ color: 'var(--ink)' }}>
                {streakDays}-day streak
              </span>
              <span aria-hidden="true">·</span>
              <span>Daily study goal</span>
            </div>

            <h3 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              {goalCompletedToday
                ? 'Daily goal crushed!'
                : `${remaining} more question${remaining === 1 ? '' : 's'} to hit today’s goal`}
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
              {goalCompletedToday
                ? `You completed ${completedCount} of ${targetCount} target questions today and extended your ${streakDays}-day streak.`
                : 'Complete questions in AI Practice or log quick drills to keep your streak alive.'}
            </p>
          </div>
        </div>

        {/* Middle: 7-Day Weekly Streak Visualizer & Target Customization (4 cols) */}
        <div
          className="lg:col-span-4 rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span style={{ color: 'var(--mute)' }}>This week’s momentum</span>
            <button
              type="button"
              onClick={() => setIsEditingGoal((v) => !v)}
              className="underline cursor-pointer font-bold flex items-center gap-1"
              style={{ color: 'var(--ink)' }}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isEditingGoal ? 'Done' : `Target: ${targetCount}/day`}</span>
            </button>
          </div>

          {/* 7-Day Streak Row */}
          <div className="grid grid-cols-7 gap-1.5 pt-0.5">
            {WEEK_DAYS.map((day, idx) => {
              const isPastCompleted = idx < 6;
              const isToday = idx === 6;
              const isDone = isPastCompleted || (isToday && goalCompletedToday);

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={
                      isToday && goalCompletedToday
                        ? { scale: [1, 1.18, 1] }
                        : { scale: 1 }
                    }
                    transition={SPRING_BOUNCY}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold"
                    style={{
                      backgroundColor: isDone
                        ? isToday
                          ? 'var(--gr)'
                          : 'var(--pk)'
                        : 'var(--card)',
                      color: isDone ? '#2D2D2B' : 'var(--mute)',
                      border: isToday ? '2px solid var(--ink)' : '1px solid var(--line)',
                    }}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
                  </motion.div>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isToday ? 'var(--ink)' : 'var(--mute)' }}
                  >
                    {isToday ? 'Today' : day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Expandable Daily Goal Target Selector */}
          <AnimatePresence>
            {isEditingGoal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING_SNAPPY}
                className="pt-2 border-t space-y-2.5 overflow-hidden"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--mute)' }}>
                    Questions per day:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onUpdateTarget(Math.max(1, targetCount - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                      aria-label="Decrease daily target"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </motion.button>
                    <span className="font-display font-extrabold text-sm px-2 tabular-nums">
                      {targetCount}
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onUpdateTarget(Math.min(50, targetCount + 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                      aria-label="Increase daily target"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>

                {/* Preset Target Pills */}
                <div className="flex items-center gap-1.5">
                  {PRESET_TARGETS.map((preset) => {
                    const active = targetCount === preset;
                    return (
                      <motion.button
                        key={preset}
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => onUpdateTarget(preset)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer tabular-nums"
                        style={{
                          backgroundColor: active ? 'var(--yl)' : 'var(--card)',
                          color: active ? '#2D2D2B' : 'var(--ink)',
                        }}
                      >
                        {preset}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Quick Actions (Practice, Log +1, Celebrate / Reset) (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2.5">
          <SpringButton
            variant="pink"
            magnetic
            onClick={onStartPractice}
            className="w-full justify-center py-3.5"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Practice next question</span>
          </SpringButton>

          <div className="flex items-center gap-2">
            <SpringButton
              variant={goalCompletedToday ? 'yellow' : 'blue'}
              size="sm"
              onClick={() => {
                if (goalCompletedToday) {
                  fireLearnFlowConfetti();
                } else {
                  onIncrementCompleted();
                }
              }}
              className="flex-1 justify-center py-2.5"
            >
              {goalCompletedToday ? (
                <>
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Celebrate!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log +1 done</span>
                </>
              )}
            </SpringButton>

            {completedCount > 0 && (
              <SpringButton
                variant="soft"
                size="sm"
                onClick={onResetTodayProgress}
                title="Reset today's counter"
                aria-label="Reset today's counter"
                className="px-3 py-2.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </SpringButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
