'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Check,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ThumbsUp,
  Calendar,
  GraduationCap,
  Award,
  X,
  BookOpen,
} from 'lucide-react';
import {
  TrackId,
  PRACTICE_SETS,
  INITIAL_STUDY_NOTES,
  StudyNoteItem,
  CATALOG_PROGRAMS,
  MENTOR_PROFILES,
  CatalogProgram,
} from '@/lib/study-data';
import {
  FlowerShape,
  StarburstShape,
  ArrowsMotifShape,
  SquiggleBoltShape,
  MentorAvatar,
} from './BrandMotifs';
import {
  SpringButton,
  ShakeContainer,
  BouncySurface,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from './PhysicsUI';

export function HomeworkAndNotesSection({
  onLaunchTopic,
  onNotify,
}: {
  onLaunchTopic: (track: TrackId, topic: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [subTab, setSubTab] = useState<'quests' | 'notes'>('quests');
  const [notes, setNotes] = useState<StudyNoteItem[]>(INITIAL_STUDY_NOTES);
  const [selectedNote, setSelectedNote] = useState<StudyNoteItem | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteShakeKey, setNoteShakeKey] = useState(0);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      setNoteShakeKey((k) => k + 1);
      onNotify('Add both a title and study note content before saving');
      return;
    }

    const motifs: ('flower' | 'burst' | 'squiggle')[] = ['flower', 'burst', 'squiggle'];
    const bgVars: ('--pk' | '--yl' | '--gr' | '--bl')[] = ['--pk', '--yl', '--gr', '--bl'];
    const created: StudyNoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      category: 'Personal Note',
      dateLabel: 'Saved just now',
      summary: newNoteContent.trim().slice(0, 75) + '...',
      content: newNoteContent.trim(),
      motif: motifs[notes.length % motifs.length],
      bgVar: bgVars[notes.length % bgVars.length],
    };

    setNotes((prev) => [created, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsCreatingNote(false);
    onNotify('Study note saved to your notebook');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-display font-extrabold">
            Practice sets & study notes
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mute)' }}>
            Click any practice set to launch adaptive AI drills, or review your study lifehacks
          </p>
        </div>

        {/* Segmented Control inspired by IMG_5787.jpeg (Задания / Заметки) */}
        <div
          className="inline-flex items-center p-1 rounded-full"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          {(['quests', 'notes'] as const).map((tab) => {
            const active = subTab === tab;
            return (
              <motion.button
                key={tab}
                type="button"
                onClick={() => setSubTab(tab)}
                whileTap={{ scale: 0.94 }}
                transition={SPRING_SNAPPY}
                className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                style={{ color: active ? '#2D2D2B' : 'var(--ink)' }}
              >
                {active && (
                  <motion.span
                    layoutId="homeworkNotesToggle"
                    transition={SPRING_BOUNCY}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: 'var(--pk)' }}
                  />
                )}
                <span className="relative z-10">
                  {tab === 'quests' ? 'Practice quests (6)' : `Study notes (${notes.length})`}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'quests' ? (
          <motion.div
            key="quests-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING_SNAPPY}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
          >
            {PRACTICE_SETS.map((item) => (
              <BouncySurface
                key={item.id}
                onClick={() => onLaunchTopic(item.track, item.topic)}
                style={{
                  backgroundColor: `var(${item.colorVar})`,
                  color: '#2D2D2B',
                }}
                className="rounded-3xl p-5 min-h-[148px] flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-extrabold text-xl leading-tight max-w-[80%]">
                    {item.title}
                  </h4>
                  <ArrowUpRight className="w-5 h-5 opacity-70 shrink-0" />
                </div>

                <div className="flex items-end justify-between gap-2 pt-6">
                  <div className="space-y-0.5 text-xs font-semibold opacity-85">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.dueLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {item.completedCount}/{item.totalCount} done
                      </span>
                    </div>
                    {item.score && (
                      <div className="flex items-center gap-1 pt-0.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="tabular-nums font-bold">Avg score {item.score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Conic Progress Ring matching HTML .ring */}
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{
                      background: `conic-gradient(#2D2D2B ${item.progress}%, rgba(45,45,43,0.18) 0)`,
                      WebkitMask:
                        'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
                      mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
                    }}
                    aria-label={`${item.progress}% complete`}
                  />
                </div>
              </BouncySurface>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="notes-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING_SNAPPY}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {notes.map((note) => (
                <BouncySurface
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  style={{
                    backgroundColor: `var(${note.bgVar})`,
                    color: '#2D2D2B',
                  }}
                  className="rounded-3xl p-5 min-h-[180px] flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold opacity-75">
                      {note.category} · {note.dateLabel}
                    </span>
                    <div className="-mt-1 -mr-1">
                      {note.motif === 'burst' ? (
                        <ArrowsMotifShape className="w-12 h-10" color="#6B7B42" />
                      ) : note.motif === 'squiggle' ? (
                        <SquiggleBoltShape className="w-14 h-12" waveColor="#FFB2DD" boltColor="#2D2D2B" />
                      ) : (
                        <FlowerShape className="w-12 h-12" color="#B6CAEB" centerColor="#F7D66E" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <h4 className="font-display font-extrabold text-xl leading-tight">
                      {note.title}
                    </h4>
                    <p className="text-xs font-medium opacity-85 line-clamp-2">
                      {note.summary}
                    </p>
                  </div>
                </BouncySurface>
              ))}
            </div>

            <div className="flex justify-start">
              <SpringButton
                variant="blue"
                onClick={() => setIsCreatingNote((v) => !v)}
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingNote ? 'Close note editor' : 'New study note'}</span>
              </SpringButton>
            </div>

            <AnimatePresence>
              {isCreatingNote && (
                <ShakeContainer shakeKey={noteShakeKey}>
                  <motion.form
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    onSubmit={handleSaveNote}
                    className="rounded-3xl p-6 space-y-4"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                  >
                    <h4 className="font-display font-extrabold text-xl">
                      Create new study note
                    </h4>
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="How to remember the unit circle & trig identities..."
                      className="w-full rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-2 focus:outline-[var(--pk)]"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
                    />
                    <textarea
                      rows={4}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Rule 1: Write your key formula, mnemonic, or code pattern..."
                      className="w-full rounded-2xl p-4 text-sm focus:outline-2 focus:outline-[var(--pk)]"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
                    />
                    <div className="flex gap-2">
                      <SpringButton type="submit" variant="pink">
                        <Check className="w-4 h-4" />
                        <span>Save study note</span>
                      </SpringButton>
                      <SpringButton
                        type="button"
                        variant="soft"
                        onClick={() => setIsCreatingNote(false)}
                      >
                        Cancel
                      </SpringButton>
                    </div>
                  </motion.form>
                </ShakeContainer>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedNote && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-3xl p-6 space-y-3"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--mute)' }}>
                        {selectedNote.category} · {selectedNote.dateLabel}
                      </span>
                      <h4 className="font-display font-extrabold text-2xl mt-0.5">
                        {selectedNote.title}
                      </h4>
                    </div>
                    <SpringButton
                      size="sm"
                      variant="soft"
                      onClick={() => setSelectedNote(null)}
                    >
                      <X className="w-4 h-4" />
                      <span>Close</span>
                    </SpringButton>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap pt-1">
                    {selectedNote.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function CatalogExplorerView({
  onStartProgramTrack,
  onNotify,
  initialSearchQuery = '',
  initialProgramId = '',
}: {
  onStartProgramTrack: (track: TrackId, topic: string) => void;
  onNotify: (msg: string) => void;
  initialSearchQuery?: string;
  initialProgramId?: string;
}) {
  const [catalogMode, setCatalogMode] = useState<'programs' | 'mentors'>('programs');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');
  const [selectedProgram, setSelectedProgram] = useState<CatalogProgram | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoShake, setPromoShake] = useState(0);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setSubjectFilter('All');
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialProgramId) {
      const found = CATALOG_PROGRAMS.find((p) => p.id === initialProgramId);
      if (found) {
        setCatalogMode('programs');
        setSelectedProgram(found);
      }
    }
  }, [initialProgramId]);

  const subjects = ['All', 'Mathematics', 'Computer Science', 'Languages'];

  const filteredPrograms = CATALOG_PROGRAMS.filter((p) => {
    const matchesSubj = subjectFilter === 'All' || p.subject === subjectFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubj && matchesSearch;
  }).sort((a, b) => (sortBy === 'rating' ? b.rating - a.rating : a.pricePerLesson - b.pricePerLesson));

  const filteredMentors = MENTOR_PROFILES.filter((m) => {
    const matchesSubj = subjectFilter === 'All' || m.subject === subjectFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubj && matchesSearch;
  }).sort((a, b) => (sortBy === 'rating' ? b.rating - a.rating : a.pricePerLesson - b.pricePerLesson));

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'FLOW20' || promoCode.trim().length >= 3) {
      setPromoApplied(true);
      onNotify('Promo code applied: $25 discount unlocked!');
    } else {
      setPromoShake((k) => k + 1);
      onNotify('Enter a valid promo code (e.g. FLOW20)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switch (Programs vs Mentors inspired by IMG_5788.jpeg) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold">
            Curriculum & Mentors
          </h2>
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--mute)' }}>
            Structured AI-augmented study programs and expert curriculum coaches
          </p>
        </div>

        <div
          className="inline-flex items-center p-1.5 rounded-full"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          {(['programs', 'mentors'] as const).map((m) => {
            const active = catalogMode === m;
            return (
              <motion.button
                key={m}
                type="button"
                onClick={() => setCatalogMode(m)}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_SNAPPY}
                className="relative px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap"
                style={{ color: active ? '#2D2D2B' : 'var(--ink)' }}
              >
                {active && (
                  <motion.span
                    layoutId="catalogModePill"
                    transition={SPRING_BOUNCY}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: 'var(--pk)' }}
                  />
                )}
                <span className="relative z-10">
                  {m === 'programs' ? 'Study Programs' : 'AI & Human Coaches'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Smart Filter Bar inspired by IMG_5784.jpeg */}
      <div
        className="rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold mr-1 flex items-center gap-1" style={{ color: 'var(--mute)' }}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Subject:
          </span>
          {subjects.map((subj) => {
            const active = subjectFilter === subj;
            return (
              <motion.button
                key={subj}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSubjectFilter(subj)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--pk)' : 'var(--bg)',
                  color: active ? '#2D2D2B' : 'var(--ink)',
                  border: '1px solid var(--line)',
                }}
              >
                {subj}
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-full flex-1 sm:w-56"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--mute)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trig, algorithms..."
              className="bg-transparent text-xs sm:text-sm w-full focus:outline-none"
              style={{ color: 'var(--ink)' }}
            />
          </div>

          <button
            type="button"
            onClick={() => setSortBy((s) => (s === 'rating' ? 'price' : 'rating'))}
            className="px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)' }}
          >
            Sort: {sortBy === 'rating' ? 'Highest Rated' : 'Lowest Price'}
          </button>
        </div>
      </div>

      {/* Programs or Mentors Grid */}
      {catalogMode === 'programs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrograms.map((prog) => (
            <BouncySurface
              key={prog.id}
              onClick={() => {
                setSelectedProgram(prog);
                setPromoApplied(false);
              }}
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
              className="rounded-3xl p-6 flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--mute)' }}>
                  <span>
                    {prog.subject} · {prog.gradeRange} · {prog.goal}
                  </span>
                  <span className="tabular-nums font-bold" style={{ color: 'var(--ink)' }}>
                    ★ {prog.rating} ({prog.reviewsCount})
                  </span>
                </div>

                <h3 className="text-2xl font-display font-extrabold leading-tight">
                  {prog.title}
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
                  {prog.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <span className="font-display font-extrabold text-xl tabular-nums">
                    ${prog.pricePerLesson} / lesson
                  </span>
                  <span className="text-xs block" style={{ color: 'var(--mute)' }}>
                    {prog.lessonsCount} interactive AI + mentor lessons
                  </span>
                </div>

                <SpringButton
                  size="sm"
                  variant="pink"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgram(prog);
                  }}
                >
                  View syllabus
                </SpringButton>
              </div>
            </BouncySurface>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMentors.map((mentor) => (
            <BouncySurface
              key={mentor.id}
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
              className="rounded-3xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <MentorAvatar name={mentor.name} accentVar={mentor.accentColor} size="lg" />
                  <div>
                    <h3 className="font-display font-extrabold text-xl">{mentor.name}</h3>
                    <p className="text-xs font-semibold" style={{ color: 'var(--mute)' }}>
                      {mentor.subject} · {mentor.gradeRange}
                    </p>
                    <p className="text-xs font-bold mt-1 tabular-nums">
                      ★ {mentor.rating} ({mentor.reviewsCount} reviews)
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
                  {mentor.bio}
                </p>

                {/* Experience stats inspired by IMG_5788.jpeg */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                  >
                    <Award className="w-4 h-4 mb-1" style={{ color: 'var(--ink)' }} />
                    <div className="font-display font-extrabold text-sm tabular-nums">
                      {mentor.experienceYears} years
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--mute)' }}>
                      Teaching experience
                    </div>
                  </div>
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                  >
                    <GraduationCap className="w-4 h-4 mb-1" style={{ color: 'var(--ink)' }} />
                    <div className="font-display font-extrabold text-sm tabular-nums">
                      &gt;{mentor.studentsCount} students
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--mute)' }}>
                      Completed tracks
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <span className="font-display font-extrabold text-lg tabular-nums">
                  from ${mentor.pricePerLesson} / session
                </span>
                <SpringButton
                  size="sm"
                  variant="pink"
                  onClick={() => {
                    const targetTrack: TrackId =
                      mentor.subject === 'Computer Science'
                        ? 'code'
                        : mentor.subject === 'Languages'
                          ? 'lang'
                          : 'exam';
                    onStartProgramTrack(
                      targetTrack,
                      targetTrack === 'code'
                        ? 'Two pointers'
                        : targetTrack === 'lang'
                          ? 'Conditionals & Subjunctive'
                          : 'Linear equations'
                    );
                    onNotify(`Started ${mentor.name}’s AI Twin practice track`);
                  }}
                >
                  Practice with AI Twin
                </SpringButton>
              </div>
            </BouncySurface>
          ))}
        </div>
      )}

      {/* Program Detail & Enrollment Modal (Inspired by IMG_5788.jpeg bottom cards) */}
      <AnimatePresence>
        {selectedProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(45, 45, 43, 0.55)' }}
            onClick={() => setSelectedProgram(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              transition={SPRING_BOUNCY}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
            >
              {/* Colorful Header Banner with Starburst Motif */}
              <div
                className="p-6 relative overflow-hidden"
                style={{ backgroundColor: `var(${selectedProgram.bgVar})`, color: '#2D2D2B' }}
              >
                <StarburstShape className="w-24 h-24 absolute -right-4 -top-4 opacity-80" color="var(--yl)" />
                <div className="relative z-10 space-y-2">
                  <div className="text-xs font-bold opacity-80">
                    {selectedProgram.subject} · {selectedProgram.gradeRange} · ★ {selectedProgram.rating}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-extrabold leading-tight">
                    {selectedProgram.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
                  {selectedProgram.description}
                </p>

                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: 'var(--mute)' }}>
                    Syllabus & Adaptive Milestones
                  </div>
                  <ul className="space-y-2 text-sm font-medium">
                    {selectedProgram.syllabus.map((mod, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ backgroundColor: 'var(--card)' }}
                      >
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Promo code input inspired by IMG_5788.jpeg */}
                <ShakeContainer shakeKey={promoShake}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code (try FLOW20)"
                      className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium focus:outline-2 focus:outline-[var(--pk)]"
                      style={{ backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                    />
                    <SpringButton size="sm" variant="pink" onClick={handleApplyPromo}>
                      Apply
                    </SpringButton>
                  </div>
                </ShakeContainer>

                <div
                  className="rounded-2xl p-4 space-y-1.5 text-sm"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--mute)' }}>Duration</span>
                    <span className="font-semibold tabular-nums">{selectedProgram.lessonsCount} lessons</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between" style={{ color: 'var(--gr)' }}>
                      <span>Promo discount</span>
                      <span className="font-bold tabular-nums">−$25</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display font-extrabold text-lg pt-1 border-t" style={{ borderColor: 'var(--line)' }}>
                    <span>Total program</span>
                    <span className="tabular-nums">
                      ${promoApplied ? selectedProgram.totalPrice - 25 : selectedProgram.totalPrice}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <SpringButton
                    variant="pink"
                    className="flex-1 justify-center"
                    onClick={() => {
                      const track: TrackId =
                        selectedProgram.subject === 'Computer Science'
                          ? 'code'
                          : selectedProgram.subject === 'Languages'
                            ? 'lang'
                            : 'exam';
                      setSelectedProgram(null);
                      onStartProgramTrack(
                        track,
                        track === 'code'
                          ? 'Two pointers'
                          : track === 'lang'
                            ? 'Ongoing actions (Llevar + Gerund)'
                            : 'Linear equations'
                      );
                      onNotify(`Enrolled in "${selectedProgram.title}"! Starting Lesson 1.`);
                    }}
                  >
                    Start Program Now
                  </SpringButton>
                  <SpringButton variant="soft" onClick={() => setSelectedProgram(null)}>
                    Close
                  </SpringButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
