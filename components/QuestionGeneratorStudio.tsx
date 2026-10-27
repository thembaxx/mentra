"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
  Send,
  Code2,
  BookOpen,
  Languages,
  Wand2,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Layers,
  Sigma,
  Volume2,
  Square,
} from "lucide-react";
import { TrackId, DifficultyLevel, PracticeQuestion, INITIAL_QUESTIONS } from "@/lib/study-data";
import { assessAnswer } from "@/lib/answer-assessment";
import {
  SpringButton,
  ShakeContainer,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_GENTLE,
} from "./PhysicsUI";
import { playSoundCue } from "@/lib/sound-effects";
import { FlashcardDeckStudio } from "./FlashcardDeckStudio";
import { PomodoroFocusTimer } from "./PomodoroFocusTimer";
import { VoiceDictationBar, InlineVoiceMicButton } from "./VoiceDictationBar";
import { MathText, NSCFormulaSheetModal } from "./MathRenderer";
import { getSuggestedVisualization, InteractiveVisualLab } from "./InteractiveVisualLab";
import { validateVisualization } from "@/lib/visualization-schema";
import { StepVisualJourney } from "./StepVisualJourney";
import { parseTutorStepsIntoCards } from "@/lib/tutor-step-parser";
import { useOpenSourceVoices } from "@/lib/open-source-voices";

const QUICK_TOPICS: Record<TrackId, string[]> = {
  exam: [
    "Quadratic & nature of roots",
    "Financial maths (Annuities)",
    "Calculus & cubic graphs",
    "Physical Sciences (Mechanics & Doppler)",
    "Analytical & Euclidean geometry",
  ],
  code: [
    "Two pointers",
    "Sliding window",
    "Linked lists",
    "Binary tree BFS",
    "Dynamic programming",
  ],
  lang: [
    "isiZulu Noun Classes (Amabizo)",
    "Afrikaans Tye & STOMPI",
    "isiZulu Past & Future Tenses",
    "Afrikaans Voegwoorde (Groups 1, 2 & 3)",
    "Paper 1 Comprehension & Summary",
  ],
};

const DIFFICULTIES: DifficultyLevel[] = ["Easy", "Medium", "Hard", "Adaptive"];

interface QuestionGeneratorStudioProps {
  activeTrack: TrackId;
  onSelectTrack: (t: TrackId) => void;
  isPro: boolean;
  freeLeft: number;
  onConsumeQuota: () => boolean;
  onOpenPaywall: (reason: string) => void;
  onNotify: (msg: string) => void;
  initialTopicFilter?: string;
  initialPracticeMode?: "questions" | "flashcards";
  onQuestionCompleted?: (questionId: string) => void;
}

