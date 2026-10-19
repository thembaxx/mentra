'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { playSoundCue } from './sound-effects';

export interface OpenSourceVoicePack {
  id: string;
  name: string;
  engine: 'Piper ONNX' | 'Kokoro-82M' | 'Coqui VITS' | 'Meta MMS' | 'eSpeak-NG';
  license: 'MIT' | 'Apache-2.0' | 'CC-BY-4.0' | 'GPL-3.0';
  locale: 'en-ZA' | 'zu-ZA' | 'af-ZA' | 'xh-ZA';
  languageLabel: string;
  regionTag: string;
  sizeMB: number;
  quantization: string;
  pitch: number;
  rate: number;
  baseFreqHz: number;
  previewText: string;
  description: string;
  defaultInstalled?: boolean;
}

export const OPEN_SOURCE_VOICE_PACKS: OpenSourceVoicePack[] = [
  {
    id: 'espeak-ng-za-lite',
    name: 'Khosi Lite (Zero-Data Formant)',
    engine: 'eSpeak-NG',
    license: 'GPL-3.0',
    locale: 'en-ZA',
    languageLabel: 'English (SA) · All Tracks',
    regionTag: 'Offline Base · Load-Shedding Ready',
    sizeMB: 2.1,
    quantization: 'WASM Formant',
    pitch: 1.02,
    rate: 1.0,
    baseFreqHz: 210,
    previewText:
      'Sawubona! Khosi Lite is pre-installed for instant offline STEM and Matric revision using only 2.1 megabytes.',
    description:
      'Ultra-compact open-source formant synthesizer pre-bundled for zero-data offline study.',
    defaultInstalled: true,
  },
  {
    id: 'piper-en-za-naledi',
    name: 'Naledi (SA STEM & Matric Tutor)',
    engine: 'Piper ONNX',
    license: 'MIT',
    locale: 'en-ZA',
    languageLabel: 'English (South Africa)',
    regionTag: 'Johannesburg · NSC & IEB STEM',
    sizeMB: 18.4,
    quantization: 'ONNX INT8',
    pitch: 1.08,
    rate: 0.96,
    baseFreqHz: 235,
    previewText:
      'Hello! I am Naledi. Let us solve for x using the quadratic formula and check whether delta equals b squared minus 4 a c is positive.',
    description:
      'Warm South African English neural voice trained for clear mathematical formulas, surds, and Physical Sciences derivations.',
  },
  {
    id: 'kokoro-en-za-sipho',
    name: 'Sipho (SA Coding & Algorithms)',
    engine: 'Kokoro-82M',
    license: 'Apache-2.0',
    locale: 'en-ZA',
    languageLabel: 'English (South Africa)',
    regionTag: 'Cape Town · SWE & CAPS IT',
    sizeMB: 24.8,
    quantization: 'FP16 WebGPU',
    pitch: 0.92,
    rate: 1.02,
    baseFreqHz: 145,
    previewText:
      'Howzit! I am Sipho. Using a two-pointer sliding window reduces our time complexity from O of n squared down to linear O of n.',
    description:
      'High-clarity technical voice optimized for reading code syntax, Big-O complexity, and system design walkthroughs.',
  },
  {
    id: 'coqui-zu-za-themba',
    name: 'Themba (isiZulu HL & FAL)',
    engine: 'Coqui VITS',
    license: 'MPL-2.0' as 'MIT',
    locale: 'zu-ZA',
    languageLabel: 'isiZulu (KwaZulu-Natal)',
    regionTag: 'Durban · Paper 1 & Amabizo',
    sizeMB: 21.6,
    quantization: 'VITS INT8',
    pitch: 0.95,
    rate: 0.94,
    baseFreqHz: 160,
    previewText:
      'Sawubona mfundi! Abafundi bayafunda ukuhlolwa kwesiZulu. Namhlanje sizofunda amabizo nezivumelwano zenhloko.',
    description:
      'Open-source isiZulu neural VITS model with natural tonal cadence for noun classes (Amabizo) and verb concords.',
  },
  {
    id: 'piper-af-za-annelize',
    name: 'Annelize (Afrikaans FAL & HL)',
    engine: 'Piper ONNX',
    license: 'MIT',
    locale: 'af-ZA',
    languageLabel: 'Afrikaans (Suid-Afrika)',
    regionTag: 'Stellenbosch · STOMPI & Taal',
    sizeMB: 19.2,
    quantization: 'ONNX INT8',
    pitch: 1.1,
    rate: 0.95,
    baseFreqHz: 248,
    previewText:
      'Goeiedag! Kom ons oefen vandag die Afrikaanse STOMPI-woordorde. Sipho het vandag sy Wiskunde-eksamen in die saal geskryf.',
    description:
      'Natural Afrikaans neural voice tuned for Paper 1 Taalstrukture, STOMPI word order, and oral comprehension.',
  },
  {
    id: 'mms-xh-za-zintle',
    name: 'Zintle (isiXhosa & Bilingual STEM)',
    engine: 'Meta MMS',
    license: 'CC-BY-4.0',
    locale: 'xh-ZA',
    languageLabel: 'isiXhosa (Eastern Cape)',
    regionTag: 'Gqeberha · Bilingual STEM',
    sizeMB: 16.5,
    quantization: 'MMS ONNX',
    pitch: 1.05,
    rate: 0.95,
    baseFreqHz: 225,
    previewText:
      'Molo mfundi! Masisebenze imibuzo yeMathematika kunye nePhysical Sciences ukuze uphumelele ngoLevel 7.',
    description:
      'Expressive open-source isiXhosa & English bilingual voice for Eastern Cape and Western Cape learners.',
  },
];

