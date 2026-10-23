"use client";

import { useState, useEffect, useCallback } from "react";

export type SoundCueType =
  | "tap"
  | "option"
  | "grade_success"
  | "grade_partial"
  | "error"
  | "goal_reached"
  | "step_reveal";

const STORAGE_KEY = "learnflow-audio-muted";
const EVENT_NAME = "learnflow-audio-change";

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { muted } }));
  } catch {
    // Ignore storage errors
  }
}

function playNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain: number,
  type: OscillatorType = "sine",
  endFreq?: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
  }

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.012, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function playSoundCue(cue: SoundCueType): void {
  if (typeof window === "undefined" || isAudioMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (cue) {
    case "tap": {
      // Subtle warm tactile pop
      playNote(ctx, 320, now, 0.038, 0.04, "sine", 165);
      break;
    }
    case "option": {
      // Soft marimba selection tick
      playNote(ctx, 480, now, 0.045, 0.045, "triangle", 620);
      break;
    }
    case "step_reveal": {
      // Gentle two-note airy chime when step-by-step explanation unfolds
      playNote(ctx, 523.25, now, 0.14, 0.045, "sine"); // C5
      playNote(ctx, 659.25, now + 0.055, 0.18, 0.05, "sine"); // E5
      break;
    }
    case "grade_partial": {
      // Encouraging warm interval for partial credit
      playNote(ctx, 440, now, 0.14, 0.055, "sine"); // A4
      playNote(ctx, 554.37, now + 0.08, 0.22, 0.06, "sine"); // C#5
      break;
    }
    case "grade_success": {
      // Pleasant ascending harmonic triad for mastering a quiz question
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((f, idx) => {
        playNote(ctx, f, now + idx * 0.065, 0.26, 0.065, "sine");
      });
      break;
    }
    case "goal_reached": {
      // Uplifting major 9th celebration arpeggio when reaching the daily study goal
      const fanfare = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6
      fanfare.forEach((f, idx) => {
        playNote(
          ctx,
          f,
          now + idx * 0.075,
          idx === fanfare.length - 1 ? 0.48 : 0.25,
          0.075,
          "triangle",
        );
      });
      break;
    }
    case "error": {
      // Soft muted double low pulse for validation shake
      playNote(ctx, 175, now, 0.07, 0.055, "triangle", 130);
      playNote(ctx, 145, now + 0.085, 0.09, 0.05, "triangle", 110);
      break;
    }
  }
}

export function useSoundSettings() {
  const [muted, setMutedState] = useState<boolean>(false);

  useEffect(() => {
    setMutedState(isAudioMuted());

    const handleAudioChange = (e: Event) => {
      const custom = e as CustomEvent<{ muted: boolean }>;
      if (custom.detail && typeof custom.detail.muted === "boolean") {
        setMutedState(custom.detail.muted);
      } else {
        setMutedState(isAudioMuted());
      }
    };

    window.addEventListener(EVENT_NAME, handleAudioChange);
    return () => window.removeEventListener(EVENT_NAME, handleAudioChange);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isAudioMuted();
    setAudioMuted(next);
    setMutedState(next);
    if (!next) {
      // Play a gentle confirmation chime when unmuting
      setTimeout(() => playSoundCue("option"), 20);
    }
    return next;
  }, []);

  return {
    muted,
    toggleMute,
    playSound: playSoundCue,
  };
}