export function QuestionGeneratorStudio({
  activeTrack,
  onSelectTrack,
  isPro,
  freeLeft,
  onConsumeQuota,
  onOpenPaywall,
  onNotify,
  initialTopicFilter,
  initialPracticeMode = "questions",
  onQuestionCompleted,
}: QuestionGeneratorStudioProps) {
  const [practiceMode, setPracticeMode] = useState<"questions" | "flashcards">(initialPracticeMode);
  const [questionsByTrack, setQuestionsByTrack] =
    useState<Record<TrackId, PracticeQuestion[]>>(INITIAL_QUESTIONS);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Generator controls
  const [customTopic, setCustomTopic] = useState<string>(initialTopicFilter || "");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Medium");
  const [inputFocused, setInputFocused] = useState(false);

  // Streaming & UI states
  const [displayedQuestionText, setDisplayedQuestionText] = useState<string>("");
  const [isStreamingQuestion, setIsStreamingQuestion] = useState<boolean>(false);
  const [isGeneratingFromAI, setIsGeneratingFromAI] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Student response state
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerFocused, setAnswerFocused] = useState<boolean>(false);

  // Grading & step-by-step tutor state
  const [score, setScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>(
    "Select an answer for an answer-key check, or write a response for guided self-review.",
  );
  const [isStreamingFeedback, setIsStreamingFeedback] = useState<boolean>(false);
  const [stepsText, setStepsText] = useState<string>("");
  const [isStreamingSteps, setIsStreamingSteps] = useState<boolean>(false);
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);

  // Follow-up tutor chat state
  const [followUpInput, setFollowUpInput] = useState<string>("");
  const [followUpQuestionAsked, setFollowUpQuestionAsked] = useState<string>("");
  const [followUpAnswer, setFollowUpAnswer] = useState<string>("");
  const [isStreamingFollowUp, setIsStreamingFollowUp] = useState<boolean>(false);

  // Physics shake triggers
  const [topicShakeKey, setTopicShakeKey] = useState<number>(0);
  const [answerShakeKey, setAnswerShakeKey] = useState<number>(0);
  const [tutorShakeKey, setTutorShakeKey] = useState<number>(0);
  const [formulaSheetOpen, setFormulaSheetOpen] = useState<boolean>(false);

  const { activeVoice, speakingVoiceId, speakWithVoice } = useOpenSourceVoices();

  const streamRunIdRef = useRef<number>(0);

  const trackQuestions = questionsByTrack[activeTrack] || INITIAL_QUESTIONS.exam;
  const currentQuestion =
    trackQuestions[questionIndex % trackQuestions.length] || trackQuestions[0];

  const parsedStepCards = useMemo(() => parseTutorStepsIntoCards(stepsText), [stepsText]);

  // A selected step changes the illustration's checkpoint. We map to the
  // displayed parser output, not any untrusted "diagram commands" from AI.
  const focusedStepIndex = parsedStepCards.findIndex((step) => step.id === focusedStepId);
  const activeVisualStepIndex = focusedStepIndex >= 0 ? focusedStepIndex : 0;
  const activeVisualStep = parsedStepCards[activeVisualStepIndex];
  const selectVisualStep = (index: number) => {
    const step = parsedStepCards[index];
    if (step) setFocusedStepId(step.id);
  };

  // Local token streamer for smooth preset transitions
  const streamTextLocally = useCallback(
    async (
      fullText: string,
      setter: React.Dispatch<React.SetStateAction<string>>,
      setStreamingFlag: React.Dispatch<React.SetStateAction<boolean>>,
      runId: number,
      delayMs = 14,
    ) => {
      setStreamingFlag(true);
      setter("");
      const parts = fullText.split(/(\s+)/);
      let acc = "";
      for (const part of parts) {
        if (streamRunIdRef.current !== runId) return;
        acc += part;
        setter(acc);
        await new Promise((r) => setTimeout(r, delayMs + Math.random() * 10));
      }
      if (streamRunIdRef.current === runId) {
        setStreamingFlag(false);
      }
    },
    [],
  );

  // Sync when initialTopicFilter or initialPracticeMode changes from outside
  useEffect(() => {
    if (initialPracticeMode) {
      setPracticeMode(initialPracticeMode);
    }
  }, [initialPracticeMode]);

  useEffect(() => {
    if (initialTopicFilter) {
      setCustomTopic(initialTopicFilter);
      const list = questionsByTrack[activeTrack];
      const matchIdx = list.findIndex(
        (q) => q.topic.toLowerCase() === initialTopicFilter.toLowerCase(),
      );
      if (matchIdx !== -1) {
        setQuestionIndex(matchIdx);
      }
    }
  }, [initialTopicFilter, activeTrack, questionsByTrack]);

  // Stream question text whenever currentQuestion changes
  useEffect(() => {
    const runId = ++streamRunIdRef.current;
    setStreamError(null);
    setScore(null);
    setSelectedOption(null);
    setUserAnswer("");
    setFeedbackText(
      "Select an answer for an answer-key check, or write a response for guided self-review.",
    );
    setIsStreamingFeedback(false);
    setStepsText("");
    setIsStreamingSteps(false);
    setFocusedStepId(null);
    setFollowUpAnswer("");
    setFollowUpQuestionAsked("");

    streamTextLocally(
      currentQuestion.prompt,
      setDisplayedQuestionText,
      setIsStreamingQuestion,
      runId,
      11,
    );
  }, [currentQuestion, streamTextLocally]);

  // Parse streamed AI question response into structured PracticeQuestion
  const parseStreamedQuestion = (
    raw: string,
    topicUsed: string,
    diffUsed: DifficultyLevel,
  ): PracticeQuestion => {
    const qMatch = raw.match(/QUESTION:\s*([\s\S]*?)(?=\nOPTIONS:|\nHINT:|\nSTEPS:|$)/i);
    const optMatch = raw.match(/OPTIONS:\s*([^\n]+)/i);
    const idxMatch = raw.match(/CORRECT_INDEX:\s*(\d+)/i);
    const hintMatch = raw.match(/HINT:\s*([^\n]+)/i);
    // Model suggestions are data, not a part of the teacher's explanation.
    const cleanRaw = raw.split(/\nVISUALIZATION_JSON:/i)[0];
    const stepsMatch = cleanRaw.match(/STEPS:\s*([\s\S]*)$/i);

    const promptText = (qMatch?.[1] || raw).trim();
    const parsedOptions = optMatch?.[1]
      ? optMatch[1]
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const suggestedIdx = idxMatch?.[1] ? parseInt(idxMatch[1], 10) : undefined;
    const correctIdx =
      suggestedIdx !== undefined &&
      parsedOptions &&
      suggestedIdx >= 0 &&
      suggestedIdx < parsedOptions.length
        ? suggestedIdx
        : undefined;
    const hintText = (
      hintMatch?.[1] ||
      `Break the ${topicUsed} problem into smaller invariants and verify with boundary cases.`
    ).trim();
    const stepsContent = (
      stepsMatch?.[1] ||
      `Step 1: Identify the core ${topicUsed} relationship from the prompt.\n\nStep 2: Isolate the target unknown and simplify.\n\nStep 3: Substitute back into the original condition to verify.`
    ).trim();

    const keywords: string[] = [];
    if (parsedOptions && correctIdx !== undefined && parsedOptions[correctIdx]) {
      keywords.push(parsedOptions[correctIdx].toLowerCase());
    }
    const numbersInSteps = stepsContent.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbersInSteps && numbersInSteps.length > 0) {
      keywords.push(numbersInSteps[numbersInSteps.length - 1]);
    }

    return {
      id: `ai-${Date.now()}`,
      track: activeTrack,
      topic: topicUsed,
      difficulty: diffUsed,
      prompt: promptText,
      options: parsedOptions && parsedOptions.length >= 2 ? parsedOptions : undefined,
      correctOptionIndex: correctIdx,
      okKeywords: keywords.length > 0 ? keywords : [topicUsed.toLowerCase().split(" ")[0]],
      partialKeywords: topicUsed
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2),
      hint: hintText,
      steps: stepsContent,
    };
  };

  // Generate a new AI question via server streaming endpoint (/api/tutor)
  const handleStreamNewAIQuestion = async (useCustomTopicOnly = false) => {
    const topicToUse = customTopic.trim() || QUICK_TOPICS[activeTrack][0];

    if (useCustomTopicOnly && !customTopic.trim()) {
      setTopicShakeKey((k) => k + 1);
      onNotify("Enter a custom topic or pick a topic tag first");
      return;
    }

    if (!onConsumeQuota()) {
      return;
    }

    const runId = ++streamRunIdRef.current;
    setStreamError(null);
    setIsGeneratingFromAI(true);
    setIsStreamingQuestion(true);
    setDisplayedQuestionText("");
    setScore(null);
    setSelectedOption(null);
    setUserAnswer("");
    setFeedbackText("Streaming a newly generated AI practice question...");
    setStepsText("");
    setFocusedStepId(null);
    setFollowUpAnswer("");
    setFollowUpQuestionAsked("");

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_question",
          track: activeTrack,
          topic: topicToUse,
          difficulty,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let rawAccumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (streamRunIdRef.current !== runId) {
          reader.cancel();
          return;
        }
        rawAccumulated += decoder.decode(value, { stream: true });

        const livePreview = rawAccumulated
          .replace(/^QUESTION:\s*/i, "")
          .split(/\n(?:OPTIONS|CORRECT_INDEX|HINT|STEPS):/i)[0];
        setDisplayedQuestionText(livePreview.trim());
      }

      if (streamRunIdRef.current !== runId) return;

      const newQuestionObj = parseStreamedQuestion(rawAccumulated, topicToUse, difficulty);
      // An AI model may propose a visual shape, but only the server can
      // validate it against the exact question before it is marked "exact".
      if (activeTrack === "exam") {
        let proposal: unknown = null;
        const match = /\nVISUALIZATION_JSON:\s*(\{[^\n]*\}|null)/i.exec(rawAccumulated);
        if (match) {
          try {
            proposal = JSON.parse(match[1]);
          } catch {
            // Ignore malformed free-form model data.
          }
        }
        try {
          const checked = await fetch("/api/visualization", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              track: activeTrack,
              question: newQuestionObj.prompt,
              candidate: proposal,
            }),
          });
          if (checked.ok) {
            const checkedData: unknown = await checked.json();
            if (checkedData && typeof checkedData === "object" && "visualization" in checkedData) {
              newQuestionObj.visualization = validateVisualization(checkedData.visualization);
            }
          }
        } catch {
          // A failed validation request should not lose the generated question.
        }
      }
      if (streamRunIdRef.current !== runId) return;
      setDisplayedQuestionText(newQuestionObj.prompt);
      setIsStreamingQuestion(false);
      setIsGeneratingFromAI(false);
      setFeedbackText(
        "Select an answer for an answer-key check, or write a response for guided self-review.",
      );

      setQuestionsByTrack((prev) => {
        const updatedTrackList = [...prev[activeTrack], newQuestionObj];
        setQuestionIndex(updatedTrackList.length - 1);
        return {
          ...prev,
          [activeTrack]: updatedTrackList,
        };
      });
      onNotify(`Generated new ${difficulty} question on "${topicToUse}"`);
    } catch (err) {
      if (streamRunIdRef.current !== runId) return;
      setIsStreamingQuestion(false);
      setIsGeneratingFromAI(false);
      setStreamError(
        err instanceof Error
          ? err.message
          : "Connection interrupted while streaming from the AI model.",
      );
      setTopicShakeKey((k) => k + 1);
    }
  };

  // Cycle to next curated question
  const handleNextPresetQuestion = () => {
    if (!onConsumeQuota()) return;
    setStreamError(null);
    setQuestionIndex((prev) => (prev + 1) % trackQuestions.length);
  };

  // Grade student's answer with streaming AI feedback
  const handleGradeAnswer = async () => {
    const trimmed = userAnswer.trim();
    const chosenOptionText =
      selectedOption !== null && currentQuestion.options
        ? currentQuestion.options[selectedOption]
        : "";
    const combinedAnswer = [chosenOptionText, trimmed].filter(Boolean).join(" — ");

    if (combinedAnswer.length < 1) {
      setAnswerShakeKey((k) => k + 1);
      onNotify("Write an answer or select an option first");
      return;
    }

    const runId = ++streamRunIdRef.current;
    setStepsText("");
    setFocusedStepId(null);
    setIsStreamingFeedback(true);
    setFeedbackText("");

    const assessment = assessAnswer(currentQuestion, selectedOption, trimmed);
    setScore(assessment.score);
    const fallbackFeedback = assessment.feedback;
    // Participation and answer correctness are separate. Stable IDs prevent repeat credit.
    onQuestionCompleted?.(currentQuestion.id);
    if (assessment.score !== null) {
      setFeedbackText(assessment.feedback);
      setIsStreamingFeedback(false);
      if (assessment.status === "correct") playSoundCue("grade_success");
      else setTutorShakeKey((k) => k + 1);
      return;
    }

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade_answer",
          track: activeTrack,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
          questionPrompt: currentQuestion.prompt,
          userAnswer: combinedAnswer,
          fallbackText: fallbackFeedback,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Grading stream unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (streamRunIdRef.current !== runId) {
          reader.cancel();
          return;
        }
        acc += decoder.decode(value, { stream: true });

        const cleanedFeedback = acc.replace(/^SCORE:\s*\d+\s*\/\s*10\s*/i, "");
        setFeedbackText(
          "AI feedback · response remains ungraded. " + (cleanedFeedback || "Reviewing reasoning…"),
        );
      }

      if (streamRunIdRef.current === runId) {
        setIsStreamingFeedback(false);
        if (isPro) {
          handleExplainSteps(runId);
        }
      }
    } catch {
      if (streamRunIdRef.current === runId) {
        await streamTextLocally(
          fallbackFeedback.replace(/^SCORE:\s*\d+\s*\/\s*10\s*/i, ""),
          setFeedbackText,
          setIsStreamingFeedback,
          runId,
          16,
        );
        if (isPro) {
          handleExplainSteps(runId);
        }
      }
    }
  };

  // Stream step-by-step explanation (Pro feature)
  const handleExplainSteps = async (existingRunId?: number) => {
    if (!isPro) {
      setTutorShakeKey((k) => k + 1);
      onOpenPaywall(
        "Step-by-step AI explanations and deep follow-up tutoring are part of LearnFlow Pro.",
      );
      return;
    }

    const runId = existingRunId ?? ++streamRunIdRef.current;
    playSoundCue("step_reveal");
    setIsStreamingSteps(true);
    setStepsText("");
    setFocusedStepId(null);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain_steps",
          track: activeTrack,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
          questionPrompt: currentQuestion.prompt,
          fallbackText: currentQuestion.steps,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Step stream error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (streamRunIdRef.current !== runId) {
          reader.cancel();
          return;
        }
        acc += decoder.decode(value, { stream: true });
        setStepsText(acc);
      }
      if (streamRunIdRef.current === runId) {
        setIsStreamingSteps(false);
      }
    } catch {
      if (streamRunIdRef.current === runId) {
        await streamTextLocally(
          currentQuestion.steps,
          setStepsText,
          setIsStreamingSteps,
          runId,
          14,
        );
      }
    }
  };

  // Ask follow-up question to the AI Tutor
  const handleAskFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim()) {
      setTutorShakeKey((k) => k + 1);
      return;
    }
    if (!isPro) {
      setTutorShakeKey((k) => k + 1);
      onOpenPaywall(
        "Interactive follow-up questions with the deep tutor model require LearnFlow Pro.",
      );
      return;
    }

    const questionAsked = followUpInput.trim();
    setFollowUpQuestionAsked(questionAsked);
    setFollowUpInput("");
    const runId = ++streamRunIdRef.current;
    setIsStreamingFollowUp(true);
    setFollowUpAnswer("");

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "follow_up",
          track: activeTrack,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
          questionPrompt: currentQuestion.prompt,
          userAnswer,
          followUpQuestion: questionAsked,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Follow-up failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (streamRunIdRef.current !== runId) {
          reader.cancel();
          return;
        }
        acc += decoder.decode(value, { stream: true });
        setFollowUpAnswer(acc);
      }
      if (streamRunIdRef.current === runId) {
        setIsStreamingFollowUp(false);
      }
    } catch {
      if (streamRunIdRef.current === runId) {
        setIsStreamingFollowUp(false);
        setFollowUpAnswer(
          `To see why this works in "${currentQuestion.topic}", focus on how each step preserves equality while reducing complexity.`,
        );
      }
    }
  };

  const trackMeta: { id: TrackId; label: string; icon: React.ReactNode }[] = [
    { id: "exam", label: "NSC / IEB STEM", icon: <BookOpen className="w-4 h-4" /> },
    { id: "code", label: "Coding & IT", icon: <Code2 className="w-4 h-4" /> },
    { id: "lang", label: "isiZulu & Afrikaans", icon: <Languages className="w-4 h-4" /> },
  ];

  // Split streamed feedback into paragraphs for subtle layout entrance
  const feedbackParagraphs = useMemo(
    () => feedbackText.split(/\n+/).filter(Boolean),
    [feedbackText],
  );

  return (
    <LayoutGroup>
      <div className="space-y-5">
        {/* Track Selector Pills with Physics Layout Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-1.5 p-1.5 rounded-full overflow-x-auto no-scrollbar"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
            role="tablist"
            aria-label="Study tracks"
          >
            {trackMeta.map((t) => {
              const active = activeTrack === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    onSelectTrack(t.id);
                    setQuestionIndex(0);
                    setCustomTopic("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_SNAPPY}
                  className="relative px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 transition-colors"
                  style={{
                    color: active ? "#2D2D2B" : "var(--ink)",
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="activeTrackPill"
                      transition={SPRING_BOUNCY}
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "var(--pk)" }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {t.icon}
                    {t.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Practice Mode Switcher (AI Question Studio vs 3D Flashcards) + Quota Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex items-center p-1 rounded-full"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
              role="tablist"
              aria-label="Practice mode"
            >
              {(
                [
                  { id: "questions", label: "AI Question Studio" },
                  { id: "flashcards", label: "3D Flashcard Deck" },
                ] as const
              ).map((mode) => {
                const isModeActive = practiceMode === mode.id;
                return (
                  <motion.button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={isModeActive}
                    onClick={() => {
                      playSoundCue("option");
                      setPracticeMode(mode.id);
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING_SNAPPY}
                    className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
                    style={{
                      color: isModeActive ? "#2D2D2B" : "var(--ink)",
                    }}
                  >
                    {isModeActive && (
                      <motion.span
                        layoutId="practiceModeSwitchPill"
                        transition={SPRING_BOUNCY}
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: "var(--yl)" }}
                      />
                    )}
                    <span className="relative z-10">{mode.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="text-xs font-medium px-2 py-1" style={{ color: "var(--mute)" }}>
              <span>
                {isPro
                  ? "Pro Active · Unlimited AI Streams"
                  : `${freeLeft} of 5 free AI generations left`}
              </span>
            </div>
          </div>
        </div>

        {/* Pomodoro Focus & Break Interval Timer */}
        <PomodoroFocusTimer
          activeTrackLabel={trackMeta.find((t) => t.id === activeTrack)?.label || "Study"}
          onNotify={onNotify}
          onSprintCompleted={() =>
            onNotify(
              "Focus session complete. Question progress counts reviewed attempts separately.",
            )
          }
        />

        {practiceMode === "flashcards" ? (
          <FlashcardDeckStudio
            activeTrack={activeTrack}
            difficulty={difficulty}
            customTopic={customTopic}
            onChangeCustomTopic={setCustomTopic}
            onConsumeQuota={onConsumeQuota}
            onNotify={onNotify}
            onCardMastered={(cardId) => onQuestionCompleted?.(`card:${cardId}`)}
          />
        ) : (
          <>
            {/* AI Question Generator Control Deck */}
            <ShakeContainer shakeKey={topicShakeKey}>
              <motion.div
                layout
                transition={SPRING_GENTLE}
                className="rounded-3xl p-5 sm:p-6 space-y-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--line)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4" style={{ color: "var(--ink)" }} />
                    <h3 className="text-lg font-display font-extrabold">
                      Dynamic AI Question Generator
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSoundCue("tap");
                        setFormulaSheetOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: "var(--yl)",
                        color: "#2D2D2B",
                      }}
                    >
                      <Sigma className="w-3.5 h-3.5" />
                      <span>NSC STEM Formula Sheet (KaTeX)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  {/* Custom Topic Input with Physics Focus Scale */}
                  <motion.div
                    animate={{
                      scale: inputFocused ? 1.01 : 1,
                    }}
                    transition={SPRING_SNAPPY}
                    className="lg:col-span-6 relative flex items-center rounded-2xl px-4 py-2.5 transition-shadow"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: inputFocused ? "2px solid var(--pk)" : "1px solid var(--line)",
                    }}
                  >
                    <SlidersHorizontal
                      className="w-4 h-4 mr-3 shrink-0"
                      style={{ color: "var(--mute)" }}
                    />
                    <input
                      type="text"
                      value={customTopic}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      onChange={(e) => {
                        setCustomTopic(e.target.value);
                        if (streamError) setStreamError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleStreamNewAIQuestion(false);
                        }
                      }}
                      placeholder={`Enter custom ${
                        activeTrack === "code"
                          ? "algorithm or data structure"
                          : activeTrack === "lang"
                            ? "grammar or vocabulary topic"
                            : "math or exam topic"
                      }...`}
                      aria-label="Custom question topic"
                      className="w-full bg-transparent text-base font-medium focus:outline-none"
                      style={{ color: "var(--ink)" }}
                    />
                    {customTopic && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCustomTopic("")}
                        className="text-xs ml-2 px-2 py-0.5 rounded-full cursor-pointer"
                        style={{ backgroundColor: "var(--card)", color: "var(--mute)" }}
                      >
                        Clear
                      </motion.button>
                    )}
                  </motion.div>

                  {/* Difficulty Segmented Control */}
                  <div
                    className="lg:col-span-4 flex items-center justify-between p-1 rounded-2xl"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--line)" }}
                    role="group"
                    aria-label="Difficulty level"
                  >
                    {DIFFICULTIES.map((lvl) => {
                      const isSelected = difficulty === lvl;
                      return (
                        <motion.button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          whileTap={{ scale: 0.93 }}
                          transition={SPRING_SNAPPY}
                          className="relative flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap text-center"
                          style={{
                            color: isSelected ? "#2D2D2B" : "var(--mute)",
                          }}
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="difficultySegment"
                              transition={SPRING_BOUNCY}
                              className="absolute inset-0 rounded-xl"
                              style={{ backgroundColor: "var(--yl)" }}
                            />
                          )}
                          <span className="relative z-10">{lvl}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Stream AI Question CTA */}
                  <div className="lg:col-span-2 flex">
                    <SpringButton
                      variant="pink"
                      magnetic
                      disabled={isGeneratingFromAI}
                      onClick={() => handleStreamNewAIQuestion(false)}
                      className="w-full justify-center py-3"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isGeneratingFromAI ? "animate-spin" : ""}`}
                      />
                      <span>{isGeneratingFromAI ? "Streaming..." : "Generate"}</span>
                    </SpringButton>
                  </div>
                </div>

                {/* Quick-Pick Topic Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-xs font-semibold shrink-0" style={{ color: "var(--mute)" }}>
                    Topics:
                  </span>
                  {QUICK_TOPICS[activeTrack].map((item) => {
                    const isCurrent =
                      customTopic.toLowerCase() === item.toLowerCase() ||
                      (!customTopic && currentQuestion.topic.toLowerCase() === item.toLowerCase());
                    return (
                      <motion.button
                        key={item}
                        type="button"
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        transition={SPRING_SNAPPY}
                        onClick={() => {
                          setCustomTopic(item);
                          const existingIdx = trackQuestions.findIndex(
                            (q) => q.topic.toLowerCase() === item.toLowerCase(),
                          );
                          if (existingIdx !== -1) {
                            setQuestionIndex(existingIdx);
                          } else {
                            handleStreamNewAIQuestion(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                        style={{
                          backgroundColor: isCurrent ? "var(--bl)" : "var(--bg)",
                          color: isCurrent ? "#2D2D2B" : "var(--ink)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {item}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </ShakeContainer>

            {/* Main 2-Column Practice & AI Tutor Workspace */}
            <motion.div
              layout
              transition={SPRING_GENTLE}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
            >
              {/* Left Column: Question Display + Interactive Answer Area (7 cols) */}
              <motion.div
                layout
                transition={SPRING_GENTLE}
                className="lg:col-span-7 rounded-3xl p-5 sm:p-7 space-y-5 overflow-hidden"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--line)",
                }}
              >
                {/* Numbered Stepper Row (1..N) + Unboxed Metadata */}
                <motion.div
                  layout="position"
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {trackQuestions.map((q, idx) => {
                      const isCurrent = idx === questionIndex % trackQuestions.length;
                      return (
                        <motion.button
                          key={q.id}
                          layout
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          transition={SPRING_BOUNCY}
                          onClick={() => setQuestionIndex(idx)}
                          className="relative w-8 h-9 rounded-xl font-display font-extrabold text-sm flex items-center justify-center cursor-pointer shrink-0 tabular-nums"
                          style={{
                            backgroundColor: isCurrent ? "transparent" : "var(--bg)",
                            color: isCurrent ? "#2D2D2B" : "var(--ink)",
                            border: "1px solid var(--line)",
                          }}
                          aria-label={`Question ${idx + 1}: ${q.topic}`}
                        >
                          {isCurrent && (
                            <motion.span
                              layoutId="activeQuestionNumberBadge"
                              transition={SPRING_BOUNCY}
                              className="absolute inset-0 rounded-xl"
                              style={{ backgroundColor: "var(--pk)" }}
                            />
                          )}
                          <span className="relative z-10">{idx + 1}</span>
                        </motion.button>
                      );
                    })}
                    <motion.button
                      layout
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleStreamNewAIQuestion(false)}
                      className="px-3 h-9 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                      style={{
                        backgroundColor: "var(--yl)",
                        color: "#2D2D2B",
                      }}
                      title="Stream a brand new AI-generated question"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ AI</span>
                    </motion.button>
                  </div>

                  {/* Clean Unboxed Metadata */}
                  <div
                    className="flex items-center gap-2 text-xs font-semibold"
                    style={{ color: "var(--mute)" }}
                  >
                    <span style={{ color: "var(--ink)" }}>{currentQuestion.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span>{currentQuestion.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{isStreamingQuestion ? "Streaming live" : "AI Stream"}</span>
                  </div>
                </motion.div>

                {/* Graceful Error Banner */}
                <AnimatePresence mode="popLayout">
                  {streamError && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={SPRING_SNAPPY}
                      className="rounded-2xl p-4 flex items-center justify-between gap-3"
                      style={{ backgroundColor: "var(--pks)", color: "var(--ink)" }}
                      role="alert"
                    >
                      <div className="flex items-center gap-2.5 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{streamError}</span>
                      </div>
                      <SpringButton
                        size="sm"
                        variant="ink"
                        onClick={() => handleStreamNewAIQuestion(false)}
                      >
                        Retry Stream
                      </SpringButton>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Question Prompt Display Area with Smooth Layout Reflow & Streaming Animation */}
                <motion.div
                  layout
                  transition={SPRING_GENTLE}
                  className="rounded-2xl p-5 min-h-[128px] flex flex-col justify-center relative overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: isStreamingQuestion ? "1.5px solid var(--pk)" : "1px solid var(--line)",
                  }}
                >
                  {/* Subtle top progress shimmer bar while streaming question */}
                  <AnimatePresence>
                    {isStreamingQuestion && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-0 left-0 right-0 h-1 overflow-hidden"
                        style={{ backgroundColor: "var(--pks)" }}
                      >
                        <motion.div
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.15, repeat: Infinity, ease: "linear" }}
                          className="h-full w-1/2 rounded-full"
                          style={{ backgroundColor: "var(--pk)" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isGeneratingFromAI && !displayedQuestionText ? (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 py-2"
                      aria-live="polite"
                    >
                      <div
                        className="flex items-center gap-2 text-xs font-semibold"
                        style={{ color: "var(--mute)" }}
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          Synthesizing adaptive {difficulty.toLowerCase()} question on{" "}
                          {customTopic || currentQuestion.topic}...
                        </span>
                      </div>
                      <div
                        className="h-5 w-4/5 rounded-lg animate-pulse"
                        style={{ backgroundColor: "var(--card)" }}
                      />
                      <div
                        className="h-5 w-3/5 rounded-lg animate-pulse"
                        style={{ backgroundColor: "var(--card)" }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      layout="position"
                      key={currentQuestion.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={SPRING_GENTLE}
                      className={`font-display font-extrabold text-lg sm:text-[22px] leading-[1.35] tracking-tight ${
                        isStreamingQuestion ? "stream-cursor" : ""
                      }`}
                      style={{ color: "var(--ink)" }}
                    >
                      <MathText text={displayedQuestionText} />
                    </motion.div>
                  )}
                </motion.div>

                {/* Exact models use independently checked numbers. Otherwise, explain that
                any available concept explorer is illustrative, never question-specific. */}
                {activeTrack === "exam" &&
                  (currentQuestion.visualization ||
                    getSuggestedVisualization(currentQuestion.topic)) && (
                    <InteractiveVisualLab
                      key={currentQuestion.id}
                      topic={currentQuestion.topic}
                      visualization={currentQuestion.visualization}
                    />
                  )}

                {/* Interactive Multiple Choice Options */}
                <AnimatePresence mode="popLayout">
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={SPRING_GENTLE}
                      className="space-y-2"
                    >
                      <div
                        className="flex items-center justify-between text-xs font-semibold"
                        style={{ color: "var(--mute)" }}
                      >
                        <span>Quick-select an option or write your full work below</span>
                        {selectedOption !== null && (
                          <button
                            type="button"
                            onClick={() => setSelectedOption(null)}
                            className="underline cursor-pointer"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentQuestion.options.map((opt, idx) => {
                          const isPicked = selectedOption === idx;
                          return (
                            <motion.button
                              layout
                              key={`${currentQuestion.id}-opt-${idx}`}
                              type="button"
                              whileHover={{ y: -2, scale: 1.01 }}
                              whileTap={{ scale: 0.97 }}
                              transition={SPRING_SNAPPY}
                              onClick={() => {
                                playSoundCue("option");
                                setSelectedOption(idx);
                                if (!userAnswer.trim()) {
                                  setUserAnswer(opt);
                                }
                              }}
                              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl text-left text-sm font-semibold cursor-pointer transition-colors"
                              style={{
                                backgroundColor: isPicked ? "var(--pks)" : "var(--bg)",
                                color: "var(--ink)",
                                border: isPicked ? "2px solid var(--pk)" : "1px solid var(--line)",
                              }}
                            >
                              <span className="leading-snug">
                                <MathText text={opt} />
                              </span>
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  border: isPicked
                                    ? "5px solid var(--pk)"
                                    : "1.5px solid var(--mute)",
                                  backgroundColor: isPicked ? "#2D2D2B" : "transparent",
                                }}
                              />
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Open Reasoning / Code Input Box with Physics Shake on Empty Error */}
                <motion.div layout="position" transition={SPRING_GENTLE}>
                  <ShakeContainer shakeKey={answerShakeKey} className="space-y-2">
                    <div
                      className="flex items-center justify-between text-xs font-semibold"
                      style={{ color: "var(--mute)" }}
                    >
                      <label htmlFor="student-answer-textarea">
                        {activeTrack === "code"
                          ? "Your algorithm explanation or TypeScript / Python solution"
                          : "Your answer & step-by-step reasoning"}
                      </label>
                      {activeTrack === "code" && currentQuestion.starterCode && (
                        <button
                          type="button"
                          onClick={() => setUserAnswer(currentQuestion.starterCode || "")}
                          className="underline cursor-pointer hover:opacity-80"
                          style={{ color: "var(--ink)" }}
                        >
                          Load starter code template
                        </button>
                      )}
                    </div>

                    {/* Voice-to-Text Verbal Reasoning & Open-Source Voice Interface */}
                    <VoiceDictationBar
                      activeTrack={activeTrack}
                      topic={currentQuestion.topic}
                      questionPrompt={currentQuestion.prompt}
                      currentAnswer={userAnswer}
                      onAppendTranscript={(spokenText) => {
                        setUserAnswer((prev) =>
                          prev.trim() ? `${prev.trim()} ${spokenText}` : spokenText,
                        );
                      }}
                      onTriggerGrade={handleGradeAnswer}
                      onNotify={onNotify}
                    />

                    <motion.div
                      animate={{
                        scale: answerFocused ? 1.008 : 1,
                      }}
                      transition={SPRING_SNAPPY}
                      className="rounded-2xl overflow-hidden transition-shadow"
                      style={{
                        backgroundColor: "var(--bg)",
                        border: answerFocused ? "2px solid var(--bl)" : "1px solid var(--line)",
                      }}
                    >
                      <textarea
                        id="student-answer-textarea"
                        rows={5}
                        value={userAnswer}
                        onFocus={() => setAnswerFocused(true)}
                        onBlur={() => setAnswerFocused(false)}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder={
                          activeTrack === "code"
                            ? "Explain your two-pointer / hash map invariant or write code here..."
                            : activeTrack === "lang"
                              ? "Type your isiZulu / Afrikaans sentence or grammar explanation..."
                              : "Show your algebraic steps, KaTeX formula, or final numeric answer..."
                        }
                        className={`w-full p-4 bg-transparent focus:outline-none resize-y text-base leading-relaxed ${
                          activeTrack === "code" ? "font-mono-code" : ""
                        }`}
                        style={{ color: "var(--ink)" }}
                      />
                    </motion.div>
                  </ShakeContainer>
                </motion.div>

                {/* Action Buttons Row */}
                <motion.div
                  layout="position"
                  transition={SPRING_GENTLE}
                  className="flex flex-wrap items-center justify-between gap-3 pt-1"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <SpringButton
                      variant="pink"
                      magnetic
                      onClick={handleGradeAnswer}
                      disabled={isStreamingFeedback}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isStreamingFeedback ? "Grading..." : "Grade my answer"}</span>
                    </SpringButton>

                    <SpringButton variant="soft" onClick={handleNextPresetQuestion}>
                      <span>Next question</span>
                      <ChevronRight className="w-4 h-4" />
                    </SpringButton>
                  </div>

                  <SpringButton
                    variant="card"
                    size="sm"
                    onClick={() => handleStreamNewAIQuestion(false)}
                    disabled={isGeneratingFromAI}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fresh AI variant</span>
                  </SpringButton>
                </motion.div>
              </motion.div>

              {/* Right Column: Dark Ink AI Tutor & Step-by-Step Streaming Deck (5 cols) */}
              <ShakeContainer shakeKey={tutorShakeKey} className="lg:col-span-5">
                <motion.div
                  layout
                  transition={SPRING_GENTLE}
                  className="rounded-3xl p-6 space-y-5 overflow-hidden"
                  style={{
                    backgroundColor: "#2D2D2B",
                    color: "#F8F3E7",
                    border: "1px solid var(--line)",
                  }}
                >
                  {/* Header with Animated Conic Score Ring */}
                  <motion.div layout="position" className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <motion.div
                        key={score ?? "ungraded"}
                        initial={{ scale: 0.85, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={SPRING_BOUNCY}
                        className="w-16 h-16 rounded-full grid place-items-center shrink-0"
                        style={{
                          background: `conic-gradient(var(--pk) ${(score ?? 0) * 10}%, #454542 0)`,
                        }}
                      >
                        <span
                          className="w-12 h-12 rounded-full grid place-items-center font-display font-extrabold text-xl tabular-nums"
                          style={{ backgroundColor: "#2D2D2B", color: "#F8F3E7" }}
                        >
                          {score !== null ? score : "–"}
                        </span>
                      </motion.div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-extrabold text-lg">
                            LearnFlow AI Tutor
                          </h4>
                        </div>
                        <p className="text-xs" style={{ color: "#B9B6AA" }}>
                          {isPro
                            ? `Deep model · Voice: ${activeVoice.name.split(" ")[0]}`
                            : `Fast grader · Voice: ${activeVoice.name.split(" ")[0]}`}
                        </p>
                      </div>
                    </div>

                    {/* Read Tutor Explanation Aloud + Semantic Status Indicator */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const textToRead = [feedbackText, stepsText].filter(Boolean).join(". ");
                          speakWithVoice(activeVoice, textToRead);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor:
                            speakingVoiceId === activeVoice.id
                              ? "var(--pk)"
                              : "rgba(255, 252, 245, 0.1)",
                          color: speakingVoiceId === activeVoice.id ? "#2D2D2B" : "#F8F3E7",
                        }}
                        title={`Listen to AI Tutor with ${activeVoice.name}`}
                      >
                        {speakingVoiceId === activeVoice.id ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <AnimatePresence mode="popLayout">
                        {score !== null && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={SPRING_BOUNCY}
                            className="text-right text-xs font-semibold"
                          >
                            {score >= 9 ? (
                              <span
                                className="inline-flex items-center gap-1"
                                style={{ color: "var(--yl)" }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Mastered
                              </span>
                            ) : score >= 6 ? (
                              <span
                                className="inline-flex items-center gap-1"
                                style={{ color: "var(--bl)" }}
                              >
                                <HelpCircle className="w-4 h-4" />
                                Partial
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1"
                                style={{ color: "var(--pk)" }}
                              >
                                <AlertCircle className="w-4 h-4" />
                                Review
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Streaming Instant Feedback Box with Smooth Layout Reflow & KaTeX */}
                  <motion.div
                    layout
                    transition={SPRING_GENTLE}
                    className="rounded-2xl p-4 text-sm leading-relaxed min-h-[76px] space-y-2 overflow-hidden"
                    style={{
                      backgroundColor: "rgba(255, 252, 245, 0.06)",
                      border: isStreamingFeedback
                        ? "1px solid rgba(255, 178, 221, 0.45)"
                        : "1px solid transparent",
                    }}
                  >
                    {feedbackParagraphs.map((para, idx) => {
                      const isLastPara = idx === feedbackParagraphs.length - 1;
                      return (
                        <motion.div
                          layout="position"
                          key={idx}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={SPRING_GENTLE}
                          className={isStreamingFeedback && isLastPara ? "stream-cursor" : ""}
                        >
                          <MathText text={para} />
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Step-by-Step Explanation Action Button & Staggered Layout Step Cards */}
                  <motion.div layout transition={SPRING_GENTLE} className="space-y-3">
                    <SpringButton
                      variant="blue"
                      onClick={() => handleExplainSteps()}
                      disabled={isStreamingSteps}
                      className="w-full justify-between px-5 py-3.5"
                    >
                      <span className="font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>
                          {isStreamingSteps
                            ? "Streaming step-by-step derivation..."
                            : "Explain step by step"}
                        </span>
                      </span>
                      {!isPro ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold"
                          style={{ backgroundColor: "var(--yl)", color: "#2D2D2B" }}
                        >
                          PRO
                        </span>
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </SpringButton>

                    {/* Animated Step-by-Step Concept Cards */}
                    <AnimatePresence mode="popLayout">
                      {(parsedStepCards.length > 0 || isStreamingSteps) && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={SPRING_GENTLE}
                          className="space-y-2.5 pt-1"
                        >
                          <div className="flex items-center justify-between text-xs font-bold px-1">
                            <span style={{ color: "var(--yl)" }}>
                              Step-by-Step Concept Breakdown
                            </span>
                            <span style={{ color: "#B9B6AA" }}>
                              {isStreamingSteps
                                ? "Streaming steps..."
                                : `${parsedStepCards.length} steps · Click any step to focus`}
                            </span>
                          </div>

                          {activeTrack === "exam" &&
                            currentQuestion.visualization &&
                            parsedStepCards.length > 0 && (
                              <StepVisualJourney
                                model={currentQuestion.visualization}
                                stepIndex={activeVisualStepIndex}
                                stepCount={parsedStepCards.length}
                                isVerification={activeVisualStep?.isVerification ?? false}
                                onSelectStep={selectVisualStep}
                              />
                            )}

                          {parsedStepCards.length === 0 && isStreamingSteps ? (
                            <motion.div
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="rounded-2xl p-4 text-xs font-medium flex items-center gap-2"
                              style={{
                                backgroundColor: "rgba(182, 202, 235, 0.1)",
                                color: "#B9B6AA",
                              }}
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Deconstructing problem into logical steps...</span>
                            </motion.div>
                          ) : (
                            parsedStepCards.map((stepCard, sIdx) => {
                              const isLastStep = sIdx === parsedStepCards.length - 1;
                              const isFocused =
                                focusedStepId === stepCard.id ||
                                (focusedStepIndex < 0 && sIdx === 0);

                              return (
                                <motion.div
                                  layout
                                  key={stepCard.id}
                                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.96 }}
                                  transition={{
                                    ...SPRING_SNAPPY,
                                    delay: isStreamingSteps ? 0 : sIdx * 0.04,
                                  }}
                                  onClick={() => setFocusedStepId(stepCard.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      setFocusedStepId(stepCard.id);
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  aria-current={isFocused ? "step" : undefined}
                                  aria-label={
                                    stepCard.title + ": show corresponding visual checkpoint"
                                  }
                                  className="relative rounded-2xl p-4 cursor-pointer overflow-hidden transition-colors focus-visible:outline-3 focus-visible:outline-[var(--yl)] focus-visible:outline-offset-2"
                                  style={{
                                    backgroundColor: stepCard.isVerification
                                      ? "rgba(154, 171, 101, 0.16)"
                                      : "rgba(182, 202, 235, 0.11)",
                                    border: stepCard.isVerification
                                      ? "1px solid rgba(154, 171, 101, 0.38)"
                                      : "1px solid rgba(182, 202, 235, 0.24)",
                                  }}
                                >
                                  {isFocused && (
                                    <motion.span
                                      layoutId="focusedStepOutline"
                                      transition={SPRING_BOUNCY}
                                      className="absolute inset-0 rounded-2xl pointer-events-none"
                                      style={{
                                        border: "2px solid var(--yl)",
                                        backgroundColor: "rgba(247, 214, 110, 0.06)",
                                      }}
                                    />
                                  )}

                                  <motion.div
                                    layout="position"
                                    className="relative z-10 flex items-start gap-3"
                                  >
                                    <span
                                      className="w-7 h-7 rounded-lg font-display font-extrabold text-xs grid place-items-center shrink-0 mt-0.5 tabular-nums"
                                      style={{
                                        backgroundColor: stepCard.isVerification
                                          ? "var(--gr)"
                                          : "var(--yl)",
                                        color: "#2D2D2B",
                                      }}
                                    >
                                      {stepCard.badge}
                                    </span>

                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div
                                        className="text-xs font-extrabold tracking-tight"
                                        style={{
                                          color: stepCard.isVerification
                                            ? "var(--gr)"
                                            : "var(--yl)",
                                        }}
                                      >
                                        {stepCard.title}
                                      </div>
                                      <div
                                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                          isStreamingSteps && isLastStep ? "stream-cursor" : ""
                                        }`}
                                        style={{ color: "#F8F3E7" }}
                                      >
                                        <MathText text={stepCard.body} />
                                      </div>
                                    </div>
                                  </motion.div>
                                </motion.div>
                              );
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Interactive Follow-Up Tutor Question Input */}
                  <motion.div
                    layout="position"
                    transition={SPRING_GENTLE}
                    className="pt-2 border-t border-white/10 space-y-3"
                  >
                    <form onSubmit={handleAskFollowUp} className="flex items-center gap-2">
                      <InlineVoiceMicButton
                        activeTrack={activeTrack}
                        onTranscript={(spoken) =>
                          setFollowUpInput((prev) =>
                            prev.trim() ? `${prev.trim()} ${spoken}` : spoken,
                          )
                        }
                        onNotify={onNotify}
                      />
                      <input
                        type="text"
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        placeholder="Speak or type a follow-up about any step..."
                        aria-label="Ask a follow-up question to the AI tutor"
                        className="flex-1 rounded-full px-4 py-2.5 text-base bg-white/10 text-white placeholder:text-white/45 focus:outline-2 focus:outline-[var(--bl)]"
                      />
                      <SpringButton
                        type="submit"
                        size="sm"
                        variant="yellow"
                        disabled={isStreamingFollowUp}
                        className="px-3.5 py-2.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Ask</span>
                      </SpringButton>
                    </form>

                    <AnimatePresence mode="popLayout">
                      {(followUpAnswer || isStreamingFollowUp) && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          transition={SPRING_GENTLE}
                          className="rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed space-y-1.5 overflow-hidden"
                          style={{
                            backgroundColor: "rgba(247, 214, 110, 0.12)",
                            border: "1px solid rgba(247, 214, 110, 0.25)",
                            color: "#F8F3E7",
                          }}
                        >
                          {followUpQuestionAsked && (
                            <div className="text-[11px] font-bold" style={{ color: "var(--yl)" }}>
                              You asked: “{followUpQuestionAsked}”
                            </div>
                          )}
                          <motion.div
                            layout="position"
                            className={isStreamingFollowUp ? "stream-cursor" : ""}
                          >
                            <MathText text={followUpAnswer || "Thinking..."} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </ShakeContainer>
            </motion.div>
          </>
        )}

        {/* NSC / IEB Grade 12 STEM Formula Sheet Modal */}
        <NSCFormulaSheetModal
          open={formulaSheetOpen}
          onClose={() => setFormulaSheetOpen(false)}
          onInsertFormula={(plainFormula) => {
            setUserAnswer((prev) =>
              prev.trim() ? `${prev.trim()}\n${plainFormula}` : plainFormula,
            );
          }}
          onSelectTopic={(topic) => {
            if (activeTrack !== "exam") {
              onSelectTrack("exam");
            }
            setCustomTopic(topic);
            const existingIdx = questionsByTrack.exam.findIndex(
              (q) => q.topic.toLowerCase() === topic.toLowerCase(),
            );
            if (existingIdx !== -1) {
              setQuestionIndex(existingIdx);
            }
          }}
          onNotify={onNotify}
        />
      </div>
    </LayoutGroup>
  );
}