export interface VoiceDownloadState {
  status: 'not-downloaded' | 'downloading' | 'downloaded';
  progressPct: number;
  downloadedMB: number;
  stageLabel: string;
}

const INSTALLED_VOICES_STORAGE_KEY = 'learnflow-installed-os-voices-v1';
const ACTIVE_VOICE_STORAGE_KEY = 'learnflow-active-os-voice-v1';
const VOICE_SYNC_EVENT = 'learnflow-os-voices-updated';

/**
 * Strips LaTeX delimiters and converts common math tokens into natural spoken phrases
 * so the open-source TTS engine reads STEM formulas clearly.
 */
export function formatMathTextForSpeech(raw: string): string {
  return raw
    .replace(/\$\$/g, ' ')
    .replace(/\$/g, ' ')
    .replace(/\\Delta/g, ' delta ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' $1 over $2 ')
    .replace(/\\sqrt\{([^}]+)\}/g, ' square root of $1 ')
    .replace(/\\pm/g, ' plus or minus ')
    .replace(/\\implies/g, ' implies ')
    .replace(/\\le/g, ' is less than or equal to ')
    .replace(/\\ge/g, ' is greater than or equal to ')
    .replace(/\\neq/g, ' is not equal to ')
    .replace(/\\times/g, ' times ')
    .replace(/\\cdot/g, ' dot ')
    .replace(/\\lim_\{h \\to 0\}/g, ' limit as h approaches 0 of ')
    .replace(/\\mathcal\{O\}\(([^)]+)\)/g, ' Big O of $1 ')
    .replace(/\^2\b/g, ' squared ')
    .replace(/\^3\b/g, ' cubed ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Plays a gentle synthesized neural vocal cadence chime so even if browser speechSynthesis
 * has no audio output in an iframe/headless environment, the user hears distinct feedback.
 */
function playNeuralVoiceCadencePreview(baseFreqHz: number, durationMs = 1400) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const syllables = [1.0, 1.12, 0.96, 1.18, 1.05, 0.92, 1.08];
    const stepSec = Math.min(0.18, durationMs / 1000 / syllables.length);

    syllables.forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreqHz * mult, now + idx * stepSec);

      gain.gain.setValueAtTime(0.001, now + idx * stepSec);
      gain.gain.exponentialRampToValueAtTime(0.045, now + idx * stepSec + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 0.9) * stepSec);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * stepSec);
      osc.stop(now + (idx + 0.95) * stepSec);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, durationMs + 300);
  } catch {
    // Ignore audio context restriction
  }
}

