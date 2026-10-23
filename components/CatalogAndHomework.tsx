"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder, PanInfo } from "motion/react";
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
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  LayoutGrid,
  ListOrdered,
  Flame,
} from "lucide-react";
import {
  TrackId,
  PRACTICE_SETS,
  PracticeSetItem,
  INITIAL_STUDY_NOTES,
  StudyNoteItem,
  CATALOG_PROGRAMS,
  MENTOR_PROFILES,
  CatalogProgram,
} from "@/lib/study-data";
import {
  FlowerShape,
  StarburstShape,
  ArrowsMotifShape,
  SquiggleBoltShape,
  MentorAvatar,
} from "./BrandMotifs";
import {
  SpringButton,
  ShakeContainer,
  BouncySurface,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from "./PhysicsUI";
import { playSoundCue } from "@/lib/sound-effects";
import { MathText } from "./MathRenderer";

export const HOMEWORK_ORDER_STORAGE_KEY = "learnflow-homework-order";

export function HomeworkAndNotesSection({
  onLaunchTopic,
  onNotify,
}: {
  onLaunchTopic: (track: TrackId, topic: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [subTab, setSubTab] = useState<"quests" | "notes">("quests");
  const [homeworkLayout, setHomeworkLayout] = useState<"grid" | "stack">("grid");
  const [homeworkItems, setHomeworkItems] = useState<PracticeSetItem[]>(PRACTICE_SETS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  const [notes, setNotes] = useState<StudyNoteItem[]>(INITIAL_STUDY_NOTES);
  const [selectedNote, setSelectedNote] = useState<StudyNoteItem | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [noteShakeKey, setNoteShakeKey] = useState(0);

  // Hydrate saved homework priority order from localStorage & listen for Settings resets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadOrder = () => {
      try {
        const raw = localStorage.getItem(HOMEWORK_ORDER_STORAGE_KEY);
        if (!raw) {
          setHomeworkItems(PRACTICE_SETS);
          return;
        }
        const savedIds: string[] = JSON.parse(raw);
        if (Array.isArray(savedIds) && savedIds.length > 0) {
          const map = new Map(PRACTICE_SETS.map((item) => [item.id, item]));
          const ordered: PracticeSetItem[] = [];
          savedIds.forEach((id) => {
            const found = map.get(id);
            if (found) {
              ordered.push(found);
              map.delete(id);
            }
          });
          map.forEach((remaining) => ordered.push(remaining));
          setHomeworkItems(ordered);
        }
      } catch {
        setHomeworkItems(PRACTICE_SETS);
      }
    };

    loadOrder();
    window.addEventListener("learnflow-homework-order-updated", loadOrder);
    return () => window.removeEventListener("learnflow-homework-order-updated", loadOrder);
  }, []);

  const persistHomeworkOrder = useCallback((nextItems: PracticeSetItem[]) => {
    setHomeworkItems(nextItems);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          HOMEWORK_ORDER_STORAGE_KEY,
          JSON.stringify(nextItems.map((i) => i.id)),
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  }, []);

  const moveHomeworkItem = useCallback(
    (fromIndex: number, toIndex: number, announce = true) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= homeworkItems.length ||
        toIndex >= homeworkItems.length
      ) {
        return;
      }
      const updated = [...homeworkItems];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      persistHomeworkOrder(updated);
      playSoundCue("option");
      if (announce) {
        onNotify(`Moved "${moved.title}" to Priority #${toIndex + 1}`);
      }
    },
    [homeworkItems, onNotify, persistHomeworkOrder],
  );

  const handleResetHomeworkOrder = useCallback(() => {
    persistHomeworkOrder(PRACTICE_SETS);
    playSoundCue("tap");
    onNotify("Homework priority order reset to default");
  }, [onNotify, persistHomeworkOrder]);

  // 2D Grid Drag-and-Drop handlers using pointer hit-testing + motion/react layout spring physics
  const handleGridDragStart = useCallback((id: string) => {
    isDraggingRef.current = true;
    setDraggingId(id);
    setDragOverId(null);
    playSoundCue("tap");
  }, []);

  const handleGridDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (typeof document === "undefined" || !draggingId) return;
      const elements = document.elementsFromPoint(info.point.x, info.point.y);
      let foundTargetId: string | null = null;
      for (const el of elements) {
        const cardEl = (el as HTMLElement).closest?.("[data-homework-id]") as HTMLElement | null;
        if (cardEl) {
          const candidateId = cardEl.getAttribute("data-homework-id");
          if (candidateId && candidateId !== draggingId) {
            foundTargetId = candidateId;
            break;
          }
        }
      }
      if (foundTargetId !== dragOverId) {
        setDragOverId(foundTargetId);
      }
    },
    [draggingId, dragOverId],
  );

  const handleGridDragEnd = useCallback(
    (draggedId: string) => {
      if (dragOverId && dragOverId !== draggedId) {
        const fromIdx = homeworkItems.findIndex((i) => i.id === draggedId);
        const toIdx = homeworkItems.findIndex((i) => i.id === dragOverId);
        if (fromIdx !== -1 && toIdx !== -1) {
          moveHomeworkItem(fromIdx, toIdx, true);
        }
      }
      setDraggingId(null);
      setDragOverId(null);
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 140);
    },
    [dragOverId, homeworkItems, moveHomeworkItem],
  );

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      setNoteShakeKey((k) => k + 1);
      onNotify("Add both a title and study note content before saving");
      return;
    }

    const motifs: ("flower" | "burst" | "squiggle")[] = ["flower", "burst", "squiggle"];
    const bgVars: ("--pk" | "--yl" | "--gr" | "--bl")[] = ["--pk", "--yl", "--gr", "--bl"];
    const created: StudyNoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      category: "Personal Note",
      dateLabel: "Saved just now",
      summary: newNoteContent.trim().slice(0, 75) + "...",
      content: newNoteContent.trim(),
      motif: motifs[notes.length % motifs.length],
      bgVar: bgVars[notes.length % bgVars.length],
    };

    setNotes((prev) => [created, ...prev]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setIsCreatingNote(false);
    onNotify("Study note saved to your notebook");
  };

  const isCustomOrder = homeworkItems.some((item, idx) => item.id !== PRACTICE_SETS[idx]?.id);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold">
              Homework & study notes
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1"
              style={{ backgroundColor: "var(--yl)", color: "#2D2D2B" }}
            >
              <GripVertical className="w-3 h-3" />
              <span>Drag to prioritize</span>
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--mute)" }}>
            Drag and drop homework cards to reorder your priority queue, or click any task to launch
            AI drills
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layout & Reset Controls when viewing Homework Quests */}
          {subTab === "quests" && (
            <div className="flex items-center gap-1.5">
              {isCustomOrder && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  transition={SPRING_SNAPPY}
                  onClick={handleResetHomeworkOrder}
                  className="px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                  title="Reset homework priority order"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset order</span>
                </motion.button>
              )}

              <div
                className="inline-flex items-center p-1 rounded-full"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
                role="group"
                aria-label="Homework layout mode"
              >
                <button
                  type="button"
                  onClick={() => {
                    playSoundCue("option");
                    setHomeworkLayout("grid");
                  }}
                  className="px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: homeworkLayout === "grid" ? "#2D2D2B" : "transparent",
                    color: homeworkLayout === "grid" ? "#FFFCF5" : "var(--mute)",
                  }}
                  title="Bento Grid (2D Drag & Swap)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSoundCue("option");
                    setHomeworkLayout("stack");
                  }}
                  className="px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: homeworkLayout === "stack" ? "#2D2D2B" : "transparent",
                    color: homeworkLayout === "stack" ? "#FFFCF5" : "var(--mute)",
                  }}
                  title="Priority List (Live Reorder Stack)"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Queue</span>
                </button>
              </div>
            </div>
          )}

          {/* Segmented Control (Homework / Notes) */}
          <div
            className="inline-flex items-center p-1 rounded-full"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
          >
            {(["quests", "notes"] as const).map((tab) => {
              const active = subTab === tab;
              return (
                <motion.button
                  key={tab}
                  type="button"
                  onClick={() => setSubTab(tab)}
                  whileTap={{ scale: 0.94 }}
                  transition={SPRING_SNAPPY}
                  className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  style={{ color: active ? "#2D2D2B" : "var(--ink)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="homeworkNotesToggle"
                      transition={SPRING_BOUNCY}
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "var(--pk)" }}
                    />
                  )}
                  <span className="relative z-10">
                    {tab === "quests"
                      ? `Homework (${homeworkItems.length})`
                      : `Study notes (${notes.length})`}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === "quests" ? (
          homeworkLayout === "grid" ? (
            <motion.div
              key="quests-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SPRING_SNAPPY}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
            >
              {homeworkItems.map((item, idx) => {
                const isDraggingThis = draggingId === item.id;
                const isDropTarget = dragOverId === item.id && draggingId !== item.id;
                const isTopPriority = idx === 0;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    data-homework-id={item.id}
                    drag
                    dragSnapToOrigin
                    dragElastic={0.18}
                    dragMomentum={false}
                    onDragStart={() => handleGridDragStart(item.id)}
                    onDrag={handleGridDrag}
                    onDragEnd={() => handleGridDragEnd(item.id)}
                    whileHover={isDraggingThis ? undefined : { y: -4, scale: 1.01 }}
                    whileDrag={{
                      scale: 1.05,
                      rotate: -1.5,
                      zIndex: 40,
                      boxShadow: "0 24px 48px rgba(28, 28, 26, 0.24)",
                    }}
                    animate={{
                      scale: isDropTarget ? 1.03 : 1,
                    }}
                    transition={SPRING_BOUNCY}
                    onClick={() => {
                      if (!isDraggingRef.current) {
                        onLaunchTopic(item.track, item.topic);
                      }
                    }}
                    style={{
                      backgroundColor: `var(${item.colorVar})`,
                      color: "#2D2D2B",
                      outline: isDropTarget
                        ? "3px dashed #2D2D2B"
                        : isTopPriority
                          ? "2px solid rgba(45, 45, 43, 0.35)"
                          : "none",
                      outlineOffset: isDropTarget ? "-4px" : "0px",
                      touchAction: "none",
                    }}
                    className="rounded-3xl p-5 min-h-[168px] flex flex-col justify-between cursor-grab active:cursor-grabbing relative overflow-hidden select-none"
                  >
                    {/* Top Row: Priority Badge + Drag Handle & Quick Reorder Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums"
                          style={{
                            backgroundColor: isTopPriority
                              ? "#2D2D2B"
                              : "rgba(255, 252, 245, 0.78)",
                            color: isTopPriority ? "#FFFCF5" : "#2D2D2B",
                          }}
                        >
                          {isTopPriority && <Flame className="w-3 h-3 text-[var(--yl)]" />}
                          <span>
                            #{idx + 1} {isTopPriority ? "Top Priority" : "Priority"}
                          </span>
                        </span>
                        {isDropTarget && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2D2D2B] text-[#FFFCF5]">
                            Drop here
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveHomeworkItem(idx, idx - 1)}
                          className="w-6 h-6 rounded-full grid place-items-center bg-white/55 hover:bg-white/85 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          aria-label={`Move ${item.title} higher in priority`}
                          title="Move priority up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === homeworkItems.length - 1}
                          onClick={() => moveHomeworkItem(idx, idx + 1)}
                          className="w-6 h-6 rounded-full grid place-items-center bg-white/55 hover:bg-white/85 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          aria-label={`Move ${item.title} lower in priority`}
                          title="Move priority down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <span
                          className="w-7 h-7 rounded-full grid place-items-center bg-black/10"
                          title="Drag card to reorder priority"
                        >
                          <GripVertical className="w-4 h-4 opacity-75" />
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Title + Launch Arrow */}
                    <div className="flex items-start justify-between gap-2 pt-2.5">
                      <h4 className="font-display font-extrabold text-xl leading-tight max-w-[85%]">
                        {item.title}
                      </h4>
                      <ArrowUpRight className="w-5 h-5 opacity-75 shrink-0" />
                    </div>

                    {/* Bottom Row: Due Date, Score & Conic Progress Ring */}
                    <div className="flex items-end justify-between gap-2 pt-4">
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
                            <span className="tabular-nums font-bold">
                              Avg score {item.score.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Conic Progress Ring */}
                      <div
                        className="w-8 h-8 rounded-full shrink-0"
                        style={{
                          background: `conic-gradient(#2D2D2B ${item.progress}%, rgba(45,45,43,0.18) 0)`,
                          WebkitMask:
                            "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                        }}
                        aria-label={`${item.progress}% complete`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Live Vertical Priority Stack using Reorder.Group & Reorder.Item from motion/react */
            <Reorder.Group
              key="quests-stack"
              axis="y"
              values={homeworkItems}
              onReorder={(newOrder) => {
                persistHomeworkOrder(newOrder);
              }}
              className="space-y-3"
            >
              {homeworkItems.map((item, idx) => {
                const isTopPriority = idx === 0;
                return (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                      playSoundCue("tap");
                    }}
                    onDragEnd={() => {
                      playSoundCue("option");
                      setTimeout(() => {
                        isDraggingRef.current = false;
                      }, 120);
                    }}
                    whileDrag={{
                      scale: 1.02,
                      rotate: -0.5,
                      boxShadow: "0 22px 44px rgba(28, 28, 26, 0.22)",
                      zIndex: 40,
                    }}
                    transition={SPRING_BOUNCY}
                    style={{
                      backgroundColor: `var(${item.colorVar})`,
                      color: "#2D2D2B",
                    }}
                    className="rounded-3xl p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 cursor-grab active:cursor-grabbing select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-2xl grid place-items-center bg-black/10 shrink-0"
                        title="Drag up or down to reorder priority"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums"
                            style={{
                              backgroundColor: isTopPriority
                                ? "#2D2D2B"
                                : "rgba(255, 252, 245, 0.78)",
                              color: isTopPriority ? "#FFFCF5" : "#2D2D2B",
                            }}
                          >
                            {isTopPriority && <Flame className="w-3 h-3 text-[var(--yl)]" />}
                            <span>
                              Priority #{idx + 1}
                              {isTopPriority ? " · Next Up" : ""}
                            </span>
                          </span>
                          <span className="text-xs font-bold opacity-80 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{item.dueLabel}</span>
                            <span>·</span>
                            <span className="tabular-nums">
                              {item.completedCount}/{item.totalCount} done
                            </span>
                          </span>
                        </div>

                        <h4 className="font-display font-extrabold text-lg sm:text-xl truncate">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <div
                        className="w-8 h-8 rounded-full shrink-0"
                        style={{
                          background: `conic-gradient(#2D2D2B ${item.progress}%, rgba(45,45,43,0.18) 0)`,
                          WebkitMask:
                            "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                        }}
                        aria-label={`${item.progress}% complete`}
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDraggingRef.current) {
                            onLaunchTopic(item.track, item.topic);
                          }
                        }}
                        className="px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 bg-[#2D2D2B] text-[#FFFCF5] cursor-pointer active:scale-95 transition-transform"
                      >
                        <span>Start</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )
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
                    color: "#2D2D2B",
                  }}
                  className="rounded-3xl p-5 min-h-[180px] flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold opacity-75">
                      {note.category} · {note.dateLabel}
                    </span>
                    <div className="-mt-1 -mr-1">
                      {note.motif === "burst" ? (
                        <ArrowsMotifShape className="w-12 h-10" color="#6B7B42" />
                      ) : note.motif === "squiggle" ? (
                        <SquiggleBoltShape
                          className="w-14 h-12"
                          waveColor="#FFB2DD"
                          boltColor="#2D2D2B"
                        />
                      ) : (
                        <FlowerShape className="w-12 h-12" color="#B6CAEB" centerColor="#F7D66E" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <h4 className="font-display font-extrabold text-xl leading-tight">
                      {note.title}
                    </h4>
                    <div className="text-xs font-medium opacity-85 line-clamp-2">
                      <MathText text={note.summary} />
                    </div>
                  </div>
                </BouncySurface>
              ))}
            </div>

            <div className="flex justify-start">
              <SpringButton variant="blue" onClick={() => setIsCreatingNote((v) => !v)}>
                <Plus className="w-4 h-4" />
                <span>{isCreatingNote ? "Close note editor" : "New study note"}</span>
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
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
                  >
                    <h4 className="font-display font-extrabold text-xl">Create new study note</h4>
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="How to remember the unit circle & trig identities..."
                      className="w-full rounded-2xl px-4 py-3 text-base font-semibold focus:outline-2 focus:outline-[var(--pk)]"
                      style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
                    />
                    <textarea
                      rows={4}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Rule 1: Write your key formula, mnemonic, or code pattern..."
                      className="w-full rounded-2xl p-4 text-base focus:outline-2 focus:outline-[var(--pk)]"
                      style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
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
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
                        {selectedNote.category} · {selectedNote.dateLabel}
                      </span>
                      <h4 className="font-display font-extrabold text-2xl mt-0.5">
                        {selectedNote.title}
                      </h4>
                    </div>
                    <SpringButton size="sm" variant="soft" onClick={() => setSelectedNote(null)}>
                      <X className="w-4 h-4" />
                      <span>Close</span>
                    </SpringButton>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap pt-1">
                    <MathText text={selectedNote.content} />
                  </div>
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
  initialSearchQuery = "",
  initialProgramId = "",
}: {
  onStartProgramTrack: (track: TrackId, topic: string) => void;
  onNotify: (msg: string) => void;
  initialSearchQuery?: string;
  initialProgramId?: string;
}) {
  const [catalogMode, setCatalogMode] = useState<"programs" | "mentors">("programs");
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [sortBy, setSortBy] = useState<"rating" | "price">("rating");
  const [selectedProgram, setSelectedProgram] = useState<CatalogProgram | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoShake, setPromoShake] = useState(0);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setSubjectFilter("All");
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialProgramId) {
      const found = CATALOG_PROGRAMS.find((p) => p.id === initialProgramId);
      if (found) {
        setCatalogMode("programs");
        setSelectedProgram(found);
      }
    }
  }, [initialProgramId]);

  const subjects = ["All", "Mathematics", "Computer Science", "Languages"];

  const filteredPrograms = CATALOG_PROGRAMS.filter((p) => {
    const matchesSubj = subjectFilter === "All" || p.subject === subjectFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubj && matchesSearch;
  }).sort((a, b) =>
    sortBy === "rating" ? b.rating - a.rating : a.pricePerLesson - b.pricePerLesson,
  );

  const filteredMentors = MENTOR_PROFILES.filter((m) => {
    const matchesSubj = subjectFilter === "All" || m.subject === subjectFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubj && matchesSearch;
  }).sort((a, b) =>
    sortBy === "rating" ? b.rating - a.rating : a.pricePerLesson - b.pricePerLesson,
  );

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "MATRIC20" || code === "FLOW20" || code.length >= 3) {
      setPromoApplied(true);
      onNotify("Promo code applied: R250 Matric discount unlocked!");
    } else {
      setPromoShake((k) => k + 1);
      onNotify("Enter a valid promo code (e.g. MATRIC20)");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switch (Programs vs Mentors inspired by IMG_5788.jpeg) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold">Curriculum & Mentors</h2>
          <p className="text-sm sm:text-base mt-1" style={{ color: "var(--mute)" }}>
            Structured AI-augmented study programs and expert curriculum coaches
          </p>
        </div>

        <div
          className="inline-flex items-center p-1.5 rounded-full"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
        >
          {(["programs", "mentors"] as const).map((m) => {
            const active = catalogMode === m;
            return (
              <motion.button
                key={m}
                type="button"
                onClick={() => setCatalogMode(m)}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_SNAPPY}
                className="relative px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap"
                style={{ color: active ? "#2D2D2B" : "var(--ink)" }}
              >
                {active && (
                  <motion.span
                    layoutId="catalogModePill"
                    transition={SPRING_BOUNCY}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: "var(--pk)" }}
                  />
                )}
                <span className="relative z-10">
                  {m === "programs" ? "Study Programs" : "AI & Human Coaches"}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Smart Filter Bar inspired by IMG_5784.jpeg */}
      <div
        className="rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-semibold mr-1 flex items-center gap-1"
            style={{ color: "var(--mute)" }}
          >
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
                  backgroundColor: active ? "var(--pk)" : "var(--bg)",
                  color: active ? "#2D2D2B" : "var(--ink)",
                  border: "1px solid var(--line)",
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
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--line)" }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--mute)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trig, algorithms..."
              className="bg-transparent text-base w-full focus:outline-none"
              style={{ color: "var(--ink)" }}
            />
          </div>

          <button
            type="button"
            onClick={() => setSortBy((s) => (s === "rating" ? "price" : "rating"))}
            className="px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            Sort: {sortBy === "rating" ? "Highest Rated" : "Lowest Price"}
          </button>
        </div>
      </div>

      {/* Programs or Mentors Grid */}
      {catalogMode === "programs" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrograms.map((prog) => (
            <BouncySurface
              key={prog.id}
              onClick={() => {
                setSelectedProgram(prog);
                setPromoApplied(false);
              }}
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
              className="rounded-3xl p-6 flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between text-xs font-semibold"
                  style={{ color: "var(--mute)" }}
                >
                  <span>
                    {prog.subject} · {prog.gradeRange} · {prog.goal}
                  </span>
                  <span className="tabular-nums font-bold" style={{ color: "var(--ink)" }}>
                    ★ {prog.rating} ({prog.reviewsCount})
                  </span>
                </div>

                <h3 className="text-2xl font-display font-extrabold leading-tight">{prog.title}</h3>

                <div className="text-sm leading-relaxed" style={{ color: "var(--mute)" }}>
                  <MathText text={prog.description} />
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-3 border-t"
                style={{ borderColor: "var(--line)" }}
              >
                <div>
                  <span className="font-display font-extrabold text-xl tabular-nums">
                    R{prog.pricePerLesson} / lesson
                  </span>
                  <span className="text-xs block" style={{ color: "var(--mute)" }}>
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
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
              className="rounded-3xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <MentorAvatar name={mentor.name} accentVar={mentor.accentColor} size="lg" />
                  <div>
                    <h3 className="font-display font-extrabold text-xl">{mentor.name}</h3>
                    <p className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
                      {mentor.subject} · {mentor.gradeRange}
                    </p>
                    <p className="text-xs font-bold mt-1 tabular-nums">
                      ★ {mentor.rating} ({mentor.reviewsCount} reviews)
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: "var(--mute)" }}>
                  {mentor.bio}
                </p>

                {/* Experience stats inspired by IMG_5788.jpeg */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--line)" }}
                  >
                    <Award className="w-4 h-4 mb-1" style={{ color: "var(--ink)" }} />
                    <div className="font-display font-extrabold text-sm tabular-nums">
                      {mentor.experienceYears} years
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--mute)" }}>
                      Teaching experience
                    </div>
                  </div>
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--line)" }}
                  >
                    <GraduationCap className="w-4 h-4 mb-1" style={{ color: "var(--ink)" }} />
                    <div className="font-display font-extrabold text-sm tabular-nums">
                      &gt;{mentor.studentsCount} students
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--mute)" }}>
                      Completed tracks
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="pt-3 border-t flex items-center justify-between"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="font-display font-extrabold text-lg tabular-nums">
                  from R{mentor.pricePerLesson} / session
                </span>
                <SpringButton
                  size="sm"
                  variant="pink"
                  onClick={() => {
                    const targetTrack: TrackId =
                      mentor.subject === "Computer Science"
                        ? "code"
                        : mentor.subject === "Languages"
                          ? "lang"
                          : "exam";
                    onStartProgramTrack(
                      targetTrack,
                      targetTrack === "code"
                        ? "Two pointers"
                        : targetTrack === "lang"
                          ? "Afrikaans Tye & STOMPI"
                          : "Quadratic & nature of roots",
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
            style={{ backgroundColor: "rgba(45, 45, 43, 0.55)" }}
            onClick={() => setSelectedProgram(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              transition={SPRING_BOUNCY}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
            >
              {/* Colorful Header Banner with Starburst Motif */}
              <div
                className="p-6 relative overflow-hidden"
                style={{ backgroundColor: `var(${selectedProgram.bgVar})`, color: "#2D2D2B" }}
              >
                <StarburstShape
                  className="w-24 h-24 absolute -right-4 -top-4 opacity-80"
                  color="var(--yl)"
                />
                <div className="relative z-10 space-y-2">
                  <div className="text-xs font-bold opacity-80">
                    {selectedProgram.subject} · {selectedProgram.gradeRange} · ★{" "}
                    {selectedProgram.rating}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-extrabold leading-tight">
                    {selectedProgram.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-sm leading-relaxed" style={{ color: "var(--mute)" }}>
                  <MathText text={selectedProgram.description} />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: "var(--mute)" }}>
                    Syllabus & Adaptive Milestones
                  </div>
                  <ul className="space-y-2 text-sm font-medium">
                    {selectedProgram.syllabus.map((mod, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ backgroundColor: "var(--card)" }}
                      >
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span>
                          <MathText text={mod} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Promo code input */}
                <ShakeContainer shakeKey={promoShake}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code (try MATRIC20)"
                      className="flex-1 rounded-full px-4 py-2.5 text-base font-medium focus:outline-2 focus:outline-[var(--pk)]"
                      style={{ backgroundColor: "var(--card)", color: "var(--ink)" }}
                    />
                    <SpringButton size="sm" variant="pink" onClick={handleApplyPromo}>
                      Apply
                    </SpringButton>
                  </div>
                </ShakeContainer>

                <div
                  className="rounded-2xl p-4 space-y-1.5 text-sm"
                  style={{ backgroundColor: "var(--card)" }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: "var(--mute)" }}>Duration</span>
                    <span className="font-semibold tabular-nums">
                      {selectedProgram.lessonsCount} lessons
                    </span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between" style={{ color: "var(--gr)" }}>
                      <span>Promo discount</span>
                      <span className="font-bold tabular-nums">−R250</span>
                    </div>
                  )}
                  <div
                    className="flex justify-between font-display font-extrabold text-lg pt-1 border-t"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span>Total program (ZAR)</span>
                    <span className="tabular-nums">
                      R
                      {promoApplied ? selectedProgram.totalPrice - 250 : selectedProgram.totalPrice}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <SpringButton
                    variant="pink"
                    className="flex-1 justify-center"
                    onClick={() => {
                      const track: TrackId =
                        selectedProgram.subject === "Computer Science"
                          ? "code"
                          : selectedProgram.subject === "Languages"
                            ? "lang"
                            : "exam";
                      setSelectedProgram(null);
                      onStartProgramTrack(
                        track,
                        track === "code"
                          ? "Two pointers"
                          : track === "lang"
                            ? "isiZulu Noun Classes (Amabizo)"
                            : "Quadratic & nature of roots",
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
