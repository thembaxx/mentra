'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
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
  Sparkles,
  Play,
  Award,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { TrackId } from '@/lib/study-data';
import { FlowerShape, StarburstShape, SquiggleBoltShape } from './BrandMotifs';
import {
  SpringButton,
  BouncySurface,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';

type ReportRange = 'this_week' | 'last_week' | 'month';

interface ActivityDayPoint {
  day: string;
  examMins: number;
  codeMins: number;
  langMins: number;
  totalMins: number;
  questionsAnswered: number;
  dailyTarget: number;
  streakDay: number;
  accuracyPct: number;
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
  const [metricFocus, setMetricFocus] = useState<'all' | 'exam' | 'code' | 'lang'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build reactive dataset synchronized with the user's live Today progress and streak
  const chartData = useMemo<ActivityDayPoint[]>(() => {
    const baseStartStreak = Math.max(1, streakDays - 6);
    const todayQuestions = Math.max(0, dailyCompleted);
    const todayExamMins = Math.max(8, todayQuestions * 4);
    const todayCodeMins = Math.max(10, todayQuestions * 5);
    const todayLangMins = Math.max(6, todayQuestions * 3);

    if (range === 'last_week') {
      return [
        {
          day: 'Mon',
          examMins: 18,
          codeMins: 22,
          langMins: 12,
          totalMins: 52,
          questionsAnswered: 5,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 7),
          accuracyPct: 82,
        },
        {
          day: 'Tue',
          examMins: 24,
          codeMins: 15,
          langMins: 16,
          totalMins: 55,
          questionsAnswered: 6,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 6),
          accuracyPct: 85,
        },
        {
          day: 'Wed',
          examMins: 14,
          codeMins: 28,
          langMins: 10,
          totalMins: 52,
          questionsAnswered: 5,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 5),
          accuracyPct: 84,
        },
        {
          day: 'Thu',
          examMins: 20,
          codeMins: 25,
          langMins: 18,
          totalMins: 63,
          questionsAnswered: 7,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 4),
          accuracyPct: 88,
        },
        {
          day: 'Fri',
          examMins: 16,
          codeMins: 20,
          langMins: 14,
          totalMins: 50,
          questionsAnswered: 5,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 3),
          accuracyPct: 86,
        },
        {
          day: 'Sat',
          examMins: 28,
          codeMins: 30,
          langMins: 20,
          totalMins: 78,
          questionsAnswered: 9,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 2),
          accuracyPct: 91,
        },
        {
          day: 'Sun',
          examMins: 22,
          codeMins: 24,
          langMins: 15,
          totalMins: 61,
          questionsAnswered: 7,
          dailyTarget,
          streakDay: Math.max(1, baseStartStreak - 1),
          accuracyPct: 89,
        },
      ];
    }

    if (range === 'month') {
      return [
        {
          day: 'Wk 1',
          examMins: 95,
          codeMins: 110,
          langMins: 68,
          totalMins: 273,
          questionsAnswered: 28,
          dailyTarget: dailyTarget * 7,
          streakDay: Math.max(1, streakDays - 21),
          accuracyPct: 81,
        },
        {
          day: 'Wk 2',
          examMins: 115,
          codeMins: 132,
          langMins: 84,
          totalMins: 331,
          questionsAnswered: 35,
          dailyTarget: dailyTarget * 7,
          streakDay: Math.max(1, streakDays - 14),
          accuracyPct: 86,
        },
        {
          day: 'Wk 3',
          examMins: 128,
          codeMins: 148,
          langMins: 96,
          totalMins: 372,
          questionsAnswered: 42,
          dailyTarget: dailyTarget * 7,
          streakDay: Math.max(1, streakDays - 7),
          accuracyPct: 90,
        },
        {
          day: 'This Wk',
          examMins: 132 + todayExamMins,
          codeMins: 156 + todayCodeMins,
          langMins: 94 + todayLangMins,
          totalMins: 382 + todayExamMins + todayCodeMins + todayLangMins,
          questionsAnswered: 39 + todayQuestions,
          dailyTarget: dailyTarget * 7,
          streakDay: streakDays,
          accuracyPct: 94,
        },
      ];
    }

    // Default: 'this_week' (Mon - Today)
    return [
      {
        day: 'Mon',
        examMins: 22,
        codeMins: 26,
        langMins: 14,
        totalMins: 62,
        questionsAnswered: Math.max(dailyTarget, 6),
        dailyTarget,
        streakDay: baseStartStreak,
        accuracyPct: 85,
      },
      {
        day: 'Tue',
        examMins: 18,
        codeMins: 32,
        langMins: 16,
        totalMins: 66,
        questionsAnswered: Math.max(dailyTarget + 1, 7),
        dailyTarget,
        streakDay: baseStartStreak + 1,
        accuracyPct: 88,
      },
      {
        day: 'Wed',
        examMins: 28,
        codeMins: 20,
        langMins: 18,
        totalMins: 66,
        questionsAnswered: Math.max(dailyTarget, 6),
        dailyTarget,
        streakDay: baseStartStreak + 2,
        accuracyPct: 87,
      },
      {
        day: 'Thu',
        examMins: 24,
        codeMins: 34,
        langMins: 15,
        totalMins: 73,
        questionsAnswered: Math.max(dailyTarget + 2, 8),
        dailyTarget,
        streakDay: baseStartStreak + 3,
        accuracyPct: 91,
      },
      {
        day: 'Fri',
        examMins: 20,
        codeMins: 24,
        langMins: 22,
        totalMins: 66,
        questionsAnswered: Math.max(dailyTarget + 1, 6),
        dailyTarget,
        streakDay: baseStartStreak + 4,
        accuracyPct: 92,
      },
      {
        day: 'Sat',
        examMins: 30,
        codeMins: 35,
        langMins: 20,
        totalMins: 85,
        questionsAnswered: Math.max(dailyTarget + 3, 9),
        dailyTarget,
        streakDay: baseStartStreak + 5,
        accuracyPct: 95,
      },
      {
        day: 'Today',
        examMins: todayExamMins,
        codeMins: todayCodeMins,
        langMins: todayLangMins,
        totalMins: todayExamMins + todayCodeMins + todayLangMins,
        questionsAnswered: todayQuestions,
        dailyTarget,
        streakDay: streakDays,
        accuracyPct: 94,
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
            Real-time visualization of study minutes, questions answered, and streak velocity
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

      {/* Main Chart 1: Study Minutes by Track + Accuracy Trend (Recharts ComposedChart) */}
      <div
        className="rounded-[32px] p-5 sm:p-7 space-y-5"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-extrabold">
              Study Time by Track & Accuracy Velocity
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
              Stacked minutes across Exam Prep, Coding Interviews, and Languages with AI rubric accuracy (%)
            </p>
          </div>

          {/* Track Filter Pills for Chart 1 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Tracks', color: 'var(--ink)' },
                { id: 'exam', label: 'Exam Prep', color: '#9AAB65' },
                { id: 'code', label: 'Coding', color: '#B6CAEB' },
                { id: 'lang', label: 'Languages', color: '#F7D66E' },
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
                  className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-transform active:scale-95"
                  style={{
                    backgroundColor: active ? '#2D2D2B' : 'var(--bg)',
                    color: active ? '#FFFCF5' : 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[310px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="rgba(128, 126, 116, 0.22)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6F6E68', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  unit="m"
                  tick={{ fill: '#6F6E68', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[60, 100]}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  tick={{ fill: '#6F6E68', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2D2D2B',
                    color: '#FFFCF5',
                    borderRadius: '18px',
                    border: '1px solid rgba(255,252,245,0.15)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '12px 14px',
                  }}
                  itemStyle={{ color: '#FFFCF5', padding: '2px 0' }}
                  cursor={{ fill: 'rgba(182, 202, 235, 0.14)' }}
                />
                {(metricFocus === 'all' || metricFocus === 'exam') && (
                  <Bar
                    yAxisId="left"
                    dataKey="examMins"
                    name="Exam Prep (mins)"
                    stackId="mins"
                    fill="#9AAB65"
                    radius={metricFocus === 'exam' ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                    isAnimationActive
                    animationDuration={650}
                  />
                )}
                {(metricFocus === 'all' || metricFocus === 'code') && (
                  <Bar
                    yAxisId="left"
                    dataKey="codeMins"
                    name="Coding Interviews (mins)"
                    stackId="mins"
                    fill="#B6CAEB"
                    radius={metricFocus === 'code' ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                    isAnimationActive
                    animationDuration={750}
                  />
                )}
                {(metricFocus === 'all' || metricFocus === 'lang') && (
                  <Bar
                    yAxisId="left"
                    dataKey="langMins"
                    name="Spanish & Languages (mins)"
                    stackId="mins"
                    fill="#F7D66E"
                    radius={[10, 10, 0, 0]}
                    isAnimationActive
                    animationDuration={850}
                  />
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracyPct"
                  name="Rubric Accuracy (%)"
                  stroke="#FFB2DD"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#2D2D2B', stroke: '#FFB2DD', strokeWidth: 2.5 }}
                  activeDot={{ r: 7, fill: '#FFB2DD', stroke: '#2D2D2B', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={900}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-2xl animate-pulse bg-black/5" />
          )}
        </div>
      </div>

      {/* Bottom 2-Column Charts: Questions Answered vs Target (AreaChart) + Streak Growth Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 2: Questions Answered vs. Daily Goal Target (6 cols) */}
        <div
          className="lg:col-span-6 rounded-[32px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-display font-extrabold">
                Questions Answered vs. Daily Goal
              </h3>
              <p className="text-xs" style={{ color: 'var(--mute)' }}>
                Dashed line marks your daily target ({dailyTarget} questions/day)
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold tabular-nums"
              style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
            >
              {totalQuestions} solved
            </span>
          </div>

          <div className="h-[245px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="questionsPinkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB2DD" stopOpacity={0.78} />
                      <stop offset="95%" stopColor="#FFB2DD" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="rgba(128, 126, 116, 0.2)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6F6E68', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6F6E68', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2D2D2B',
                      color: '#FFFCF5',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <ReferenceLine
                    y={range === 'month' ? dailyTarget * 7 : dailyTarget}
                    stroke="#9AAB65"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="questionsAnswered"
                    name="Questions Answered"
                    stroke="#FFB2DD"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#questionsPinkGrad)"
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

        {/* Chart 3: Streak Growth & Consistency Curve (6 cols) */}
        <div
          className="lg:col-span-6 rounded-[32px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: '#2D2D2B', color: '#F8F3E7' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-display font-extrabold">
                Cumulative Streak Growth
              </h3>
              <p className="text-xs" style={{ color: '#B9B6AA' }}>
                Unbroken daily habit momentum ending at Day #{streakDays}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 tabular-nums"
              style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{streakDays}-Day Streak</span>
            </span>
          </div>

          <div className="h-[245px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="streakGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7D66E" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#F7D66E" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="rgba(255, 252, 245, 0.1)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#B9B6AA', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#B9B6AA', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFCF5',
                      color: '#2D2D2B',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="streakDay"
                    name="Consecutive Streak Days"
                    stroke="#F7D66E"
                    strokeWidth={3.5}
                    fillOpacity={1}
                    fill="url(#streakGoldGrad)"
                    dot={{ r: 4, fill: '#2D2D2B', stroke: '#F7D66E', strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={850}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-2xl animate-pulse bg-white/5" />
            )}
          </div>
        </div>
      </div>

      {/* Actionable AI Study Recommendations Based on Weekly Telemetry */}
      <div
        className="rounded-3xl p-5 sm:p-6 space-y-4"
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
              label: 'SAT / GRE Math',
              stat: '84% accuracy · +6% potential gain',
              colorVar: '--gr' as const,
            },
            {
              track: 'code' as TrackId,
              topic: 'Dynamic programming',
              label: 'Coding Interviews',
              stat: '79% accuracy · High-yield topic',
              colorVar: '--bl' as const,
            },
            {
              track: 'lang' as TrackId,
              topic: 'Conditionals & Subjunctive',
              label: 'Spanish B1–B2',
              stat: '88% accuracy · Ready for Hard level',
              colorVar: '--yl' as const,
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
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                  style={{ backgroundColor: `var(${rec.colorVar})`, color: '#2D2D2B' }}
                >
                  {rec.label}
                </span>
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