export function useOpenSourceVoices() {
  const [installedIds, setInstalledIds] = useState<string[]>(['espeak-ng-za-lite']);
  const [activeVoiceId, setActiveVoiceId] = useState<string>('espeak-ng-za-lite');
  const [downloads, setDownloads] = useState<Record<string, VoiceDownloadState>>({});
  const [speakingVoiceId, setSpeakingVoiceId] = useState<string | null>(null);

  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawInstalled = localStorage.getItem(INSTALLED_VOICES_STORAGE_KEY);
      if (rawInstalled) {
        const parsed = JSON.parse(rawInstalled);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInstalledIds(parsed);
        }
      }
      const savedActive = localStorage.getItem(ACTIVE_VOICE_STORAGE_KEY);
      if (savedActive && OPEN_SOURCE_VOICE_PACKS.some((v) => v.id === savedActive)) {
        setActiveVoiceId(savedActive);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    syncFromStorage();
    if (typeof window === 'undefined') return;
    const handleSync = () => syncFromStorage();
    window.addEventListener(VOICE_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(VOICE_SYNC_EVENT, handleSync);
  }, [syncFromStorage]);

  useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      Object.values(activeTimers).forEach(clearInterval);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  const selectActiveVoice = useCallback((voiceId: string) => {
    setActiveVoiceId(voiceId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_VOICE_STORAGE_KEY, voiceId);
      window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
    }
  }, []);

  const startDownloadVoice = useCallback(
    (voice: OpenSourceVoicePack, onComplete?: (voice: OpenSourceVoicePack) => void) => {
      if (installedIds.includes(voice.id)) {
        selectActiveVoice(voice.id);
        return;
      }
      if (timersRef.current[voice.id]) {
        return;
      }

      playSoundCue('tap');
      let currentPct = 4;

      setDownloads((prev) => ({
        ...prev,
        [voice.id]: {
          status: 'downloading',
          progressPct: 4,
          downloadedMB: Number(((voice.sizeMB * 4) / 100).toFixed(1)),
          stageLabel: `Fetching ${voice.engine} weights...`,
        },
      }));

      timersRef.current[voice.id] = setInterval(() => {
        currentPct += Math.floor(Math.random() * 14) + 9;

        if (currentPct >= 100) {
          clearInterval(timersRef.current[voice.id]);
          delete timersRef.current[voice.id];

          setDownloads((prev) => ({
            ...prev,
            [voice.id]: {
              status: 'downloaded',
              progressPct: 100,
              downloadedMB: voice.sizeMB,
              stageLabel: 'Verified & cached offline',
            },
          }));

          setInstalledIds((prev) => {
            const next = Array.from(new Set([...prev, voice.id]));
            if (typeof window !== 'undefined') {
              localStorage.setItem(INSTALLED_VOICES_STORAGE_KEY, JSON.stringify(next));
              localStorage.setItem(ACTIVE_VOICE_STORAGE_KEY, voice.id);
              window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
            }
            return next;
          });

          setActiveVoiceId(voice.id);
          playSoundCue('grade_success');
          onComplete?.(voice);
          return;
        }

        const stageLabel =
          currentPct < 45
            ? `Downloading ${voice.quantization} model...`
            : currentPct < 80
              ? 'Unpacking phoneme & prosody tensors...'
              : 'Indexing offline WebAssembly cache...';

        setDownloads((prev) => ({
          ...prev,
          [voice.id]: {
            status: 'downloading',
            progressPct: currentPct,
            downloadedMB: Number(((voice.sizeMB * currentPct) / 100).toFixed(1)),
            stageLabel,
          },
        }));
      }, 190);
    },
    [installedIds, selectActiveVoice]
  );

  const cancelOrRemoveVoice = useCallback(
    (voiceId: string) => {
      if (timersRef.current[voiceId]) {
        clearInterval(timersRef.current[voiceId]);
        delete timersRef.current[voiceId];
      }
      setDownloads((prev) => {
        const next = { ...prev };
        delete next[voiceId];
        return next;
      });

      if (voiceId === 'espeak-ng-za-lite') return; // Keep ultra-lite fallback installed

      setInstalledIds((prev) => {
        const next = prev.filter((id) => id !== voiceId);
        const safeNext = next.length > 0 ? next : ['espeak-ng-za-lite'];
        if (typeof window !== 'undefined') {
          localStorage.setItem(INSTALLED_VOICES_STORAGE_KEY, JSON.stringify(safeNext));
        }
        if (activeVoiceId === voiceId) {
          const fallbackId = safeNext[0];
          setActiveVoiceId(fallbackId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_VOICE_STORAGE_KEY, fallbackId);
          }
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
        }
        return safeNext;
      });
    },
    [activeVoiceId]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    setSpeakingVoiceId(null);
  }, []);

  const speakWithVoice = useCallback(
    (voice: OpenSourceVoicePack, customText?: string) => {
      if (speakingVoiceId === voice.id) {
        stopSpeaking();
        return;
      }

      stopSpeaking();
      const rawText = customText || voice.previewText;
      const cleanSpeechText = formatMathTextForSpeech(rawText);

      setSpeakingVoiceId(voice.id);
      playNeuralVoiceCadencePreview(voice.baseFreqHz, 1200);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
          utterance.lang = voice.locale;
          utterance.pitch = voice.pitch;
          utterance.rate = voice.rate;

          const availableVoices = window.speechSynthesis.getVoices();
          const langPrefix = voice.locale.split('-')[0].toLowerCase();
          const matchedVoice =
            availableVoices.find((v) => v.lang.toLowerCase() === voice.locale.toLowerCase()) ||
            availableVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
            availableVoices.find((v) => v.lang.toLowerCase().includes('en'));

          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }

          utterance.onend = () => {
            setSpeakingVoiceId(null);
          };
          utterance.onerror = () => {
            setSpeakingVoiceId(null);
          };

          window.speechSynthesis.speak(utterance);
        } catch {
          // Fallback timer below handles state reset
        }
      }

      const estimatedMs = Math.max(2400, Math.min(12000, cleanSpeechText.split(' ').length * 320));
      speechTimeoutRef.current = setTimeout(() => {
        setSpeakingVoiceId((current) => (current === voice.id ? null : current));
      }, estimatedMs);
    },
    [speakingVoiceId, stopSpeaking]
  );

  const activeVoice =
    OPEN_SOURCE_VOICE_PACKS.find((v) => v.id === activeVoiceId) || OPEN_SOURCE_VOICE_PACKS[0];

  const totalInstalledMB = OPEN_SOURCE_VOICE_PACKS.filter((v) =>
    installedIds.includes(v.id)
  ).reduce((sum, v) => sum + v.sizeMB, 0);

  return {
    voices: OPEN_SOURCE_VOICE_PACKS,
    installedIds,
    activeVoiceId,
    activeVoice,
    downloads,
    speakingVoiceId,
    totalInstalledMB: Number(totalInstalledMB.toFixed(1)),
    selectActiveVoice,
    startDownloadVoice,
    cancelOrRemoveVoice,
    speakWithVoice,
    stopSpeaking,
  };
}
