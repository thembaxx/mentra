'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  PenTool,
  Compass,
  Sparkles,
  Sun,
  Moon,
  Clock,
  Play,
} from 'lucide-react';
import { TrackId } from '@/lib/study-data';
import {
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

type ViewId = 'home' | 'practice' | 'catalog' | 'plans';

export default function LearnFlowApp() {
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [activeTrack, setActiveTrack] = useState<TrackId>('exam');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('');
  const [isPro, setIsPro] = useState<boolean>(false);
  const [freeQuestionsLeft, setFreeQuestionsLeft] = useState<number>(5);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [heroPulse, setHeroPulse] = useState<number>(0);

  // Paywall & Toast states
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !isDark;
    setIsDark(nextDark);
    root.dataset.theme = nextDark ? 'dark' : 'light';
  };

  const consumeQuota = useCallback((): boolean => {
    if (isPro) return true;
    if (freeQuestionsLeft <= 0) {
      setPaywallReason("You've used today's 5 free AI questions. Start your 7-day Pro trial for unlimited practice.");
      setPaywallOpen(true);
      return false;
    }
    setFreeQuestionsLeft((prev) => Math.max(0, prev - 1));
    return true;
  }, [isPro, freeQuestionsLeft]);

  const handleOpenPaywall = useCallback((reason: string) => {
    setPaywallReason(reason);
    setPaywallOpen(true);
  }, []);

  const handleUpgradeToPro = useCallback(() => {
    setIsPro(true);
    setPaywallOpen(false);
    showToast('Pro 7-day trial started! Unlimited AI questions & step-by-step tutor unlocked.');
  }, [showToast]);

  const navigateToPractice = (track: TrackId, topic = '') => {
    setActiveTrack(track);
    setSelectedTopicFilter(topic);
    setHeroPulse((p) => p + 1);
    setActiveView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateView = (v: ViewId) => {
    setActiveView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        {/* Strict 3-Zone Top Navigation Bar */}
        <header
          className="flex items-center justify-between gap-8 py-4 border-b"
          style={{ borderColor: 'var(--line)' }}
        >
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateView('home')}
            className="flex items-center gap-2.5 font-display font-extrabold text-2xl sm:text-[28px] tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FlowerShape className="w-7 h-7" color="var(--bl)" centerColor="var(--pk)" />
            <span>LearnFlow</span>
          </button>

          {/* Zone 2: 4 Single-Line Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-semibold"
            aria-label="Primary Navigation"
          >
            {(
              [
                { id: 'home', label: 'Overview' },
                { id: 'practice', label: 'AI Practice' },
                { id: 'catalog', label: 'Curriculum' },
                { id: 'plans', label: 'Plans' },
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

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <SpringButton
              size="sm"
              variant={isPro ? 'yellow' : 'pink'}
              onClick={() => navigateView(isPro ? 'practice' : 'plans')}
            >
              {isPro ? 'Pro Active' : 'Start Free Practice'}
            </SpringButton>
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

                  {/* Top Hero Bar */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                    <span className="text-xs sm:text-sm font-bold tracking-tight opacity-85">
                      Mentra × LearnFlow · Interactive 3D & AI Study Engine
                    </span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="pointer-events-auto px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: 'rgba(255, 252, 245, 0.85)', color: '#2D2D2B' }}
                    >
                      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{isDark ? 'Light canvas' : 'Dark canvas'}</span>
                    </button>
                  </div>

                  {/* Giant Hero Display Wordmark */}
                  <motion.h1
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRING_BOUNCY}
                    className="relative z-10 font-display font-extrabold select-none pointer-events-none my-4"
                    style={{
                      fontSize: 'clamp(64px, 16vw, 195px)',
                      color: '#FFFCF5',
                      letterSpacing: '-0.06em',
                      lineHeight: 0.86,
                    }}
                  >
                    LearnFlow
                  </motion.h1>

                  {/* Bottom Hero Copy & Bouncy CTAs */}
                  <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 pt-2">
                    <p
                      className="max-w-[360px] font-semibold text-base sm:text-[18px] leading-snug"
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

                {/* Greeting & Next Session Card + Story Tiles Row */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2
                      className="font-display font-extrabold"
                      style={{ fontSize: 'clamp(36px, 6vw, 58px)' }}
                    >
                      Hi, Alex
                    </h2>
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--mute)' }}>
                      7-day study streak · {isPro ? 'Pro Member' : `${freeQuestionsLeft}/5 free daily AI questions`}
                    </span>
                  </div>

                  {/* Next AI Session Banner Card matching HTML .sess */}
                  <BouncySurface
                    onClick={() => navigateToPractice('exam', 'Linear equations')}
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                    className="rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-full grid place-items-center font-display font-extrabold text-sm shrink-0"
                        style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
                      >
                        AI
                      </div>
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
                      onClick={() => navigateToPractice('lang', 'Ongoing actions (Llevar + Gerund)')}
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
                      onClick={() => navigateToPractice('exam', 'Probability & combinatorics')}
                      className="h-40 rounded-3xl p-4 relative overflow-hidden text-left flex items-end font-display font-extrabold text-lg leading-tight cursor-pointer"
                      style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
                    >
                      <StarburstShape
                        className="w-24 h-24 absolute -right-2 -top-2"
                        color="var(--gr)"
                      />
                      <span className="relative z-10">7-day streak sprint</span>
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
                        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                        className="rounded-3xl p-6 min-h-[210px] flex flex-col justify-between cursor-pointer relative"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="w-12 h-12 rounded-2xl grid place-items-center font-display font-extrabold text-xl"
                            style={{ backgroundColor: trk.bg, color: '#2D2D2B' }}
                          >
                            {trk.symbol}
                          </div>
                          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--mute)' }}>
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

      {/* Floating Bottom Navigation Dock with Physics Layout Indicator */}
      <nav
        aria-label="Bottom Dock Navigation"
        className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 flex items-center gap-1 p-1.5 rounded-full shadow-xl"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--line)',
        }}
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'practice', label: 'Practice', icon: PenTool },
            { id: 'catalog', label: 'Catalog', icon: Compass },
            { id: 'plans', label: 'Plans', icon: Sparkles },
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
              className="relative px-4 sm:px-5 py-2 rounded-full flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
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
              <Icon className="w-5 h-5 relative z-10" strokeWidth={2} />
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          onClick={toggleTheme}
          whileTap={{ scale: 0.9, rotate: 15 }}
          transition={SPRING_SNAPPY}
          aria-label="Toggle color theme"
          className="px-3.5 py-2 rounded-full flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer"
          style={{ color: 'var(--mute)' }}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>Theme</span>
        </motion.button>
      </nav>

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
