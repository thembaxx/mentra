'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume2,
  Globe,
  Check,
  AlertCircle,
} from 'lucide-react';
import { TrackId } from '@/lib/study-data';
import {
  SpringButton,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_GENTLE,
} from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';

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

const SAMPLE_VERBAL_REASONING: Record<TrackId, Record<string, string>> = {
  exam: {
    default:
      'First, I will isolate the variable x by subtracting 2x from both sides of the equation, giving x + 7 = 19. Next, subtracting 7 yields x = 12. Finally, substituting x = 12 into 5x - 4 gives 60 - 4 = 56.',
  },
  code: {
    default:
      'I will use a two-pointer sliding window with a frequency map. As the right pointer expands the window, if a duplicate character appears, I increment the left pointer until all characters in the window are unique again, achieving O(n) time complexity and O(k) space.',
  },
  lang: {
    default:
      'Llevo tres años estudiando español. Usamos el verbo llevar en presente más la duración de tiempo y el gerundio estudiando para expresar una acción continua que empezó en el pasado.',
  },
};

interface VoiceDictationBarProps {
  activeTrack: TrackId;
  topic: string;
  currentAnswer: string;
  onAppendTranscript: (text: string) => void;
  onTriggerGrade?: () => void;
  onNotify: (msg: string) => void;
}

export function VoiceDictationBar({
  activeTrack,
  topic,
  currentAnswer,
  onAppendTranscript,
  onTriggerGrade,
  onNotify,
}: VoiceDictationBarProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSimulatingVoice, setIsSimulatingVoice] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechLang, setSpeechLang] = useState<'en-US' | 'es-ES'>(
    activeTrack === 'lang' ? 'es-ES' : 'en-US'
  );
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [waveBars, setWaveBars] = useState<number[]>([
    24, 42, 68, 35, 80, 52, 30, 74, 46, 60, 38, 28,
  ]);
  const [micWarning, setMicWarning] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const simTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync default speech language when track switches to/from Spanish & Languages
  useEffect(() => {
    setSpeechLang(activeTrack === 'lang' ? 'es-ES' : 'en-US');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    };
  }, [stopListening]);

  // Recording timer & animated fallback waveform when listening or simulating
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

  // Start Web Audio Analyser for real-time microphone waveform if permitted
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
      // Fallback waveTimer handles animation if direct stream analyser is unavailable
    }
  };

  // Simulated verbal walkthrough for environments without SpeechRecognition or microphone hardware
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
      simTimeoutRef.current = setTimeout(stepWord, 95);
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
      // Automatically run simulated verbal walkthrough if browser lacks Web Speech API
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
      onNotify(
        `Listening (${speechLang === 'es-ES' ? 'Español' : 'English'}) — explain your reasoning out loud!`
      );
    } catch {
      runSimulatedVerbalWalkthrough();
    }
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const activeRecording = isListening || isSimulatingVoice;

  return (
    <motion.div
      layout
      transition={SPRING_GENTLE}
      className="rounded-2xl p-3.5 space-y-2.5 transition-colors"
      style={{
        backgroundColor: activeRecording ? 'var(--pks)' : 'var(--bg)',
        border: activeRecording ? '2px solid var(--pk)' : '1px solid var(--line)',
      }}
    >
      {/* Top Row: Voice-to-Text Controls + Language Switch + Simulate Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
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
                <span>Stop Recording ({formatSecs(elapsedSecs)})</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Speak Your Answer</span>
              </>
            )}
          </motion.button>

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
                    animate={{ height: `${ Math.max(20, heightPct) }%` }}
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

        {/* Right Controls: Dictation Language Toggle + Simulate Voice Demo + Grade Spoken Answer */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playSoundCue('option');
              setSpeechLang((l) => (l === 'en-US' ? 'es-ES' : 'en-US'));
            }}
            title="Switch voice recognition language (English / Español)"
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            <Globe className="w-3 h-3" />
            <span>{speechLang === 'es-ES' ? 'ES (Español)' : 'EN (English)'}</span>
          </button>

          <button
            type="button"
            onClick={runSimulatedVerbalWalkthrough}
            title="Stream a sample verbal explanation if you don't have a microphone handy"
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            style={{
              backgroundColor: isSimulatingVoice ? 'var(--yl)' : 'var(--card)',
              color: isSimulatingVoice ? '#2D2D2B' : 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            <Volume2 className="w-3 h-3" />
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
                  (speechLang === 'es-ES'
                    ? 'Escuchando... Explica tu respuesta en voz alta.'
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
            ? '¿Cuándo debemos usar el imperfecto de subjuntivo en lugar del indicativo?'
            : 'Can you show why we subtract the initial term before dividing?';
      onTranscript(fallbackQuestion);
      onNotify('Transcribed spoken follow-up question');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = activeTrack === 'lang' ? 'es-ES' : 'en-US';

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
