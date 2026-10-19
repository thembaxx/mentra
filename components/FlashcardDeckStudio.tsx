'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'motion/react';
import {
  RotateCw,
  Check,
  RotateCcw,
  Sparkles,
  Copy,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Layers,
  Lightbulb,
  Code2,
  Shuffle,
} from 'lucide-react';
import {
  TrackId,
  DifficultyLevel,
  FlashcardItem,
  INITIAL_FLASHCARDS,
} from '@/lib/study-data';
import {
  FlowerShape,
  StarburstShape,
  SquiggleBoltShape,
} from './BrandMotifs';
import {
  SpringButton,
  ShakeContainer,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_GENTLE,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';
import { fireLearnFlowConfetti } from './DailyStudyGoalCard';
import { MathText } from './MathRenderer';

interface FlashcardDeckStudioProps {
  activeTrack: TrackId;
  difficulty: DifficultyLevel;
  customTopic: string;
  onChangeCustomTopic: (val: string) => void;
  onConsumeQuota: () => boolean;
  onNotify: (msg: string) => void;
  onCardMastered?: () => void;
}

export function FlashcardDeckStudio({
  activeTrack,
  difficulty,
  customTopic,
  onChangeCustomTopic,
  onConsumeQuota,
  onNotify,
  onCardMastered,
}: FlashcardDeckStudioProps) {
  const [decksByTrack, setDecksByTrack] =
    useState<Record<TrackId, FlashcardItem[]>>(INITIAL_FLASHCARDS);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>({});
  const [reviewLaterIds, setReviewLaterIds] = useState<Record<string, boolean>>({});
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isStreamingCard, setIsStreamingCard] = useState<boolean>(false);
  const [streamPreviewTitle, setStreamPreviewTitle] = useState<string>('');
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'all' | 'unmastered'>('all');

  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-240, 0, 240], [-13, 0, 13]);
  const masterStampOpacity = useTransform(x, [25, 115], [0, 1]);
  const masterStampScale = useTransform(x, [25, 115], [0.82, 1.05]);
  const reviewStampOpacity = useTransform(x, [-25, -115], [0, 1]);
  const reviewStampScale = useTransform(x, [-25, -115], [0.82, 1.05]);

  const isDraggingRef = useRef(false);

  const fullTrackDeck = decksByTrack[activeTrack] || INITIAL_FLASHCARDS.exam;
  const visibleDeck =
    filterMode === 'unmastered'
      ? fullTrackDeck.filter((c) => !masteredIds[c.id])
      : fullTrackDeck;

  const safeIndex = visibleDeck.length > 0 ? activeIndex % visibleDeck.length : 0;
  const currentCard: FlashcardItem | undefined = visibleDeck[safeIndex];
  const nextCard1: FlashcardItem | undefined =
    visibleDeck.length > 1 ? visibleDeck[(safeIndex + 1) % visibleDeck.length] : undefined;
  const nextCard2: FlashcardItem | undefined =
    visibleDeck.length > 2 ? visibleDeck[(safeIndex + 2) % visibleDeck.length] : undefined;

  const trackMasteredCount = fullTrackDeck.filter((c) => masteredIds[c.id]).length;
  const trackProgressPct =
    fullTrackDeck.length > 0
      ? Math.round((trackMasteredCount / fullTrackDeck.length) * 100)
      : 0;

  // Reset card flip & index when switching track
  useEffect(() => {
    setActiveIndex(0);
    setIsFlipped(false);
    setExitDirection(null);
    x.set(0);
  }, [activeTrack, x]);

  const handleFlipCard = useCallback(() => {
    if (isDraggingRef.current || !currentCard) return;
    playSoundCue('step_reveal');
    setIsFlipped((prev) => !prev);
  }, [currentCard]);

  const advanceCard = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard) return;
      setExitDirection(direction);

      if (direction === 'right') {
        const wasAlreadyMastered = !!masteredIds[currentCard.id];
        setMasteredIds((prev) => {
          const updated = { ...prev, [currentCard.id]: true };
          const newlyMasteredTotal = fullTrackDeck.filter((c) => updated[c.id]).length;
          if (newlyMasteredTotal === fullTrackDeck.length && !wasAlreadyMastered) {
            fireLearnFlowConfetti();
            onNotify(`All ${fullTrackDeck.length} flashcards in this deck mastered!`);
          }
          return updated;
        });
        setReviewLaterIds((prev) => {
          const next = { ...prev };
          delete next[currentCard.id];
          return next;
        });
        playSoundCue('grade_success');
        if (!wasAlreadyMastered) {
          onCardMastered?.();
        }
      } else {
        setReviewLaterIds((prev) => ({ ...prev, [currentCard.id]: true }));
        playSoundCue('option');
      }

      setTimeout(() => {
        setIsFlipped(false);
        x.set(0);
        setActiveIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 180);
    },
    [currentCard, masteredIds, fullTrackDeck, onCardMastered, onNotify, x]
  );

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);

    const offsetThreshold = 100;
    const velocityThreshold = 460;

    if (info.offset.x > offsetThreshold || info.velocity.x > velocityThreshold) {
      advanceCard('right');
    } else if (
      info.offset.x < -offsetThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      advanceCard('left');
    } else {
      x.set(0);
    }
  };

  // Keyboard navigation for flashcards (Space = flip, ArrowRight = Mastered, ArrowLeft = Review Later)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlipCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        advanceCard('right');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        advanceCard('left');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlipCard, advanceCard]);

  const handleCopySnippet = (e: React.MouseEvent, card: FlashcardItem) => {
    e.stopPropagation();
    playSoundCue('tap');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(card.codeOrFormulaSnippet).catch(() => {});
    }
    setCopiedId(card.id);
    onNotify('Copied snippet to clipboard');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleShuffleDeck = () => {
    playSoundCue('option');
    setDecksByTrack((prev) => {
      const list = [...prev[activeTrack]];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return { ...prev, [activeTrack]: list };
    });
    setIsFlipped(false);
    setActiveIndex(0);
    onNotify('Shuffled flashcard deck');
  };

  const handleResetMastery = () => {
    playSoundCue('tap');
    setMasteredIds((prev) => {
      const next = { ...prev };
      fullTrackDeck.forEach((c) => delete next[c.id]);
      return next;
    });
    setReviewLaterIds((prev) => {
      const next = { ...prev };
      fullTrackDeck.forEach((c) => delete next[c.id]);
      return next;
    });
    setFilterMode('all');
    setActiveIndex(0);
    setIsFlipped(false);
    onNotify('Reset mastery progress for this deck');
  };

  // Stream a brand-new AI flashcard from /api/tutor
  const handleStreamAIFlashcard = async () => {
    const topicToUse =
      customTopic.trim() ||
      (activeTrack === 'code'
        ? 'Two pointers & Hash Maps'
        : activeTrack === 'lang'
          ? 'Subjunctive triggers'
          : 'Quadratic vertex form');

    if (!onConsumeQuota()) {
      setShakeKey((k) => k + 1);
      return;
    }

    setIsStreamingCard(true);
    setStreamPreviewTitle(`Synthesizing "${topicToUse}" flashcard...`);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_flashcard',
          track: activeTrack,
          topic: topicToUse,
          difficulty,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to stream AI flashcard');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const liveTitleMatch = raw.match(/TITLE:\s*([^\n]+)/i);
        if (liveTitleMatch?.[1]) {
          setStreamPreviewTitle(liveTitleMatch[1].trim());
        }
      }

      const titleMatch = raw.match(/TITLE:\s*([^\n]+)/i);
      const promptMatch = raw.match(/PROMPT:\s*([\s\S]*?)(?=\nDEFINITION:|$)/i);
      const defMatch = raw.match(/DEFINITION:\s*([\s\S]*?)(?=\nSNIPPET:|$)/i);
      const snippetMatch = raw.match(/SNIPPET:\s*([\s\S]*?)(?=\nTIP:|$)/i);
      const tipMatch = raw.match(/TIP:\s*([\s\S]*)$/i);

      const colors: ('--pk' | '--yl' | '--gr' | '--bl')[] = [
        '--pk',
        '--bl',
        '--yl',
        '--gr',
      ];
      const newCard: FlashcardItem = {
        id: `fc-ai-${Date.now()}`,
        track: activeTrack,
        topic: topicToUse,
        difficulty,
        frontTitle: (titleMatch?.[1] || `${topicToUse} Key Pattern`).trim(),
        frontPrompt: (
          promptMatch?.[1] ||
          `What is the essential invariant and step-by-step pattern for ${topicToUse}?`
        ).trim(),
        backDefinition: (
          defMatch?.[1] ||
          `Isolate the governing invariant for ${topicToUse} and verify edge cases systematically.`
        ).trim(),
        codeOrFormulaSnippet: (
          snippetMatch?.[1] ||
          `// ${topicToUse} (${difficulty})\n1. Establish base state\n2. Transform invariant step-by-step\n3. Verify boundary conditions`
        ).trim(),
        snippetLabel:
          activeTrack === 'code'
            ? 'AI-Generated Code Template'
            : activeTrack === 'lang'
              ? 'AI-Generated Grammar Pattern'
              : 'AI-Generated Formula & Invariant',
        memoryTip: (
          tipMatch?.[1] ||
          `Test ${topicToUse} on small boundary cases first to confirm the invariant holds.`
        ).trim(),
        colorVar: colors[fullTrackDeck.length % colors.length],
      };

      setDecksByTrack((prev) => ({
        ...prev,
        [activeTrack]: [newCard, ...prev[activeTrack]],
      }));
      setFilterMode('all');
      setActiveIndex(0);
      setIsFlipped(false);
      setIsStreamingCard(false);
      playSoundCue('step_reveal');
      onNotify(`Added new AI flashcard: "${newCard.frontTitle}"`);
    } catch {
      setIsStreamingCard(false);
      setShakeKey((k) => k + 1);
      onNotify('Could not stream flashcard right now — try again');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Interactive 3D Flip & Swipe-to-Master Deck Arena (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Top Deck Status Bar */}
        <div
          className="rounded-3xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl grid place-items-center font-display font-extrabold text-sm tabular-nums"
              style={{
                backgroundColor:
                  trackProgressPct === 100 ? 'var(--gr)' : 'var(--pk)',
                color: '#2D2D2B',
              }}
            >
              {trackProgressPct}%
            </div>
            <div>
              <div className="font-display font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Swipe-to-Master Deck</span>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
                >
                  {trackMasteredCount}/{fullTrackDeck.length} mastered
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--mute)' }}>
                Tap card (or press Space) to flip · Drag right to master · Drag left to review again
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playSoundCue('option');
                setFilterMode((m) => (m === 'all' ? 'unmastered' : 'all'));
                setActiveIndex(0);
                setIsFlipped(false);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors"
              style={{
                backgroundColor:
                  filterMode === 'unmastered' ? 'var(--yl)' : 'var(--bg)',
                color: filterMode === 'unmastered' ? '#2D2D2B' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {filterMode === 'unmastered' ? 'Showing Unmastered' : 'All Cards'}
            </button>

            <button
              type="button"
              onClick={handleShuffleDeck}
              title="Shuffle deck"
              aria-label="Shuffle deck"
              className="p-2 rounded-full cursor-pointer"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {trackMasteredCount > 0 && (
              <button
                type="button"
                onClick={handleResetMastery}
                title="Reset mastery progress"
                aria-label="Reset mastery progress"
                className="p-2 rounded-full cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3D Stacked Card Arena */}
        <div
          className="relative min-h-[430px] sm:min-h-[450px] flex items-center justify-center select-none py-3"
          style={{ perspective: '1400px' }}
        >
          {currentCard ? (
            <>
              {/* Background Stacked Card +2 */}
              {nextCard2 && (
                <motion.div
                  key={`bg2-${nextCard2.id}`}
                  animate={{ scale: 0.91, y: 26, opacity: 0.48 }}
                  transition={SPRING_GENTLE}
                  className="absolute inset-x-4 sm:inset-x-8 h-[390px] sm:h-[410px] rounded-[32px] pointer-events-none"
                  style={{
                    backgroundColor: `var(${nextCard2.colorVar})`,
                    border: '1px solid rgba(45,45,43,0.14)',
                    zIndex: 1,
                  }}
                />
              )}

              {/* Background Stacked Card +1 */}
              {nextCard1 && (
                <motion.div
                  key={`bg1-${nextCard1.id}`}
                  animate={{ scale: 0.955, y: 13, opacity: 0.75 }}
                  transition={SPRING_GENTLE}
                  className="absolute inset-x-2 sm:inset-x-5 h-[390px] sm:h-[410px] rounded-[32px] pointer-events-none"
                  style={{
                    backgroundColor: `var(${nextCard1.colorVar})`,
                    border: '1px solid rgba(45,45,43,0.16)',
                    zIndex: 2,
                  }}
                />
              )}

              {/* Foreground Draggable & 3D Flippable Card */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentCard.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.88}
                  onDragStart={() => {
                    isDraggingRef.current = true;
                  }}
                  onDragEnd={handleDragEnd}
                  style={{
                    x,
                    rotateZ,
                    zIndex: 10,
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{ scale: 0.92, opacity: 0, y: 18 }}
                  animate={
                    exitDirection === 'right'
                      ? { x: 440, rotateZ: 18, opacity: 0, scale: 0.92 }
                      : exitDirection === 'left'
                        ? { x: -440, rotateZ: -18, opacity: 0, scale: 0.92 }
                        : { x: 0, rotateZ: 0, scale: 1, opacity: 1, y: 0 }
                  }
                  transition={SPRING_SNAPPY}
                  onClick={handleFlipCard}
                  role="button"
                  tabIndex={0}
                  aria-label={`Flashcard: ${currentCard.frontTitle}. Click or press Space to flip.`}
                  className="relative w-full h-[395px] sm:h-[415px] cursor-grab active:cursor-grabbing focus:outline-none"
                >
                  {/* Dynamic Swipe Stamp Overlay: MASTERED (Right Drag) */}
                  <motion.div
                    style={{
                      opacity: masterStampOpacity,
                      scale: masterStampScale,
                      backgroundColor: 'var(--gr)',
                      color: '#2D2D2B',
                      border: '3px solid #2D2D2B',
                    }}
                    className="pointer-events-none absolute top-6 left-6 z-30 px-4 py-1.5 rounded-2xl font-display font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5 shadow-lg -rotate-12"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>MASTERED</span>
                  </motion.div>

                  {/* Dynamic Swipe Stamp Overlay: REVIEW AGAIN (Left Drag) */}
                  <motion.div
                    style={{
                      opacity: reviewStampOpacity,
                      scale: reviewStampScale,
                      backgroundColor: 'var(--yl)',
                      color: '#2D2D2B',
                      border: '3px solid #2D2D2B',
                    }}
                    className="pointer-events-none absolute top-6 right-6 z-30 px-4 py-1.5 rounded-2xl font-display font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5 shadow-lg rotate-12"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    <span>REVIEW LATER</span>
                  </motion.div>

                  {/* 3D Inner Flip Container */}
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 290,
                      damping: 24,
                      mass: 0.9,
                    }}
                    className="w-full h-full relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* FRONT FACE: Concept / Prompt */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-[32px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl"
                      style={{
                        backgroundColor: `var(${currentCard.colorVar})`,
                        color: '#2D2D2B',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        border: '2px solid rgba(45,45,43,0.12)',
                      }}
                    >
                      {/* Decorative Classly Geometric Motif */}
                      <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-35">
                        {currentCard.track === 'code' ? (
                          <SquiggleBoltShape
                            className="w-36 h-32"
                            waveColor="#FFFCF5"
                            boltColor="#2D2D2B"
                          />
                        ) : currentCard.track === 'lang' ? (
                          <StarburstShape className="w-36 h-36" color="#FFFCF5" />
                        ) : (
                          <FlowerShape
                            className="w-36 h-36"
                            color="#FFFCF5"
                            centerColor="#2D2D2B"
                          />
                        )}
                      </div>

                      {/* Top Metadata Row */}
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold">
                          <span
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: 'rgba(255, 252, 245, 0.85)',
                              color: '#2D2D2B',
                            }}
                          >
                            {currentCard.topic}
                          </span>
                          <span
                            className="px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: 'rgba(45, 45, 43, 0.1)',
                              color: '#2D2D2B',
                            }}
                          >
                            {currentCard.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {masteredIds[currentCard.id] && (
                            <span
                              className="px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1"
                              style={{
                                backgroundColor: '#2D2D2B',
                                color: '#FFFCF5',
                              }}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              Mastered
                            </span>
                          )}
                          <span className="text-xs font-extrabold tabular-nums opacity-75">
                            Card {safeIndex + 1} of {visibleDeck.length}
                          </span>
                        </div>
                      </div>

                      {/* Center Concept Title & Recall Question */}
                      <div className="relative z-10 space-y-3 my-auto py-2">
                        <div className="text-xs font-extrabold uppercase tracking-wider opacity-70">
                          Concept Recall Prompt
                        </div>
                        <h3 className="font-display font-extrabold text-2xl sm:text-4xl leading-[1.08] tracking-tight">
                          {currentCard.frontTitle}
                        </h3>
                        <div className="text-sm sm:text-[17px] font-semibold leading-relaxed max-w-[92%] opacity-90">
                          <MathText text={currentCard.frontPrompt} />
                        </div>
                      </div>

                      {/* Bottom Flip Hint Footer */}
                      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-black/10 text-xs font-extrabold">
                        <span className="flex items-center gap-1.5">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Tap card or press Space to flip for definition & code</span>
                        </span>
                        <span className="hidden sm:inline opacity-75">
                          ← Review · Master →
                        </span>
                      </div>
                    </div>

                    {/* BACK FACE: Definition + Code/Formula Snippet + Memory Tip */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-[32px] p-6 sm:p-7 flex flex-col justify-between overflow-y-auto shadow-2xl"
                      style={{
                        backgroundColor: '#2D2D2B',
                        color: '#F8F3E7',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        border: '2px solid var(--pk)',
                      }}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-extrabold"
                            style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
                          >
                            {currentCard.frontTitle}
                          </span>
                        </div>
                        <span
                          className="text-xs font-bold flex items-center gap-1"
                          style={{ color: '#B9B6AA' }}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Tap to flip back</span>
                        </span>
                      </div>

                      {/* Core Definition */}
                      <div className="space-y-3 my-2">
                        <div className="text-xs sm:text-sm leading-relaxed font-medium text-[#F8F3E7]/95">
                          <MathText text={currentCard.backDefinition} />
                        </div>

                        {/* Monospace Code Snippet / KaTeX Formula Box */}
                        <div
                          className="rounded-2xl p-3.5 space-y-2"
                          style={{
                            backgroundColor: 'rgba(255, 252, 245, 0.07)',
                            border: '1px solid rgba(255, 252, 245, 0.14)',
                          }}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className="flex items-center gap-1.5"
                              style={{ color: 'var(--yl)' }}
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>{currentCard.snippetLabel}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySnippet(e, currentCard)}
                              className="px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors"
                              style={{ color: '#F8F3E7' }}
                            >
                              {copiedId === currentCard.id ? (
                                <>
                                  <Check className="w-3 h-3 text-[var(--gr)]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          {currentCard.track === 'exam' ? (
                            <div className="text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-[#EAF0F9]">
                              <MathText text={currentCard.codeOrFormulaSnippet} />
                            </div>
                          ) : (
                            <pre className="font-mono-code text-[11px] sm:text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-[#EAF0F9]">
                              {currentCard.codeOrFormulaSnippet}
                            </pre>
                          )}
                        </div>

                        {/* Memory Lifehack Callout */}
                        <div
                          className="rounded-xl px-3.5 py-2.5 flex items-start gap-2 text-xs"
                          style={{
                            backgroundColor: 'rgba(247, 214, 110, 0.12)',
                            color: '#FEEFBF',
                          }}
                        >
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-[var(--yl)]" />
                          <span>
                            <strong>Lifehack:</strong> <MathText text={currentCard.memoryTip} />
                          </span>
                        </div>
                      </div>

                      {/* Back Footer */}
                      <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-white/10 text-[#B9B6AA]">
                        <span>Swipe Left: Review Later</span>
                        <span>Swipe Right: Mark Mastered ✓</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            /* Empty state when filtering by Unmastered and 100% of cards are mastered */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING_BOUNCY}
              className="w-full rounded-[32px] p-8 text-center space-y-4"
              style={{
                backgroundColor: 'var(--grs)',
                color: '#2D2D2B',
                border: '2px solid var(--gr)',
              }}
            >
              <div
                className="w-16 h-16 rounded-3xl mx-auto grid place-items-center"
                style={{ backgroundColor: 'var(--gr)', color: '#2D2D2B' }}
              >
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="font-display font-extrabold text-3xl">
                Every card in this deck is mastered!
              </h3>
              <p className="text-sm max-w-md mx-auto opacity-85">
                You have mastered all {fullTrackDeck.length} flashcards in this track. Show all cards to review again or stream a brand-new AI flashcard on any topic.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <SpringButton
                  variant="ink"
                  onClick={() => {
                    setFilterMode('all');
                    setActiveIndex(0);
                  }}
                >
                  <span>Show All Cards</span>
                </SpringButton>
                <SpringButton variant="pink" onClick={handleStreamAIFlashcard}>
                  <Sparkles className="w-4 h-4" />
                  <span>Stream New AI Flashcard</span>
                </SpringButton>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tactile Control Bar Below Deck (Review Left · Flip · Master Right) */}
        {currentCard && (
          <div className="grid grid-cols-3 gap-3">
            <SpringButton
              variant="card"
              soundCue={false}
              onClick={() => advanceCard('left')}
              className="w-full justify-center py-3.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Review Later</span>
            </SpringButton>

            <SpringButton
              variant="blue"
              soundCue={false}
              onClick={handleFlipCard}
              className="w-full justify-center py-3.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>{isFlipped ? 'Show Prompt' : 'Flip Card'}</span>
            </SpringButton>

            <SpringButton
              variant="green"
              magnetic
              soundCue={false}
              onClick={() => advanceCard('right')}
              className="w-full justify-center py-3.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Mastered!</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </SpringButton>
          </div>
        )}
      </div>

      {/* Right Column: AI Flashcard Generator & Deck Overview List (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {/* AI Custom Flashcard Generator Box */}
        <ShakeContainer shakeKey={shakeKey}>
          <div
            className="rounded-3xl p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: '#2D2D2B',
              color: '#F8F3E7',
              border: '1px solid var(--line)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                  style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-lg leading-tight">
                    AI Flashcard Synthesizer
                  </h4>
                  <p className="text-xs" style={{ color: '#B9B6AA' }}>
                    Stream a custom 3D card with definition & code/formula
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => onChangeCustomTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStreamAIFlashcard();
                  }
                }}
                placeholder={
                  activeTrack === 'code'
                    ? 'e.g., Monotonic Stack, Dijkstra, Trie...'
                    : activeTrack === 'lang'
                      ? 'e.g., Subjunctive triggers, Ser vs Estar...'
                      : 'e.g., Binomial theorem, Circle equations...'
                }
                aria-label="Custom flashcard topic"
                className="w-full rounded-2xl px-4 py-3 text-base bg-white/10 text-white placeholder:text-white/45 focus:outline-2 focus:outline-[var(--pk)]"
              />

              <SpringButton
                variant="pink"
                magnetic
                disabled={isStreamingCard}
                onClick={handleStreamAIFlashcard}
                className="w-full justify-center py-3"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isStreamingCard
                    ? streamPreviewTitle || 'Streaming AI Flashcard...'
                    : 'Stream New AI Flashcard'}
                </span>
              </SpringButton>
            </div>
          </div>
        </ShakeContainer>

        {/* Deck Queue & Mastery Checklist */}
        <div
          className="rounded-3xl p-5 space-y-3"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display font-extrabold text-lg flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Deck Cards ({fullTrackDeck.length})</span>
            </h4>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--mute)' }}>
              Click any card to jump
            </span>
          </div>

          <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {fullTrackDeck.map((card, idx) => {
              const isCurrent = currentCard?.id === card.id;
              const isMastered = !!masteredIds[card.id];
              const isReview = !!reviewLaterIds[card.id];

              return (
                <motion.button
                  key={card.id}
                  type="button"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    playSoundCue('tap');
                    setFilterMode('all');
                    setActiveIndex(idx);
                    setIsFlipped(false);
                  }}
                  className="w-full rounded-2xl p-3 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isCurrent ? 'var(--pks)' : 'var(--bg)',
                    border: isCurrent
                      ? '2px solid var(--pk)'
                      : '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-7 h-7 rounded-xl font-display font-extrabold text-xs grid place-items-center shrink-0 tabular-nums"
                      style={{
                        backgroundColor: `var(${card.colorVar})`,
                        color: '#2D2D2B',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm truncate">
                        {card.frontTitle}
                      </div>
                      <div
                        className="text-[11px] font-medium truncate"
                        style={{ color: 'var(--mute)' }}
                      >
                        {card.topic} · {card.difficulty}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isMastered ? (
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1"
                        style={{ backgroundColor: 'var(--gr)', color: '#2D2D2B' }}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Mastered
                      </span>
                    ) : isReview ? (
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1"
                        style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
                      >
                        Review
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'var(--mute)' }}
                      >
                        New
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
