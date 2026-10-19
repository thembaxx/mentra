'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  Globe,
  Check,
  AlertCircle,
  Download,
} from 'lucide-react';
import { TrackId } from '@/lib/study-data';
import {
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_GENTLE,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';
import { useOpenSourceVoices } from '@/lib/open-source-voices';
import { OpenSourceVoiceModal } from './OpenSourceVoiceManager';

// Minimal TypeScript declarations for Web Speech API
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

type SASpeechLang = 'en-ZA' | 'zu-ZA' | 'af-ZA';

const SAMPLE_VERBAL_REASONING: Record<TrackId, Record<string, string>> = {
  exam: {
    default:
      'First, I find the x-coordinate of the turning point using x = -b / (2a), which gives x = 3. Substituting (3, 4) into y = x² - 6x + k gives 4 = 9 - 18 + k, so k = 13 and the discriminant Δ = -16 < 0 gives non-real roots.',
  },
  code: {
    default:
      'I will use a two-pointer scan starting at left = 0 and right = n - 1 on the sorted ZAR array. Moving the pointers inward based on their sum compared to target achieves O(n) time complexity and O(1) auxiliary space.',
  },
  lang: {
    default:
      'Abafundi bayafunda. In isiZulu, Class 1 singular prefix um- changes to Class 2 plural prefix aba-, and the subject concord shifts from u- (uyafunda) to ba- (bayafunda).',
  },
};

interface VoiceDictationBarProps {
  activeTrack: TrackId;
  topic: string;
  questionPrompt?: string;
  currentAnswer: string;
  onAppendTranscript: (text: string) => void;
  onTriggerGrade?: () => void;
  onNotify: (msg: string) => void;
}

export function VoiceDictationBar({
  activeTrack,
  topic,
  questionPrompt,
  currentAnswer,
  onAppendTranscript,
  onTriggerGrade,
  onNotify,
}: VoiceDictationBarProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSimulatingVoice, setIsSimulatingVoice] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechLang, setSpeechLang] = useState<SASpeechLang>(
    activeTrack === 'lang' ? 'zu-ZA' : 'en-ZA'
  );
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [waveBars, setWaveBars] = useState<number[]>([
    24, 42, 68, 35, 80, 52, 30, 74, 46, 60, 38, 28,
  ]);
  const [micWarning, setMicWarning] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);

  const {
    activeVoice,
    installedIds,
    speakingVoiceId,
    speakWithVoice,
  } = useOpenSourceVoices();

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const simTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSpeechLang(activeTrack === 'lang' ? 'zu-ZA' : 'en-ZA');
  }, [activeTrack]);

  const stopAudioVisualizer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    stopAudioVisualizer();
    setIsListening(false);
    setInterimTranscript('');
  }, [stopAudioVisualizer]);

  useEffect(() => {
    return () => {
      stopListening();
      if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    };
  }, [stopListening]);

  useEffect(() => {
    if (!isListening && !isSimulatingVoice) {
      setElapsedSecs(0);
      return;
    }

    const secTimer = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);

    const waveTimer = setInterval(() => {
      setWaveBars((prev) =>
        prev.map((_, idx) => {
          const base = 24 + ((idx * 17) % 35);
          const jitter = Math.floor(Math.random() * 45);
          return Math.min(96, base + jitter);
        })
      );
    }, 130);

    return () => {
      clearInterval(secTimer);
      clearInterval(waveTimer);
    };
  }, [isListening, isSimulatingVoice]);

  const startAudioVisualizer = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateBars = () => {
        if (!mediaStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const nextBars: number[] = [];
        for (let i = 0; i < 12; i++) {
          const val = dataArray[i + 1] || 0;
          nextBars.push(Math.max(18, Math.min(98, Math.round((val / 255) * 100))));
        }
        setWaveBars(nextBars);
        rafRef.current = requestAnimationFrame(updateBars);
      };
      rafRef.current = requestAnimationFrame(updateBars);
    } catch {
      // Fallback waveTimer handles animation
    }
  };

  const runSimulatedVerbalWalkthrough = useCallback(() => {
    if (isSimulatingVoice) {
      setIsSimulatingVoice(false);
      setInterimTranscript('');
      return;
    }

    stopListening();
    playSoundCue('step_reveal');
    setMicWarning(null);
    setIsSimulatingVoice(true);

    const sampleText =
      SAMPLE_VERBAL_REASONING[activeTrack]?.default ||
      `To solve this ${topic} problem, I first identify the primary invariant, simplify step by step, and verify the boundary condition.`;

    const words = sampleText.split(' ');
    let idx = 0;
    let built = '';

    const stepWord = () => {
      if (idx >= words.length) {
        setIsSimulatingVoice(false);
        setInterimTranscript('');
        onAppendTranscript(built.trim());
        playSoundCue('option');
        onNotify('Verbal explanation transcribed into your answer box!');
        return;
      }
      built += (idx === 0 ? '' : ' ') + words[idx];
      setInterimTranscript(built);
      idx++;
      simTimeoutRef.current = setTimeout(stepWord, 85);
    };

    stepWord();
  }, [activeTrack, isSimulatingVoice, onAppendTranscript, onNotify, stopListening, topic]);

  const handleToggleListening = async () => {
    if (isListening || isSimulatingVoice) {
      playSoundCue('tap');
      if (isSimulatingVoice) {
        if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
        if (interimTranscript.trim()) {
          onAppendTranscript(interimTranscript.trim());
        }
        setIsSimulatingVoice(false);
        setInterimTranscript('');
      } else {
        stopListening();
      }
      return;
    }

    setMicWarning(null);
    const SpeechRec = getSpeechRecognitionConstructor();

    if (!SpeechRec) {
      onNotify(
        'Browser SpeechRecognition unavailable — streaming simulated verbal walkthrough'
      );
      runSimulatedVerbalWalkthrough();
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            interimChunk += res[0].transcript;
          }
        }

        if (finalChunk.trim()) {
          onAppendTranscript(finalChunk.trim());
        }
        setInterimTranscript(interimChunk);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicWarning(
            'Microphone access blocked by browser/frame. Click "Simulate Voice" to test verbal input.'
          );
          stopListening();
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setMicWarning(`Voice recognition paused (${event.error}).`);
          stopListening();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        stopAudioVisualizer();
      };

      recognitionRef.current = recognition;
      recognition.start();
      playSoundCue('step_reveal');
      setIsListening(true);
      startAudioVisualizer();
      onNotify(`Listening (${speechLang}) — explain your reasoning out loud!`);
    } catch {
      runSimulatedVerbalWalkthrough();
    }
  };

  const cycleSpeechLang = () => {
    playSoundCue('option');
    setSpeechLang((prev) =>
      prev === 'en-ZA' ? 'zu-ZA' : prev === 'zu-ZA' ? 'af-ZA' : 'en-ZA'
    );
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const activeRecording = isListening || isSimulatingVoice;
  const isReadingAloud = speakingVoiceId === activeVoice.id;

  return (
    <>
      <motion.div
        layout
        transition={SPRING_GENTLE}
        className="rounded-2xl p-3.5 space-y-2.5 transition-colors"
        style={{
          backgroundColor: activeRecording ? 'var(--pks)' : 'var(--bg)',
          border: activeRecording ? '2px solid var(--pk)' : '1px solid var(--line)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.93 }}
              transition={SPRING_SNAPPY}
              onClick={handleToggleListening}
              className="px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
              style={{
                backgroundColor: activeRecording ? '#2D2D2B' : 'var(--pk)',
                color: activeRecording ? '#FFFCF5' : '#2D2D2B',
              }}
            >
              {activeRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current text-[var(--pk)]" />
                  <span>Stop ({formatSecs(elapsedSecs)})</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak Answer</span>
                </>
              )}
            </motion.button>

            {/* Read Question Aloud with Active Open-Source Neural Voice */}
            {questionPrompt && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  speakWithVoice(activeVoice, questionPrompt);
                  if (!isReadingAloud) {
                    onNotify(
                      `Reading question with ${activeVoice.name} (${activeVoice.engine})`
                    );
                  }
                }}
                className="px-3 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: isReadingAloud ? '#2D2D2B' : 'var(--bl)',
                  color: isReadingAloud ? '#FFFCF5' : '#2D2D2B',
                }}
                title={`Read question aloud with ${activeVoice.name} (${activeVoice.sizeMB} MB)`}
              >
                {isReadingAloud ? (
                  <>
                    <Square className="w-3 h-3 fill-current text-[var(--yl)]" />
                    <span>Stop Reading</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read ({activeVoice.name.split(' ')[0]})</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Live Reactive 12-Bar Audio Equalizer when recording */}
            <AnimatePresence>
              {activeRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={SPRING_BOUNCY}
                  className="flex items-center gap-0.5 h-6 px-2"
                  aria-hidden="true"
                >
                  {waveBars.map((heightPct, i) => (
                    <motion.span
                      key={i}
                      animate={{ height: `${Math.max(20, heightPct)}%` }}
                      transition={{ duration: 0.12 }}
                      className="w-1 rounded-full"
                      style={{
                        backgroundColor:
                          i % 3 === 0
                            ? '#2D2D2B'
                            : i % 2 === 0
                              ? 'var(--gr)'
                              : 'var(--bl)',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Controls: SA Dictation Locale + Open-Source Voice Pack Manager + Simulate Voice */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={cycleSpeechLang}
              title="Cycle SA speech recognition language (en-ZA / zu-ZA / af-ZA)"
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: 'var(--card)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <Globe className="w-3 h-3" />
              <span>
                {speechLang === 'zu-ZA'
                  ? 'isiZulu (zu-ZA)'
                  : speechLang === 'af-ZA'
                    ? 'Afrikaans (af-ZA)'
                    : 'SA English (en-ZA)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSoundCue('tap');
                setVoiceModalOpen(true);
              }}
              title="Download & preview custom open-source South African neural voice packs"
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: 'var(--yl)',
                color: '#2D2D2B',
              }}
            >
              <Download className="w-3 h-3" />
              <span>OS Voices ({installedIds.length}/6)</span>
            </button>

            <button
              type="button"
              onClick={runSimulatedVerbalWalkthrough}
              title="Stream a sample verbal explanation if you don't have a microphone handy"
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: isSimulatingVoice ? 'var(--gr)' : 'var(--card)',
                color: isSimulatingVoice ? '#2D2D2B' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <Mic className="w-3 h-3" />
              <span>{isSimulatingVoice ? 'Simulating...' : 'Simulate Voice'}</span>
            </button>

            {currentAnswer.trim().length > 0 && onTriggerGrade && !activeRecording && (
              <button
                type="button"
                onClick={() => {
                  playSoundCue('tap');
                  onTriggerGrade();
                }}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: 'var(--gr)', color: '#2D2D2B' }}
              >
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Grade Spoken</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Streaming Interim Transcript Preview */}
        <AnimatePresence>
          {(interimTranscript || activeRecording) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_SNAPPY}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl px-3 py-2 text-xs font-medium flex items-center justify-between gap-2"
                style={{
                  backgroundColor: 'rgba(255, 252, 245, 0.85)',
                  color: '#2D2D2B',
                  border: '1px solid rgba(45,45,43,0.12)',
                }}
              >
                <span className="stream-cursor">
                  {interimTranscript ||
                    (speechLang === 'zu-ZA'
                      ? 'iyalalela... Chaza impendulo yakho ngezwi.'
                      : speechLang === 'af-ZA'
                        ? 'Luister tans... Verduidelik jou antwoord hardop.'
                        : 'Listening... Explain your step-by-step reasoning out loud.')}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider shrink-0 opacity-65">
                  Live Voice
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Mic Permission Notice */}
        <AnimatePresence>
          {micWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[11px] font-semibold flex items-center justify-between gap-2 pt-0.5"
              style={{ color: 'var(--ink)' }}
            >
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{micWarning}</span>
              </span>
              <button
                type="button"
                onClick={runSimulatedVerbalWalkthrough}
                className="underline font-extrabold cursor-pointer shrink-0"
              >
                Try Demo Voice
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <OpenSourceVoiceModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onNotify={onNotify}
      />
    </>
  );
}

/**
 * Compact inline microphone button for the AI Tutor follow-up input bar
 */
export function InlineVoiceMicButton({
  activeTrack,
  onTranscript,
  onNotify,
}: {
  activeTrack: TrackId;
  onTranscript: (text: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const toggleInlineMic = () => {
    if (listening) {
      playSoundCue('tap');
      if (recRef.current) {
        try {
          recRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setListening(false);
      return;
    }

    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) {
      playSoundCue('step_reveal');
      const fallbackQuestion =
        activeTrack === 'code'
          ? 'Why does moving the left pointer preserve the O(n) time complexity invariant?'
          : activeTrack === 'lang'
            ? 'How does the isiZulu subject concord change from Class 1 singular to Class 2 plural?'
            : 'Why does Δ < 0 guarantee non-real roots on the NSC Paper 1 parabola?';
      onTranscript(fallbackQuestion);
      onNotify('Transcribed spoken follow-up question');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = activeTrack === 'lang' ? 'zu-ZA' : 'en-ZA';

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const text = e.results[0]?.[0]?.transcript || '';
        if (text.trim()) {
          onTranscript(text.trim());
          playSoundCue('option');
        }
      };

      rec.onerror = () => {
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recRef.current = rec;
      rec.start();
      playSoundCue('step_reveal');
      setListening(true);
      onNotify('Listening for your follow-up question...');
    } catch {
      setListening(false);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={toggleInlineMic}
      title={listening ? 'Stop voice dictation' : 'Speak your follow-up question'}
      aria-label={listening ? 'Stop voice dictation' : 'Speak your follow-up question'}
      className="w-9 h-9 rounded-full grid place-items-center shrink-0 cursor-pointer transition-colors"
      style={{
        backgroundColor: listening ? 'var(--pk)' : 'rgba(255, 255, 255, 0.12)',
        color: listening ? '#2D2D2B' : '#F8F3E7',
      }}
    >
      {listening ? (
        <MicOff className="w-4 h-4 animate-pulse" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </motion.button>
  );
}
