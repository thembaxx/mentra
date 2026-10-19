'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowUpRight,
  Activity,
  BarChart2,
} from 'lucide-react';
import { TrackId } from '@/lib/study-data';
import { FlowerShape, StarburstShape, SquiggleBoltShape } from './BrandMotifs';
import {
  BouncySurface,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';

type ReportRange = 'this_week' | 'last_week' | 'month';
type ChartVisualMode = 'lines' | 'bars';

export interface TooltipSeriesRow {
  label: string;
  value: string | number;
  color: string;
}

export interface DirectInspiredTooltipProps {
  headline: string;
  dateLabel: string;
  rows: TooltipSeriesRow[];
}

/**
 * Direct-inspiration theme-aware chart tooltip card:
 * - Bold summary headline at the top (e.g., "58 uses" / "68 mins")
 * - Muted calendar date subtitle below (e.g., "Oct 15, 2026")
 * - Crisp 1px horizontal divider
 * - Clean vertical list of series rows with 12px colored circles, muted label left, and tabular value right
 */
export function DirectInspiredTooltipCard({
  headline,
  dateLabel,
  rows,
}: DirectInspiredTooltipProps) {
  return (
    <div
      className="rounded-[22px] p-4 sm:p-5 min-w-[248px] sm:min-w-[272px] select-none transition-colors"
      style={{
        backgroundColor: 'var(--tooltip-bg)',
        border: '1px solid var(--tooltip-border)',
        boxShadow: 'var(--tooltip-shadow)',
        color: 'var(--ink)',
      }}
    >
      <div
        className="text-[18px] font-semibold tracking-tight leading-snug tabular-nums"
        style={{ color: 'var(--ink)' }}
      >
        {headline}
      </div>
      <div
        className="text-[15px] font-normal leading-snug mt-0.5"
        style={{ color: 'var(--mute)' }}
      >
        {dateLabel}
      </div>

      <div
        className="my-3 h-px w-full"
        style={{ backgroundColor: 'var(--tooltip-border)' }}
      />

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-6 text-[15px] leading-snug"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: row.color }}
              />
              <span
                className="truncate font-normal"
                style={{ color: 'var(--mute)' }}
              >
                {row.label}
              </span>
            </div>
            <span
              className="font-medium tabular-nums shrink-0"
              style={{ color: 'var(--ink)' }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ActivityDayPoint {
  day: string;
  dateLabel: string;
  codeMins: number;
  examMins: number;
  langMins: number;
  reviewMins: number;
  totalMins: number;
  questionsAnswered: number;
  dailyTarget: number;
  streakDay: number;
  accuracyPct: number;
  // Granular question/use counts per category
  runtimeUses: number;
  stemDrills: number;
  verificationChecks: number;
  otherPractice: number;
  totalUses: number;
}

interface WeeklyActivityReportProps {
  dailyCompleted: number;
  dailyTarget: number;
  streakDays: number;
  onStartTrackPractice: (track: TrackId, topic?: string) => void;
  onNotify: (msg: string) => void;
}

export function WeeklyActivityReport({
  dailyCompleted,
  dailyTarget,
  streakDays,
  onStartTrackPractice,
  onNotify,
}: WeeklyActivityReportProps) {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<ReportRange>('this_week');
  const [metricFocus, setMetricFocus] = useState<'all' | 'code' | 'exam' | 'lang' | 'review'>('all');
  const [visualMode, setVisualMode] = useState<ChartVisualMode>('lines');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build reactive dataset synchronized with the user's live Today progress and streak
  const chartData = useMemo<ActivityDayPoint[]>(() => {
    const baseStartStreak = Math.max(1, streakDays - 6);
    const todayQuestions = Math.max(0, dailyCompleted);
    const todayCodeMins = Math.max(12, todayQuestions * 5);
    const todayExamMins = Math.max(9, todayQuestions * 4);
    const todayLangMins = Math.max(7, todayQuestions * 3);
    const todayReviewMins = Math.max(18, todayQuestions * 6);

    if (range === 'last_week') {
      return [
        {
          day: 'Mon',
          dateLabel: 'Oct 5, 2026',
          codeMins: 16,
          examMins: 12,
          langMins: 8,
          reviewMins: 22,
          totalMins: 58,
          questionsAnswered: 5,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 7),
          accuracyPct: 82,
          runtimeUses: 12,
          stemDrills: 8,
          verificationChecks: 6,
          otherPractice: 24,
          totalUses: 50,
        },
        {
          day: 'Tue',
          dateLabel: 'Oct 6, 2026',
          codeMins: 19,
          examMins: 15,
          langMins: 10,
          reviewMins: 20,
          totalMins: 64,
          questionsAnswered: 6,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 6),
          accuracyPct: 85,
          runtimeUses: 15,
          stemDrills: 9,
          verificationChecks: 7,
          otherPractice: 26,
          totalUses: 57,
        },
        {
          day: 'Wed',
          dateLabel: 'Oct 7, 2026',
          codeMins: 22,
          examMins: 11,
          langMins: 9,
          reviewMins: 18,
          totalMins: 60,
          questionsAnswered: 5,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 5),
          accuracyPct: 84,
          runtimeUses: 14,
          stemDrills: 7,
          verificationChecks: 5,
          otherPractice: 28,
          totalUses: 54,
        },
        {
          day: 'Thu',
          dateLabel: 'Oct 8, 2026',
          codeMins: 20,
          examMins: 16,
          langMins: 11,
          reviewMins: 25,
          totalMins: 72,
          questionsAnswered: 7,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 4),
          accuracyPct: 88,
          runtimeUses: 16,
          stemDrills: 10,
          verificationChecks: 8,
          otherPractice: 31,
          totalUses: 65,
        },
        {
          day: 'Fri',
          dateLabel: 'Oct 9, 2026',
          codeMins: 15,
          examMins: 14,
          langMins: 9,
          reviewMins: 19,
          totalMins: 57,
          questionsAnswered: 5,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 3),
          accuracyPct: 86,
          runtimeUses: 11,
          stemDrills: 8,
          verificationChecks: 6,
          otherPractice: 23,
          totalUses: 48,
        },
        {
          day: 'Sat',
          dateLabel: 'Oct 10, 2026',
          codeMins: 26,
          examMins: 20,
          langMins: 14,
          reviewMins: 29,
          totalMins: 89,
          questionsAnswered: 9,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 2),
          accuracyPct: 91,
          runtimeUses: 19,
          stemDrills: 12,
          verificationChecks: 9,
          otherPractice: 36,
          totalUses: 76,
        },
        {
          day: 'Sun',
          dateLabel: 'Oct 11, 2026',
          codeMins: 21,
          examMins: 17,
          langMins: 11,
          reviewMins: 24,
          totalMins: 73,
          questionsAnswered: 7,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 1),
          accuracyPct: 89,
          runtimeUses: 15,
          stemDrills: 10,
          verificationChecks: 7,
          otherPractice: 30,
          totalUses: 62,
        },
      ];
    }

    if (range === 'month') {
      return [
        {
          day: 'Wk 1',
          dateLabel: 'Sep 28 – Oct 4, 2026',
          codeMins: 92,
          examMins: 78,
          langMins: 52,
          reviewMins: 115,
          totalMins: 337,
          questionsAnswered: 28,
          dailyTarget: dailyTarget * 7,
          streakDay: Math.max(1, streakDays - 21),
          accuracyPct: 81,
          runtimeUses: 64,
          stemDrills: 42,
          verificationChecks: 31,
          otherPractice: 118,
          totalUses: 255,
        },
        {
          day: 'Wk 2',
          dateLabel: 'Oct 5 – Oct 11, 2026',
          codeMins: 112,
          examMins: 88,
          langMins: 64,
          reviewMins: 132,
          totalMins: 396,
          questionsAnswered: 35,
          dailyTarget: dailyTarget * 7,
          streakDay: Math.max(1, streakDays - 14),
          accuracyPct: 86,
          runtimeUses: 78,
          stemDrills: 51,
          verificationChecks: 38,
          otherPractice: 142,
          totalUses: 309,
        },
        {
          day: 'Wk 3',
          dateLabel: 'Oct 12 – Oct 18, 2026',
          codeMins: 128,
          examMins: 96,
          langMins: 72,
          reviewMins: 148,
          totalMins: 444,
          questionsAnswered: 42,
          dailyTarget: dailyTarget * 7,
          streakDay: Math.max(1, streakDays - 7),
          accuracyPct: 90,
          runtimeUses: 89,
          stemDrills: 58,
          verificationChecks: 44,
          otherPractice: 164,
          totalUses: 355,
        },
        {
          day: 'This Wk',
          dateLabel: 'Oct 19, 2026',
          codeMins: 124 + todayCodeMins,
          examMins: 94 + todayExamMins,
          langMins: 70 + todayLangMins,
          reviewMins: 140 + todayReviewMins,
          totalMins:
            428 + todayCodeMins + todayExamMins + todayLangMins + todayReviewMins,
          questionsAnswered: 39 + todayQuestions,
          dailyTarget: dailyTarget * 7,
          streakDay: streakDays,
          accuracyPct: 94,
          runtimeUses: 84 + todayQuestions * 3,
          stemDrills: 54 + todayQuestions * 2,
          verificationChecks: 41 + todayQuestions,
          otherPractice: 158 + todayQuestions * 4,
          totalUses: 337 + todayQuestions * 10,
        },
      ];
    }

    // Default: 'this_week' (Oct 13 – Oct 19, 2026)
    return [
      {
        day: 'Mon',
        dateLabel: 'Oct 13, 2026',
        codeMins: 16,
        examMins: 10,
        langMins: 7,
        reviewMins: 26,
        totalMins: 59,
        questionsAnswered: Math.max(dailyTarget, 6),
        dailyTarget,
        streakDay: baseStartStreak,
        accuracyPct: 85,
        runtimeUses: 12,
        stemDrills: 8,
        verificationChecks: 5,
        otherPractice: 27,
        totalUses: 52,
      },
      {
        day: 'Tue',
        dateLabel: 'Oct 14, 2026',
        codeMins: 20,
        examMins: 9,
        langMins: 6,
        reviewMins: 29,
        totalMins: 64,
        questionsAnswered: Math.max(dailyTarget + 1, 7),
        dailyTarget,
        streakDay: baseStartStreak + 1,
        accuracyPct: 88,
        runtimeUses: 15,
        stemDrills: 7,
        verificationChecks: 6,
        otherPractice: 31,
        totalUses: 59,
      },
      {
        day: 'Wed',
        dateLabel: 'Oct 15, 2026',
        codeMins: 14,
        examMins: 6,
        langMins: 5,
        reviewMins: 33,
        totalMins: 58,
        questionsAnswered: Math.max(dailyTarget, 6),
        dailyTarget,
        streakDay: baseStartStreak + 2,
        accuracyPct: 87,
        runtimeUses: 14,
        stemDrills: 6,
        verificationChecks: 5,
        otherPractice: 33,
        totalUses: 58,
      },
      {
        day: 'Thu',
        dateLabel: 'Oct 16, 2026',
        codeMins: 22,
        examMins: 11,
        langMins: 8,
        reviewMins: 30,
        totalMins: 71,
        questionsAnswered: Math.max(dailyTarget + 2, 8),
        dailyTarget,
        streakDay: baseStartStreak + 3,
        accuracyPct: 91,
        runtimeUses: 18,
        stemDrills: 9,
        verificationChecks: 7,
        otherPractice: 34,
        totalUses: 68,
      },
      {
        day: 'Fri',
        dateLabel: 'Oct 17, 2026',
        codeMins: 18,
        examMins: 12,
        langMins: 9,
        reviewMins: 27,
        totalMins: 66,
        questionsAnswered: Math.max(dailyTarget + 1, 6),
        dailyTarget,
        streakDay: baseStartStreak + 4,
        accuracyPct: 92,
        runtimeUses: 16,
        stemDrills: 8,
        verificationChecks: 6,
        otherPractice: 29,
        totalUses: 59,
      },
      {
        day: 'Sat',
        dateLabel: 'Oct 18, 2026',
        codeMins: 25,
        examMins: 14,
        langMins: 10,
        reviewMins: 36,
        totalMins: 85,
        questionsAnswered: Math.max(dailyTarget + 3, 9),
        dailyTarget,
        streakDay: baseStartStreak + 5,
        accuracyPct: 95,
        runtimeUses: 21,
        stemDrills: 11,
        verificationChecks: 8,
        otherPractice: 38,
        totalUses: 78,
      },
      {
        day: 'Today',
        dateLabel: 'Oct 19, 2026',
        codeMins: todayCodeMins,
        examMins: todayExamMins,
        langMins: todayLangMins,
        reviewMins: todayReviewMins,
        totalMins:
          todayCodeMins + todayExamMins + todayLangMins + todayReviewMins,
        questionsAnswered: todayQuestions,
        dailyTarget,
        streakDay: streakDays,
        accuracyPct: 94,
        runtimeUses: Math.max(8, todayQuestions * 4),
        stemDrills: Math.max(4, todayQuestions * 2),
        verificationChecks: Math.max(3, todayQuestions * 2 - 1),
        otherPractice: Math.max(15, todayQuestions * 7),
        totalUses:
          Math.max(8, todayQuestions * 4) +
          Math.max(4, todayQuestions * 2) +
          Math.max(3, todayQuestions * 2 - 1) +
          Math.max(15, todayQuestions * 7),
      },
    ];
  }, [range, dailyCompleted, dailyTarget, streakDays]);

  const totalMinutes = useMemo(
    () => chartData.reduce((acc, d) => acc + d.totalMins, 0),
    [chartData]
  );
  const totalQuestions = useMemo(
    () => chartData.reduce((acc, d) => acc + d.questionsAnswered, 0),
    [chartData]
  );
  const avgAccuracy = useMemo(
    () =>
      Math.round(
        chartData.reduce((acc, d) => acc + d.accuracyPct, 0) / chartData.length
      ),
    [chartData]
  );

  const hoursFormatted = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-7">
      {/* Top Header & Range Switcher */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            className="text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--mute)' }}
          >
            Learning Telemetry & Momentum
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
            Weekly Activity Report
          </h2>
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--mute)' }}>
            Theme-aware multi-series telemetry of study sessions, track usage, and streak velocity
          </p>
        </div>

        {/* Timeframe Segmented Switcher */}
        <div
          className="inline-flex items-center p-1.5 rounded-full"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
          role="tablist"
          aria-label="Activity report timeframe"
        >
          {(
            [
              { id: 'this_week', label: 'This Week' },
              { id: 'last_week', label: 'Last Week' },
              { id: 'month', label: '4-Week Trend' },
            ] as const
          ).map((item) => {
            const active = range === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  playSoundCue('option');
                  setRange(item.id);
                }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_SNAPPY}
                className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
                style={{ color: active ? '#2D2D2B' : 'var(--ink)' }}
              >
                {active && (
                  <motion.span
                    layoutId="reportTimeframePill"
                    transition={SPRING_BOUNCY}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: 'var(--pk)' }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <BouncySurface
          style={{ backgroundColor: 'var(--bl)', color: '#2D2D2B' }}
          className="rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[144px]"
        >
          <FlowerShape
            className="w-20 h-20 absolute -right-4 -top-4 opacity-35"
            color="#FFFCF5"
          />
          <div className="flex items-center gap-2 text-xs font-extrabold opacity-80">
            <Clock className="w-4 h-4" />
            <span>Time Spent</span>
          </div>
          <div className="pt-3">
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight tabular-nums">
              {hoursFormatted} hrs
            </div>
            <div className="text-xs font-bold opacity-80 tabular-nums mt-0.5">
              {totalMinutes} total focus mins · +18% vs avg
            </div>
          </div>
        </BouncySurface>

        <BouncySurface
          style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
          className="rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[144px]"
        >
          <StarburstShape
            className="w-20 h-20 absolute -right-4 -top-4 opacity-35"
            color="#FFFCF5"
          />
          <div className="flex items-center gap-2 text-xs font-extrabold opacity-80">
            <CheckCircle2 className="w-4 h-4" />
            <span>Questions Answered</span>
          </div>
          <div className="pt-3">
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight tabular-nums">
              {totalQuestions}
            </div>
            <div className="text-xs font-bold opacity-80 tabular-nums mt-0.5">
              Today: {dailyCompleted}/{dailyTarget} daily goal
            </div>
          </div>
        </BouncySurface>

        <BouncySurface
          style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
          className="rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[144px]"
        >
          <SquiggleBoltShape
            className="w-24 h-20 absolute -right-4 -top-3 opacity-35"
            waveColor="#FFFCF5"
            boltColor="#2D2D2B"
          />
          <div className="flex items-center gap-2 text-xs font-extrabold opacity-80">
            <Flame className="w-4 h-4" />
            <span>Active Study Streak</span>
          </div>
          <div className="pt-3">
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight tabular-nums">
              {streakDays} days
            </div>
            <div className="text-xs font-bold opacity-80 mt-0.5">
              Personal best momentum
            </div>
          </div>
        </BouncySurface>

        <BouncySurface
          style={{ backgroundColor: 'var(--gr)', color: '#2D2D2B' }}
          className="rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[144px]"
        >
          <StarburstShape
            className="w-20 h-20 absolute -right-4 -top-4 opacity-35"
            color="#FFFCF5"
          />
          <div className="flex items-center gap-2 text-xs font-extrabold opacity-80">
            <Award className="w-4 h-4" />
            <span>AI Grading Accuracy</span>
          </div>
          <div className="pt-3">
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight tabular-nums">
              {avgAccuracy}%
            </div>
            <div className="text-xs font-bold opacity-80 mt-0.5">
              Mean rubric score {(avgAccuracy / 10).toFixed(1)}/10
            </div>
          </div>
        </BouncySurface>
      </div>

      {/* Main Chart 1: Multi-Series Telemetry with Direct-Inspired Custom Tooltip */}
      <div
        className="rounded-[32px] p-5 sm:p-7 space-y-5 transition-colors"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-extrabold">
              Track Usage & Study Minutes Breakdown
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
              Hover or tap any day to inspect the multi-series breakdown across Runtime/Coding, STEM, Verification, and Review
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Visual Mode Switcher: Multi-Line vs Stacked Bars */}
            <div
              className="inline-flex items-center p-1 rounded-xl"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
            >
              <button
                type="button"
                onClick={() => {
                  playSoundCue('option');
                  setVisualMode('lines');
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: visualMode === 'lines' ? 'var(--card)' : 'transparent',
                  color: visualMode === 'lines' ? 'var(--ink)' : 'var(--mute)',
                }}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Lines</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSoundCue('option');
                  setVisualMode('bars');
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: visualMode === 'bars' ? 'var(--card)' : 'transparent',
                  color: visualMode === 'bars' ? 'var(--ink)' : 'var(--mute)',
                }}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Stacked</span>
              </button>
            </div>

            {/* Track Filter Controls */}
            <div
              className="inline-flex flex-wrap items-center p-1 rounded-xl gap-1"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
            >
              {(
                [
                  { id: 'all', label: 'All Series', dotColor: null },
                  { id: 'code', label: 'Runtime & Code', dotColor: 'var(--series-blue)' },
                  { id: 'exam', label: 'STEM Best Practices', dotColor: 'var(--series-orange)' },
                  { id: 'lang', label: 'Verification & FAL', dotColor: 'var(--series-green)' },
                  { id: 'review', label: 'Other & Flashcards', dotColor: 'var(--series-pink)' },
                ] as const
              ).map((f) => {
                const active = metricFocus === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      playSoundCue('option');
                      setMetricFocus(f.id);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                    style={{
                      backgroundColor: active ? 'var(--ink)' : 'transparent',
                      color: active ? 'var(--bg)' : 'var(--mute)',
                    }}
                  >
                    {f.dotColor && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: f.dotColor }}
                      />
                    )}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              {visualMode === 'lines' ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 14, right: 16, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    unit="m"
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{
                      stroke: 'var(--chart-cursor)',
                      strokeWidth: 1.5,
                      strokeDasharray: '4 4',
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload as ActivityDayPoint;
                      const rows: TooltipSeriesRow[] = [
                        ...(metricFocus === 'all' || metricFocus === 'code'
                          ? [
                              {
                                label: 'Runtime & Coding',
                                value: point.codeMins,
                                color: 'var(--series-blue)',
                              },
                            ]
                          : []),
                        ...(metricFocus === 'all' || metricFocus === 'exam'
                          ? [
                              {
                                label: 'STEM Best Practices',
                                value: point.examMins,
                                color: 'var(--series-orange)',
                              },
                            ]
                          : []),
                        ...(metricFocus === 'all' || metricFocus === 'lang'
                          ? [
                              {
                                label: 'Verification & FAL',
                                value: point.langMins,
                                color: 'var(--series-green)',
                              },
                            ]
                          : []),
                        ...(metricFocus === 'all' || metricFocus === 'review'
                          ? [
                              {
                                label: 'Other & Flashcards',
                                value: point.reviewMins,
                                color: 'var(--series-pink)',
                              },
                            ]
                          : []),
                      ];
                      const displayedTotal = rows.reduce(
                        (acc, r) => acc + Number(r.value),
                        0
                      );
                      return (
                        <DirectInspiredTooltipCard
                          headline={`${displayedTotal} mins`}
                          dateLabel={point.dateLabel}
                          rows={rows}
                        />
                      );
                    }}
                  />
                  {(metricFocus === 'all' || metricFocus === 'code') && (
                    <Line
                      type="monotone"
                      dataKey="codeMins"
                      name="Runtime & Coding"
                      stroke="var(--series-blue)"
                      strokeWidth={2.75}
                      dot={{
                        r: 4,
                        fill: 'var(--series-blue)',
                        stroke: 'var(--card)',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: 'var(--series-blue)',
                        stroke: 'var(--tooltip-bg)',
                        strokeWidth: 2.5,
                      }}
                      isAnimationActive
                      animationDuration={650}
                    />
                  )}
                  {(metricFocus === 'all' || metricFocus === 'exam') && (
                    <Line
                      type="monotone"
                      dataKey="examMins"
                      name="STEM Best Practices"
                      stroke="var(--series-orange)"
                      strokeWidth={2.75}
                      dot={{
                        r: 4,
                        fill: 'var(--series-orange)',
                        stroke: 'var(--card)',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: 'var(--series-orange)',
                        stroke: 'var(--tooltip-bg)',
                        strokeWidth: 2.5,
                      }}
                      isAnimationActive
                      animationDuration={720}
                    />
                  )}
                  {(metricFocus === 'all' || metricFocus === 'lang') && (
                    <Line
                      type="monotone"
                      dataKey="langMins"
                      name="Verification & FAL"
                      stroke="var(--series-green)"
                      strokeWidth={2.75}
                      dot={{
                        r: 4,
                        fill: 'var(--series-green)',
                        stroke: 'var(--card)',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: 'var(--series-green)',
                        stroke: 'var(--tooltip-bg)',
                        strokeWidth: 2.5,
                      }}
                      isAnimationActive
                      animationDuration={800}
                    />
                  )}
                  {(metricFocus === 'all' || metricFocus === 'review') && (
                    <Line
                      type="monotone"
                      dataKey="reviewMins"
                      name="Other & Flashcards"
                      stroke="var(--series-pink)"
                      strokeWidth={2.75}
                      dot={{
                        r: 4,
                        fill: 'var(--series-pink)',
                        stroke: 'var(--card)',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: 'var(--series-pink)',
                        stroke: 'var(--tooltip-bg)',
                        strokeWidth: 2.5,
                      }}
                      isAnimationActive
                      animationDuration={880}
                    />
                  )}
                </LineChart>
              ) : (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 14, right: 16, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    unit="m"
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[60, 100]}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--chart-cursor)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload as ActivityDayPoint;
                      const rows: TooltipSeriesRow[] = [
                        ...(metricFocus === 'all' || metricFocus === 'code'
                          ? [
                              {
                                label: 'Runtime & Coding',
                                value: `${point.codeMins}m`,
                                color: 'var(--series-blue)',
                              },
                            ]
                          : []),
                        ...(metricFocus === 'all' || metricFocus === 'exam'
                          ? [
                              {
                                label: 'STEM Best Practices',
                                value: `${point.examMins}m`,
                                color: 'var(--series-orange)',
                              },
                            ]
                          : []),
                        ...(metricFocus === 'all' || metricFocus === 'lang'
                          ? [
                              {
                                label: 'Verification & FAL',
                                value: `${point.langMins}m`,
                                color: 'var(--series-green)',
                              },
                            ]
                          : []),
                        ...(metricFocus === 'all' || metricFocus === 'review'
                          ? [
                              {
                                label: 'Other & Flashcards',
                                value: `${point.reviewMins}m`,
                                color: 'var(--series-pink)',
                              },
                            ]
                          : []),
                      ];
                      return (
                        <DirectInspiredTooltipCard
                          headline={`${point.totalMins} mins`}
                          dateLabel={point.dateLabel}
                          rows={rows}
                        />
                      );
                    }}
                  />
                  {(metricFocus === 'all' || metricFocus === 'code') && (
                    <Bar
                      yAxisId="left"
                      dataKey="codeMins"
                      name="Runtime & Coding"
                      stackId="mins"
                      fill="var(--series-blue)"
                      radius={metricFocus === 'code' ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                      isAnimationActive
                      animationDuration={650}
                    />
                  )}
                  {(metricFocus === 'all' || metricFocus === 'exam') && (
                    <Bar
                      yAxisId="left"
                      dataKey="examMins"
                      name="STEM Best Practices"
                      stackId="mins"
                      fill="var(--series-orange)"
                      radius={metricFocus === 'exam' ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                      isAnimationActive
                      animationDuration={720}
                    />
                  )}
                  {(metricFocus === 'all' || metricFocus === 'lang') && (
                    <Bar
                      yAxisId="left"
                      dataKey="langMins"
                      name="Verification & FAL"
                      stackId="mins"
                      fill="var(--series-green)"
                      radius={metricFocus === 'lang' ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                      isAnimationActive
                      animationDuration={800}
                    />
                  )}
                  {(metricFocus === 'all' || metricFocus === 'review') && (
                    <Bar
                      yAxisId="left"
                      dataKey="reviewMins"
                      name="Other & Flashcards"
                      stackId="mins"
                      fill="var(--series-pink)"
                      radius={[10, 10, 0, 0]}
                      isAnimationActive
                      animationDuration={860}
                    />
                  )}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracyPct"
                    name="Rubric Accuracy (%)"
                    stroke="var(--ink)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--card)', stroke: 'var(--ink)', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'var(--ink)', stroke: 'var(--card)', strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={900}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-2xl animate-pulse bg-black/5" />
          )}
        </div>
      </div>

      {/* Bottom 2-Column Theme-Aware Charts with Direct-Inspired Tooltips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 2: Daily Interactive Uses & Questions Solved vs. Target (6 cols) */}
        <div
          className="lg:col-span-6 rounded-[32px] p-5 sm:p-6 space-y-4 transition-colors"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-display font-extrabold">
                Questions & Skill Uses vs. Daily Goal
              </h3>
              <p className="text-xs" style={{ color: 'var(--mute)' }}>
                Dashed line marks your daily target ({dailyTarget} questions/day)
              </p>
            </div>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: 'var(--mute)' }}
            >
              {totalQuestions} solved · Target {dailyTarget}/day
            </span>
          </div>

          <div className="h-[255px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="questionsPinkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--series-pink)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--series-pink)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{
                      stroke: 'var(--chart-cursor)',
                      strokeWidth: 1.5,
                      strokeDasharray: '4 4',
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload as ActivityDayPoint;
                      return (
                        <DirectInspiredTooltipCard
                          headline={`${point.totalUses} uses`}
                          dateLabel={point.dateLabel}
                          rows={[
                            {
                              label: 'Runtime',
                              value: point.runtimeUses,
                              color: 'var(--series-blue)',
                            },
                            {
                              label: 'STEM Best Practices',
                              value: point.stemDrills,
                              color: 'var(--series-orange)',
                            },
                            {
                              label: 'Verification',
                              value: point.verificationChecks,
                              color: 'var(--series-green)',
                            },
                            {
                              label: 'Other',
                              value: point.otherPractice,
                              color: 'var(--series-pink)',
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <ReferenceLine
                    y={range === 'month' ? dailyTarget * 7 : dailyTarget}
                    stroke="var(--series-green)"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="questionsAnswered"
                    name="Questions Answered"
                    stroke="var(--series-pink)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#questionsPinkGrad)"
                    dot={{
                      r: 4,
                      fill: 'var(--series-pink)',
                      stroke: 'var(--card)',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: 'var(--series-pink)',
                      stroke: 'var(--tooltip-bg)',
                      strokeWidth: 2.5,
                    }}
                    isAnimationActive
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-2xl animate-pulse bg-black/5" />
            )}
          </div>
        </div>

        {/* Chart 3: Fully Theme-Aware Cumulative Streak & Accuracy Trajectory (6 cols) */}
        <div
          className="lg:col-span-6 rounded-[32px] p-5 sm:p-6 space-y-4 transition-colors"
          style={{
            backgroundColor: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-display font-extrabold">
                Cumulative Streak & Mastery Curve
              </h3>
              <p className="text-xs" style={{ color: 'var(--mute)' }}>
                Unbroken daily habit momentum ending at Day #{streakDays}
              </p>
            </div>
            <span
              className="text-xs font-bold flex items-center gap-1 tabular-nums"
              style={{ color: 'var(--mute)' }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--series-orange)' }} />
              <span>{streakDays}-Day Streak</span>
            </span>
          </div>

          <div className="h-[255px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="streakBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--series-blue)" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="var(--series-blue)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{
                      stroke: 'var(--chart-cursor)',
                      strokeWidth: 1.5,
                      strokeDasharray: '4 4',
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload as ActivityDayPoint;
                      return (
                        <DirectInspiredTooltipCard
                          headline={`Day ${point.streakDay} streak`}
                          dateLabel={point.dateLabel}
                          rows={[
                            {
                              label: 'Consecutive Days',
                              value: point.streakDay,
                              color: 'var(--series-blue)',
                            },
                            {
                              label: 'Rubric Accuracy',
                              value: `${point.accuracyPct}%`,
                              color: 'var(--series-orange)',
                            },
                            {
                              label: 'Questions Solved',
                              value: point.questionsAnswered,
                              color: 'var(--series-green)',
                            },
                            {
                              label: 'Focus Minutes',
                              value: `${point.totalMins}m`,
                              color: 'var(--series-pink)',
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="streakDay"
                    name="Consecutive Streak Days"
                    stroke="var(--series-blue)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#streakBlueGrad)"
                    dot={{
                      r: 4,
                      fill: 'var(--series-blue)',
                      stroke: 'var(--card)',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: 'var(--series-blue)',
                      stroke: 'var(--tooltip-bg)',
                      strokeWidth: 2.5,
                    }}
                    isAnimationActive
                    animationDuration={850}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-2xl animate-pulse bg-black/5" />
            )}
          </div>
        </div>
      </div>

      {/* Actionable AI Study Recommendations Based on Weekly Telemetry */}
      <div
        className="rounded-3xl p-5 sm:p-6 space-y-4 transition-colors"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-display font-extrabold">
              Recommended Next Sprints from Your Telemetry
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
              Click any topic below to launch targeted AI practice and boost your weekly mastery curve
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            {
              track: 'exam' as TrackId,
              topic: 'Probability & combinatorics',
              label: 'NSC / IEB STEM',
              stat: '84% accuracy · +6% potential gain',
              dotColor: 'var(--series-orange)',
            },
            {
              track: 'code' as TrackId,
              topic: 'Dynamic programming',
              label: 'Coding & CAPS IT',
              stat: '79% accuracy · High-yield topic',
              dotColor: 'var(--series-blue)',
            },
            {
              track: 'lang' as TrackId,
              topic: 'Afrikaans & isiZulu FAL',
              label: 'SA Languages',
              stat: '88% accuracy · Ready for Hard level',
              dotColor: 'var(--series-green)',
            },
          ].map((rec) => (
            <BouncySurface
              key={rec.topic}
              onClick={() => {
                onStartTrackPractice(rec.track, rec.topic);
                onNotify(`Launched recommended drill: ${rec.topic}`);
              }}
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
              }}
              className="rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--mute)' }}>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: rec.dotColor }}
                  />
                  <span>{rec.label}</span>
                </div>
                <div className="font-display font-extrabold text-base truncate">
                  {rec.topic}
                </div>
                <div className="text-xs" style={{ color: 'var(--mute)' }}>
                  {rec.stat}
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </BouncySurface>
          ))}
        </div>
      </div>
    </div>
  );
}
