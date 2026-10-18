'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  BookOpen,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Award,
} from 'lucide-react';
import {
  TrackId,
  INITIAL_QUESTIONS,
  PRACTICE_SETS,
  INITIAL_FLASHCARDS,
  CATALOG_PROGRAMS,
  MENTOR_PROFILES,
} from '@/lib/study-data';
import { SPRING_SNAPPY, SPRING_BOUNCY } from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';

export type SearchResultCategory = 'topic' | 'flashcard' | 'program' | 'mentor';

export interface GlobalSearchResultItem {
  id: string;
  category: SearchResultCategory;
  title: string;
  subtitle: string;
  badge: string;
  colorVar: '--pk' | '--yl' | '--gr' | '--bl';
  track?: TrackId;
  topic?: string;
  programId?: string;
}

interface GlobalSearchBarProps {
  onSelectTopicPractice: (
    track: TrackId,
    topic: string,
    mode: 'questions' | 'flashcards'
  ) => void;
  onSelectCatalogProgram: (programId: string, searchQuery: string) => void;
  onSelectCatalogSearch: (searchQuery: string) => void;
}

export function GlobalSearchBar({
  onSelectTopicPractice,
  onSelectCatalogProgram,
  onSelectCatalogSearch,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | SearchResultCategory>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Build unified index of all searchable topics, flashcards, curriculum programs, and mentors
  const allSearchItems = useMemo<GlobalSearchResultItem[]>(() => {
    const items: GlobalSearchResultItem[] = [];
    const seenTopics = new Set<string>();

    // 1. Practice Sets & Topics
    PRACTICE_SETS.forEach((ps) => {
      seenTopics.add(`${ps.track}:${ps.topic.toLowerCase()}`);
      items.push({
        id: `ps-${ps.id}`,
        category: 'topic',
        title: ps.title,
        subtitle: `${ps.topic} · ${ps.completedCount}/${ps.totalCount} completed`,
        badge:
          ps.track === 'code'
            ? 'Coding Interview'
            : ps.track === 'lang'
              ? 'Languages'
              : 'Exam Prep',
        colorVar: ps.colorVar,
        track: ps.track,
        topic: ps.topic,
      });
    });

    // Additional curated question topics
    (['exam', 'code', 'lang'] as TrackId[]).forEach((trk) => {
      INITIAL_QUESTIONS[trk].forEach((q) => {
        const key = `${trk}:${q.topic.toLowerCase()}`;
        if (!seenTopics.has(key)) {
          seenTopics.add(key);
          items.push({
            id: `q-${q.id}`,
            category: 'topic',
            title: q.topic,
            subtitle: q.prompt.slice(0, 78) + '...',
            badge: `${q.difficulty} · AI Question`,
            colorVar: trk === 'code' ? '--bl' : trk === 'lang' ? '--yl' : '--pk',
            track: trk,
            topic: q.topic,
          });
        }
      });
    });

    // 2. 3D Flashcards
    (['exam', 'code', 'lang'] as TrackId[]).forEach((trk) => {
      INITIAL_FLASHCARDS[trk].forEach((fc) => {
        items.push({
          id: `fc-${fc.id}`,
          category: 'flashcard',
          title: fc.frontTitle,
          subtitle: `${fc.topic} — ${fc.frontPrompt}`,
          badge: `3D Flashcard · ${fc.difficulty}`,
          colorVar: fc.colorVar,
          track: fc.track,
          topic: fc.topic,
        });
      });
    });

    // 3. Curriculum Programs
    CATALOG_PROGRAMS.forEach((prog) => {
      const derivedTrack: TrackId =
        prog.subject === 'Computer Science'
          ? 'code'
          : prog.subject === 'Languages'
            ? 'lang'
            : 'exam';
      items.push({
        id: `prog-${prog.id}`,
        category: 'program',
        title: prog.title,
        subtitle: `${prog.subject} (${prog.gradeRange}) · ${prog.syllabus.join(', ')}`,
        badge: `Curriculum · ★ ${prog.rating}`,
        colorVar: prog.bgVar,
        track: derivedTrack,
        topic: prog.syllabus[0] || prog.title,
        programId: prog.id,
      });
    });

    // 4. Mentors
    MENTOR_PROFILES.forEach((m) => {
      items.push({
        id: `mentor-${m.id}`,
        category: 'mentor',
        title: m.name,
        subtitle: `${m.role} · ${m.subject} (${m.gradeRange})`,
        badge: `Coach · ★ ${m.rating}`,
        colorVar: m.accentColor,
      });
    });

    return items;
  }, []);

  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return allSearchItems
      .filter((item) => {
        if (activeCategory !== 'all' && item.category !== activeCategory) {
          return false;
        }
        if (!trimmed) return true;
        return (
          item.title.toLowerCase().includes(trimmed) ||
          item.subtitle.toLowerCase().includes(trimmed) ||
          item.badge.toLowerCase().includes(trimmed) ||
          (item.topic && item.topic.toLowerCase().includes(trimmed))
        );
      })
      .slice(0, 8);
  }, [allSearchItems, query, activeCategory]);

  // Reset highlighted index when query or category changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, activeCategory]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K or '/' to focus global search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playSoundCue('option');
        setIsOpen(true);
        inputRef.current?.focus();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTypingInField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (!isTypingInField && e.key === '/') {
        e.preventDefault();
        playSoundCue('option');
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // Click outside to close popover
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectResult = useCallback(
    (item: GlobalSearchResultItem) => {
      playSoundCue('tap');
      setIsOpen(false);
      if (item.category === 'topic' && item.track) {
        onSelectTopicPractice(item.track, item.topic || item.title, 'questions');
      } else if (item.category === 'flashcard' && item.track) {
        onSelectTopicPractice(item.track, item.topic || item.title, 'flashcards');
      } else if (item.category === 'program' && item.programId) {
        onSelectCatalogProgram(item.programId, '');
      } else if (item.category === 'mentor') {
        onSelectCatalogSearch(item.title);
      }
    },
    [onSelectTopicPractice, onSelectCatalogProgram, onSelectCatalogSearch]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      playSoundCue('option');
      setHighlightedIndex((prev) =>
        filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      playSoundCue('option');
      setHighlightedIndex((prev) =>
        filteredResults.length > 0
          ? (prev - 1 + filteredResults.length) % filteredResults.length
          : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredResults[highlightedIndex];
      if (chosen) {
        handleSelectResult(chosen);
      } else if (query.trim()) {
        playSoundCue('tap');
        setIsOpen(false);
        onSelectTopicPractice('exam', query.trim(), 'questions');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const getCategoryIcon = (cat: SearchResultCategory) => {
    switch (cat) {
      case 'topic':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'flashcard':
        return <Layers className="w-3.5 h-3.5" />;
      case 'program':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'mentor':
        return <Award className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs sm:max-w-sm">
      {/* Header Search Input Pill */}
      <motion.div
        animate={{ scale: isOpen ? 1.015 : 1 }}
        transition={SPRING_SNAPPY}
        className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-colors"
        style={{
          backgroundColor: 'var(--card)',
          border: isOpen ? '2px solid var(--pk)' : '1px solid var(--line)',
        }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--mute)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search topics, flashcards, curriculum..."
          aria-label="Global search for topics, flashcards, and curriculum"
          aria-expanded={isOpen}
          className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none truncate"
          style={{ color: 'var(--ink)' }}
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              playSoundCue('tap');
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
            className="p-0.5 rounded-full cursor-pointer"
            style={{ color: 'var(--mute)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd
            onClick={() => {
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md cursor-pointer select-none shrink-0"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--mute)',
              border: '1px solid var(--line)',
            }}
          >
            ⌘K
          </kbd>
        )}
      </motion.div>

      {/* Floating Search Results Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={SPRING_BOUNCY}
            role="listbox"
            aria-label="Search results"
            className="fixed inset-x-4 top-[72px] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2.5 sm:w-[460px] z-50 rounded-3xl p-4 shadow-2xl space-y-3"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              border: '1.5px solid var(--line)',
            }}
          >
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'topic', label: 'Practice Topics' },
                  { id: 'flashcard', label: '3D Flashcards' },
                  { id: 'program', label: 'Curriculum' },
                  { id: 'mentor', label: 'Coaches' },
                ] as const
              ).map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playSoundCue('option');
                      setActiveCategory(cat.id);
                    }}
                    className="relative px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                    style={{ color: active ? '#2D2D2B' : 'var(--mute)' }}
                  >
                    {active && (
                      <motion.span
                        layoutId="globalSearchCategoryPill"
                        transition={SPRING_BOUNCY}
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: 'var(--pk)' }}
                      />
                    )}
                    <span className="relative z-10">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Results List */}
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
              {filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectResult(item)}
                      className="w-full rounded-2xl p-3 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isHighlighted ? 'var(--card)' : 'transparent',
                        border: isHighlighted
                          ? '1px solid var(--pk)'
                          : '1px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                          style={{
                            backgroundColor: `var(${item.colorVar})`,
                            color: '#2D2D2B',
                          }}
                        >
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm truncate">
                            {item.title}
                          </div>
                          <div
                            className="text-[11px] truncate"
                            style={{ color: 'var(--mute)' }}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {item.badge}
                        </span>
                        <ArrowUpRight
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--mute)' }}
                        />
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                <div
                  className="rounded-2xl p-4 text-center text-xs space-y-1"
                  style={{ backgroundColor: 'var(--card)', color: 'var(--mute)' }}
                >
                  <p className="font-bold" style={{ color: 'var(--ink)' }}>
                    No static matches for “{query}”
                  </p>
                  <p>
                    Generate a live AI practice question or 3D flashcard on this exact topic below!
                  </p>
                </div>
              )}
            </div>

            {/* Instant AI Topic Generator Actions when user types a query */}
            {query.trim().length > 0 && (
              <div
                className="pt-2 border-t flex flex-wrap items-center justify-between gap-2"
                style={{ borderColor: 'var(--line)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSoundCue('tap');
                    setIsOpen(false);
                    onSelectTopicPractice('exam', query.trim(), 'questions');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="truncate">AI Question: “{query.trim()}”</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSoundCue('tap');
                    setIsOpen(false);
                    onSelectTopicPractice('code', query.trim(), 'flashcards');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="truncate">3D Flashcard: “{query.trim()}”</span>
                </button>
              </div>
            )}

            {/* Keyboard Hints Footer */}
            <div
              className="flex items-center justify-between text-[10px] font-semibold px-1 pt-0.5"
              style={{ color: 'var(--mute)' }}
            >
              <span>↑↓ to navigate · Enter to launch · Esc to close</span>
              <span>{filteredResults.length} results</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
