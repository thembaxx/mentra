"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Flame,
  Trophy,
  Plus,
  Minus,
  Check,
  Play,
  RotateCcw,
  Target,
  BarChart3,
  Activity,
} from "lucide-react";
import { FlowerShape, StarburstShape } from "./BrandMotifs";
import { SpringButton, SPRING_SNAPPY, SPRING_BOUNCY } from "./PhysicsUI";
import { DirectInspiredTooltipCard } from "./WeeklyActivityReport";
import { playSoundCue } from "@/lib/sound-effects";

const PRESET_TARGETS = [3, 5, 10, 15, 20];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function fireLearnFlowConfetti() {
  if (typeof window === "undefined") return;
  playSoundCue("goal_reached");
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const colors = ["#FFB2DD", "#F7D66E", "#9AAB65", "#B6CAEB", "#FFFCF5"];

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
  onOpenActivityReport?: () => void;
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
  onOpenActivityReport,
}: DailyStudyGoalCardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const progressRatio = Math.min(1, targetCount > 0 ? completedCount / targetCount : 0);
  const progressPercent = Math.round(progressRatio * 100);
  const remaining = Math.max(0, targetCount - completedCount);

  const miniTrendData = useMemo(() => {
    const todayRuntime = Math.max(10, completedCount * 4 + 2);
    const todayBestPractices = Math.max(4, completedCount * 2);
    const todayVerification = Math.max(3, completedCount * 2 - 1);
    const todayOther = Math.max(18, completedCount * 7 + 4);

    return [
      {
        day: "Mon",
        dateLabel: "Oct 13, 2026",
        runtime: 12,
        bestPractices: 8,
        verification: 5,
        other: 27,
        totalUses: 52,
      },
      {
        day: "Tue",
        dateLabel: "Oct 14, 2026",
        runtime: 15,
        bestPractices: 7,
        verification: 6,
        other: 31,
        totalUses: 59,
      },
      {
        day: "Wed",
        dateLabel: "Oct 15, 2026",
        runtime: 14,
        bestPractices: 6,
        verification: 5,
        other: 33,
        totalUses: 58,
      },
      {
        day: "Thu",
        dateLabel: "Oct 16, 2026",
        runtime: 18,
        bestPractices: 9,
        verification: 7,
        other: 34,
        totalUses: 68,
      },
      {
        day: "Fri",
        dateLabel: "Oct 17, 2026",
        runtime: 16,
        bestPractices: 8,
        verification: 6,
        other: 29,
        totalUses: 59,
      },
      {
        day: "Sat",
        dateLabel: "Oct 18, 2026",
        runtime: 21,
        bestPractices: 11,
        verification: 8,
        other: 38,
        totalUses: 78,
      },
      {
        day: "Today",
        dateLabel: "Oct 19, 2026",
        runtime: todayRuntime,
        bestPractices: todayBestPractices,
        verification: todayVerification,
        other: todayOther,
        totalUses: todayRuntime + todayBestPractices + todayVerification + todayOther,
      },
    ];
  }, [completedCount]);

  return (
    <div
      className="rounded-[28px] p-5 sm:p-7 relative overflow-hidden space-y-6 transition-colors"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--line)",
      }}
    >
      {/* Subtle decorative corner motif */}
      {goalCompletedToday ? (
        <StarburstShape
          className="w-28 h-28 absolute -right-6 -top-6 opacity-35"
          color="var(--yl)"
        />
      ) : (
        <FlowerShape className="w-28 h-28 absolute -right-6 -top-6 opacity-25" color="var(--pk)" />
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
                ? "Click to celebrate your daily goal!"
                : "Click to log +1 completed practice question"
            }
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full grid place-items-center shrink-0 cursor-pointer select-none shadow-sm"
            style={{
              background: `conic-gradient(${
                goalCompletedToday ? "var(--gr)" : "var(--pk)"
              } ${progressPercent}%, var(--line) 0)`,
            }}
          >
            <div
              className="w-[86px] h-[86px] sm:w-[98px] sm:h-[98px] rounded-full flex flex-col items-center justify-center text-center px-2"
              style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
            >
              <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight tabular-nums leading-none">
                {completedCount}
                <span className="text-base sm:text-lg opacity-55">/{targetCount}</span>
              </span>
              <span
                className="text-[11px] font-bold mt-1 tabular-nums"
                style={{ color: goalCompletedToday ? "var(--gr)" : "var(--mute)" }}
              >
                {goalCompletedToday ? "Goal Met!" : `${progressPercent}% done`}
              </span>
            </div>
          </motion.div>

          {/* Goal Headline & Streak */}
          <div className="space-y-2">
            <div
              className="flex items-center gap-2 text-xs font-bold"
              style={{ color: "var(--mute)" }}
            >
              <Flame
                className="w-4 h-4 shrink-0"
                style={{ color: goalCompletedToday ? "var(--pk)" : "var(--ink)" }}
              />
              <span className="tabular-nums" style={{ color: "var(--ink)" }}>
                {streakDays}-day streak
              </span>
              <span aria-hidden="true">·</span>
              <span>Daily study goal</span>
            </div>

            <h3 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              {goalCompletedToday
                ? "Daily goal crushed!"
                : `${remaining} more question${remaining === 1 ? "" : "s"} to hit today’s goal`}
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--mute)" }}>
              {goalCompletedToday
                ? `You completed ${completedCount} of ${targetCount} target questions today and extended your ${streakDays}-day streak.`
                : "Complete questions in AI Practice or log quick drills to keep your streak alive."}
            </p>
          </div>
        </div>

        {/* Middle: 7-Day Weekly Streak Visualizer & Target Customization (4 cols) */}
        <div
          className="lg:col-span-4 rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: "var(--bg)", border: "1px solid var(--line)" }}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span style={{ color: "var(--mute)" }}>This week’s momentum</span>
            <button
              type="button"
              onClick={() => setIsEditingGoal((v) => !v)}
              className="underline cursor-pointer font-bold flex items-center gap-1"
              style={{ color: "var(--ink)" }}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isEditingGoal ? "Done" : `Target: ${targetCount}/day`}</span>
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
                    animate={isToday && goalCompletedToday ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={SPRING_BOUNCY}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold"
                    style={{
                      backgroundColor: isDone
                        ? isToday
                          ? "var(--gr)"
                          : "var(--pk)"
                        : "var(--card)",
                      color: isDone ? "#2D2D2B" : "var(--mute)",
                      border: isToday ? "2px solid var(--ink)" : "1px solid var(--line)",
                    }}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
                  </motion.div>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isToday ? "var(--ink)" : "var(--mute)" }}
                  >
                    {isToday ? "Today" : day}
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
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING_SNAPPY}
                className="pt-2 border-t space-y-2.5 overflow-hidden"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "var(--mute)" }}>
                    Questions per day:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onUpdateTarget(Math.max(1, targetCount - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: "var(--card)", color: "var(--ink)" }}
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
                      style={{ backgroundColor: "var(--card)", color: "var(--ink)" }}
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
                          backgroundColor: active ? "var(--yl)" : "var(--card)",
                          color: active ? "#2D2D2B" : "var(--ink)",
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
              variant={goalCompletedToday ? "yellow" : "blue"}
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

          {onOpenActivityReport && (
            <SpringButton
              variant="card"
              size="sm"
              onClick={onOpenActivityReport}
              className="w-full justify-center py-2.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>View Weekly Activity Report</span>
            </SpringButton>
          )}
        </div>
      </div>

      {/* Interactive Theme-Aware Multi-Series Chart Strip with Direct-Inspired Tooltip */}
      <div
        className="relative z-10 rounded-2xl p-4 sm:p-5 space-y-3 transition-colors"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" style={{ color: "var(--series-blue)" }} />
            <span className="text-sm font-display font-extrabold">Weekly Skill Telemetry</span>
            <span aria-hidden="true" style={{ color: "var(--mute)" }}>
              ·
            </span>
            <span className="text-xs" style={{ color: "var(--mute)" }}>
              Hover any day for detailed breakdown
            </span>
          </div>

          {/* Series Legend (Clean unboxed inline metadata with colored dots) */}
          <div
            className="flex flex-wrap items-center gap-4 text-xs"
            style={{ color: "var(--mute)" }}
          >
            {[
              { label: "Runtime", color: "var(--series-blue)" },
              { label: "STEM Best Practices", color: "var(--series-orange)" },
              { label: "Verification", color: "var(--series-green)" },
              { label: "Other", color: "var(--series-pink)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[185px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniTrendData} margin={{ top: 8, right: 14, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--mute)", fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--mute)", fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{
                    stroke: "var(--chart-cursor)",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 4",
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0].payload;
                    return (
                      <DirectInspiredTooltipCard
                        headline={`${pt.totalUses} uses`}
                        dateLabel={pt.dateLabel}
                        rows={[
                          {
                            label: "Runtime",
                            value: pt.runtime,
                            color: "var(--series-blue)",
                          },
                          {
                            label: "STEM Best Practices",
                            value: pt.bestPractices,
                            color: "var(--series-orange)",
                          },
                          {
                            label: "Verification",
                            value: pt.verification,
                            color: "var(--series-green)",
                          },
                          {
                            label: "Other",
                            value: pt.other,
                            color: "var(--series-pink)",
                          },
                        ]}
                      />
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="runtime"
                  name="Runtime"
                  stroke="var(--series-blue)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    fill: "var(--series-blue)",
                    stroke: "var(--bg)",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: "var(--series-blue)",
                    stroke: "var(--tooltip-bg)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive
                  animationDuration={650}
                />
                <Line
                  type="monotone"
                  dataKey="bestPractices"
                  name="STEM Best Practices"
                  stroke="var(--series-orange)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    fill: "var(--series-orange)",
                    stroke: "var(--bg)",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: "var(--series-orange)",
                    stroke: "var(--tooltip-bg)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive
                  animationDuration={720}
                />
                <Line
                  type="monotone"
                  dataKey="verification"
                  name="Verification"
                  stroke="var(--series-green)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    fill: "var(--series-green)",
                    stroke: "var(--bg)",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: "var(--series-green)",
                    stroke: "var(--tooltip-bg)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive
                  animationDuration={780}
                />
                <Line
                  type="monotone"
                  dataKey="other"
                  name="Other"
                  stroke="var(--series-pink)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    fill: "var(--series-pink)",
                    stroke: "var(--bg)",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: "var(--series-pink)",
                    stroke: "var(--tooltip-bg)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive
                  animationDuration={840}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-xl animate-pulse bg-black/5" />
          )}
        </div>
      </div>
    </div>
  );
}
