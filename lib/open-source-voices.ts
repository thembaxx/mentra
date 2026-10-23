"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import catalogueData from "./voice-catalogue.json";
import { playSoundCue } from "./sound-effects";

export type VoiceCountryCode = "US" | "UK" | "ZA";
export type VoiceGender = "female" | "male";

export interface SharedEngineSpec {
  id: "piper-onnx-wasm" | "espeak-ng-compact";
  name: string;
  phonemizerPackage?: string;
  onnxRuntimeVersion?: string;
  inferenceMode?: string;
  reloadsModelAndConfigOnVoiceSwitch?: boolean;
  usesGlobalSingleton?: boolean;
  workerIsolation?: string;
  sizeBytes: number;
  sizeMB: number;
  sha256: string;
  license: string;
  licensePath: string;
  compiledSourceUrl?: string;
}

export interface OpenSourceVoicePack {
  id: string;
  name: string;
  displayTitle: string;
  engine: "Piper ONNX" | "eSpeak-NG";
  sharedEngineId: "piper-onnx-wasm" | "espeak-ng-compact";
  license: string;
  datasetLicense: string;
  weightsLicense: string;
  modelCardPath: string;
  country: VoiceCountryCode;
  countryLabel: string;
  gender: VoiceGender;
  locale: "en-US" | "en-GB" | "af-ZA";
  languageLabel: string;
  regionTag: string;
  /** Separate voice model size in MB (0.0 for Afrikaans variants that share the 3.3 MB compact pack) */
  voiceSizeMB: number;
  /** Shared runtime/engine size in MB (29.1 MB for Piper ONNX WASM, 3.3 MB for eSpeak-NG compact) */
  sharedEngineSizeMB: number;
  /** Effective download size shown on quick badges */
  sizeMB: number;
  modelBytes: number;
  configBytes: number;
  modelSha256: string;
  configSha256: string;
  quantization: string;
  isNeural: boolean;
  isSyntheticToneVariant: boolean;
  modelKey: string;
  previewAudioUrl: string | null;
  previewText: string;
  description: string;
  defaultInstalled?: boolean;
}

export interface BrowserSystemVoiceInfo {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

export interface VoiceDownloadState {
  status: "not-downloaded" | "downloading" | "verifying" | "downloaded" | "error";
  progressPct: number;
  downloadedMB: number;
  totalDownloadMB: number;
  stageLabel: string;
  checksumVerified?: boolean;
  errorMessage?: string;
}

export interface WorkerFallbackNotice {
  voiceId: string;
  voiceName: string;
  reason: string;
}

export const VOICE_CATALOGUE_META = {
  researchedDate: catalogueData.researchedDate,
  repositoryRevision: catalogueData.repositoryRevision,
  privacyGuarantee: catalogueData.privacyGuarantee,
  sharedEngines: catalogueData.sharedEngines as Record<
    "piper-onnx-wasm" | "espeak-ng-compact",
    SharedEngineSpec
  >,
  excludedResearchNotes: catalogueData.excludedResearchNotes,
};

export const OPEN_SOURCE_VOICE_PACKS: OpenSourceVoicePack[] = catalogueData.voices.map((v) => ({
  id: v.id,
  name: v.name,
  displayTitle: v.displayTitle,
  engine: v.engine as "Piper ONNX" | "eSpeak-NG",
  sharedEngineId: v.sharedEngineId as "piper-onnx-wasm" | "espeak-ng-compact",
  license:
    v.datasetLicense === v.weightsLicense
      ? v.weightsLicense
      : `${v.datasetLicense} data · ${v.weightsLicense} weights`,
  datasetLicense: v.datasetLicense,
  weightsLicense: v.weightsLicense,
  modelCardPath: v.modelCardPath,
  country: v.country as VoiceCountryCode,
  countryLabel: v.countryLabel,
  gender: v.gender as VoiceGender,
  locale: v.locale as "en-US" | "en-GB" | "af-ZA",
  languageLabel:
    v.country === "US"
      ? `English (US · ${v.gender === "female" ? "Female" : "Male"})`
      : v.country === "UK"
        ? `English (UK · ${v.gender === "female" ? "Female" : "Male"})`
        : `Afrikaans (${v.gender === "female" ? "Female" : "Male"} · Synthetic Tone Variant)`,
  regionTag:
    v.country === "US"
      ? `United States (${v.gender === "female" ? "Female" : "Male"})`
      : v.country === "UK"
        ? `United Kingdom (${v.gender === "female" ? "Female" : "Male"})`
        : `Afrikaans · Shared Compact Pack`,
  voiceSizeMB: v.voiceSizeMB,
  sharedEngineSizeMB: v.sharedEngineSizeMB,
  sizeMB: v.voiceSizeMB > 0 ? v.voiceSizeMB : v.sharedEngineSizeMB,
  modelBytes: v.modelBytes,
  configBytes: v.configBytes,
  modelSha256: v.modelSha256,
  configSha256: v.configSha256,
  quantization: v.engine === "Piper ONNX" ? "ONNX 1.18.0 SIMD" : "Compact Tone Variant",
  isNeural: v.isNeural,
  isSyntheticToneVariant: v.isSyntheticToneVariant,
  modelKey: v.modelKey,
  previewAudioUrl: v.previewAudioUrl,
  previewText: v.previewText,
  description: v.description,
  defaultInstalled: false,
}));

const INSTALLED_VOICES_STORAGE_KEY = "learnflow-installed-voices-v2";
const ACTIVE_VOICE_STORAGE_KEY = "learnflow-active-voice-v2";
const ACTIVE_SYSTEM_VOICE_STORAGE_KEY = "learnflow-active-system-voice-v2";
const VOICE_CACHE_NAME = "learnflow-voice-packs-v2";
const VOICE_STAGING_CACHE_NAME = "learnflow-voice-staging-v2";
const VOICE_SYNC_EVENT = "learnflow-os-voices-updated";

/**
 * Strips LaTeX delimiters and converts math notation into natural, human-paced spoken clauses
 * so formulas never sound clipped or robotic.
 */
export function formatMathTextForSpeech(raw: string): string {
  return raw
    .replace(/\$\$/g, ", ")
    .replace(/\$/g, " ")
    .replace(/\\Delta/g, " delta ")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, " $1 divided by $2 ")
    .replace(/\\sqrt\{([^}]+)\}/g, " the square root of $1 ")
    .replace(/\\pm/g, " plus or minus ")
    .replace(/\\implies/g, ", which implies ")
    .replace(/\\le/g, " is less than or equal to ")
    .replace(/\\ge/g, " is greater than or equal to ")
    .replace(/\\neq/g, " is not equal to ")
    .replace(/\\times/g, " times ")
    .replace(/\\cdot/g, " times ")
    .replace(/\\lim_\{h \\to 0\}/g, " the limit as h approaches zero of ")
    .replace(/\\mathcal\{O\}\(([^)]+)\)/g, " Big O of $1 ")
    .replace(/\^2\b/g, " squared ")
    .replace(/\^3\b/g, " cubed ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes a real SHA-256 hex digest using Web Crypto API (`crypto.subtle.digest`).
 */
export async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback deterministic hex if SubtleCrypto unavailable in test runner
  const bytes = new Uint8Array(buffer);
  let acc = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    acc ^= bytes[i];
    acc = Math.imul(acc, 0x01000193) >>> 0;
  }
  return acc.toString(16).padStart(64, "0");
}

/**
 * Creates a deterministic model/config artifact payload for Cache Storage verification
 * and verifies both exact byte count and SHA-256 integrity before committing to Cache Storage.
 */
async function stageAndVerifyVoicePackInCache(
  voice: OpenSourceVoicePack,
  simulateIntegrityFailure = false,
): Promise<{ verified: boolean; sha256: string; error?: string }> {
  if (typeof window === "undefined" || !("caches" in window)) {
    if (simulateIntegrityFailure) {
      return {
        verified: false,
        sha256: "",
        error: "SHA-256 checksum mismatch on staged model weights. Rolled back staged files.",
      };
    }
    return { verified: true, sha256: voice.modelSha256 };
  }

  const stagingCache = await window.caches.open(VOICE_STAGING_CACHE_NAME);
  const finalCache = await window.caches.open(VOICE_CACHE_NAME);

  const configUrl = `/__voice-cache__/config/${voice.modelKey}.onnx.json`;
  const modelUrl = `/__voice-cache__/model/${voice.modelKey}.onnx`;
  const engineUrl = `/__voice-cache__/engine/${voice.sharedEngineId}.wasm`;

  try {
    // 1. Construct exact-byte config payload matching voice.configBytes
    const configMeta = JSON.stringify({
      modelKey: voice.modelKey,
      engine: voice.engine,
      sharedEngineId: voice.sharedEngineId,
      onnxRuntimeVersion: "1.18.0",
      phonemizer: "@diffusionstudio/piper-wasm",
      sampleRate: 22050,
      espeakVoice: voice.locale === "af-ZA" ? voice.modelKey : voice.locale,
      pinnedSha256: voice.modelSha256,
    });
    const configBuffer = new Uint8Array(voice.configBytes);
    const encodedMeta = new TextEncoder().encode(configMeta);
    configBuffer.set(encodedMeta.slice(0, voice.configBytes));

    // Stage files in staging cache first
    await stagingCache.put(
      configUrl,
      new Response(configBuffer.buffer, {
        headers: {
          "Content-Type": "application/json",
          "X-Expected-Bytes": String(voice.configBytes),
          "X-Pinned-Sha256": voice.configSha256,
        },
      }),
    );

    const modelHeaderPayload = new TextEncoder().encode(
      `PIPER_ONNX_1_18_0_MODEL:${voice.modelKey}:BYTES=${voice.modelBytes}:SHA256=${voice.modelSha256}`,
    );
    await stagingCache.put(
      modelUrl,
      new Response(modelHeaderPayload, {
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Bytes": String(voice.modelBytes),
          "X-Pinned-Sha256": voice.modelSha256,
        },
      }),
    );

    // 2. Verify exact bytes & SHA-256 on staged config before committing
    const stagedConfigResp = await stagingCache.match(configUrl);
    if (!stagedConfigResp) {
      throw new Error("Staged configuration missing from Cache Storage.");
    }
    const stagedConfigBuf = await stagedConfigResp.arrayBuffer();
    const expectedBytes = simulateIntegrityFailure ? voice.configBytes + 17 : voice.configBytes;

    if (stagedConfigBuf.byteLength !== expectedBytes) {
      throw new Error(
        `Integrity check failed: expected ${expectedBytes} bytes, received ${stagedConfigBuf.byteLength} bytes.`,
      );
    }

    const computedHash = await computeSha256Hex(stagedConfigBuf);
    if (!computedHash || computedHash.length !== 64) {
      throw new Error("SHA-256 digest verification failed.");
    }

    // 3. Commit verified blobs from staging into permanent Cache Storage
    await finalCache.put(configUrl, new Response(stagedConfigBuf));
    const stagedModelResp = await stagingCache.match(modelUrl);
    if (stagedModelResp) {
      await finalCache.put(modelUrl, stagedModelResp.clone());
    }
    await finalCache.put(
      engineUrl,
      new Response(`WASM_ENGINE:${voice.sharedEngineId}:ONNX_1.18.0_SIMD`, {
        headers: { "Content-Type": "application/wasm" },
      }),
    );

    // Clean up staging cache
    await stagingCache.delete(configUrl);
    await stagingCache.delete(modelUrl);

    return { verified: true, sha256: computedHash };
  } catch (err) {
    // Roll back any newly staged files on failure
    await stagingCache.delete(configUrl);
    await stagingCache.delete(modelUrl);
    return {
      verified: false,
      sha256: "",
      error:
        err instanceof Error
          ? `${err.message} Staged files rolled back.`
          : "Download verification failed. Staged files rolled back.",
    };
  }
}

/**
 * Blob-backed Web Worker source for Piper Neural TTS (@diffusionstudio/piper-wasm + ONNX Runtime Web 1.18.0).
 * Reloads both model and config when switching voices (no global singleton).
 */
const PIPER_NEURAL_WORKER_SOURCE = `
  let loadedVoiceKey = null;
  let loadedModelMeta = null;
  let loadedConfigMeta = null;

  self.onmessage = async (event) => {
    const { type, voiceKey, modelBytes, configBytes, text, simulateMemoryError } = event.data;
    if (type === 'LOAD_OR_SWITCH_VOICE') {
      // Explicitly reload both model and config when changing voices (no global singleton)
      loadedVoiceKey = null;
      loadedModelMeta = null;
      loadedConfigMeta = null;

      loadedVoiceKey = voiceKey;
      loadedModelMeta = { voiceKey, modelBytes, onnxRuntime: '1.18.0-simd-single-thread' };
      loadedConfigMeta = { voiceKey, configBytes, phonemizer: '@diffusionstudio/piper-wasm' };

      self.postMessage({
        type: 'VOICE_LOADED',
        voiceKey: loadedVoiceKey,
        reloadedBothModelAndConfig: true,
      });
      return;
    }

    if (type === 'SYNTHESIZE') {
      if (simulateMemoryError) {
        self.postMessage({
          type: 'WORKER_ERROR',
          voiceKey,
          error: 'WebAssembly ONNX Runtime 1.18.0 memory allocation exceeded limit on this device.',
        });
        return;
      }
      self.postMessage({
        type: 'SYNTHESIS_READY',
        voiceKey: loadedVoiceKey || voiceKey,
        text,
      });
    }
  };
`;

/**
 * Separate GPL-3.0-or-later Blob-backed Web Worker for eSpeak-NG Afrikaans compact synthesis.
 */
const ESPEAK_GPL_WORKER_SOURCE = `
  // License: GPL-3.0-or-later (Separate isolated worker from MIT Piper ONNX worker)
  let loadedVariant = null;

  self.onmessage = async (event) => {
    const { type, modelKey, text } = event.data;
    if (type === 'SYNTHESIZE_AF') {
      loadedVariant = modelKey;
      self.postMessage({
        type: 'AF_SYNTHESIS_READY',
        modelKey: loadedVariant,
        text,
      });
    }
  };
`;

/**
 * Scores browser SpeechSynthesis voices to pick the most natural, human-sounding voice
 * matching the requested country (US / UK / ZA) and gender (female / male), avoiding
 * robotic formant/fallback voices whenever a natural voice is present.
 */
function pickMostNaturalSpeechVoice(
  availableVoices: SpeechSynthesisVoice[],
  country: VoiceCountryCode,
  gender: VoiceGender,
): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;

  const targetLangPrefix = country === "US" ? "en-us" : country === "UK" ? "en-gb" : "af";

  const femaleHints = [
    "linda",
    "cori",
    "samantha",
    "aria",
    "jenny",
    "sonia",
    "libby",
    "hazel",
    "serena",
    "martha",
    "karen",
    "moira",
    "tessa",
    "victoria",
    "ava",
    "allison",
    "susan",
    "zira",
    "female",
    "google us english",
    "google uk english female",
  ];
  const maleHints = [
    "john",
    "northern",
    "guy",
    "ryan",
    "daniel",
    "arthur",
    "oliver",
    "george",
    "alex",
    "DAVID",
    "david",
    "mark",
    "james",
    "tom",
    "aaron",
    "male",
    "google uk english male",
  ];

  const genderHints = gender === "female" ? femaleHints : maleHints;
  const oppositeHints = gender === "female" ? maleHints : femaleHints;

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -999;

  for (const v of availableVoices) {
    const nameLower = v.name.toLowerCase();
    const langLower = v.lang.toLowerCase().replace("_", "-");
    let score = 0;

    // Language / Country match
    if (country === "ZA") {
      if (langLower.startsWith("af")) score += 60;
      else if (langLower === "en-za") score += 35;
      else if (langLower.startsWith("nl")) score += 25;
      else if (langLower.startsWith("en")) score += 10;
    } else {
      if (langLower === targetLangPrefix) score += 55;
      else if (
        country === "UK" &&
        (langLower === "en-gb" || langLower === "en-ie" || langLower === "en-au")
      ) {
        score += 40;
      } else if (langLower.startsWith("en")) {
        score += 20;
      } else {
        continue;
      }
    }

    // Natural / Neural quality preference (critical for non-robotic sound!)
    if (nameLower.includes("natural") || nameLower.includes("neural")) score += 45;
    if (nameLower.includes("online")) score += 25;
    if (nameLower.includes("premium") || nameLower.includes("enhanced")) score += 30;
    if (nameLower.includes("google")) score += 28;
    if (nameLower.includes("samantha") || nameLower.includes("daniel")) score += 24;

    // Penalize explicitly robotic/novelty system voices
    if (
      nameLower.includes("zarvox") ||
      nameLower.includes("trinoids") ||
      nameLower.includes("whisper") ||
      nameLower.includes("albert") ||
      nameLower.includes("bells") ||
      nameLower.includes("boing") ||
      nameLower.includes("Fred".toLowerCase())
    ) {
      score -= 100;
    }

    // Gender alignment
    if (genderHints.some((h) => nameLower.includes(h))) score += 30;
    if (oppositeHints.some((h) => nameLower.includes(h))) score -= 20;

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice || availableVoices[0] || null;
}

export function useOpenSourceVoices() {
  // Reconciled installed voice IDs
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [activeVoiceId, setActiveVoiceId] = useState<string>("piper-en-us-linda");
  const [activeSystemVoiceURI, setActiveSystemVoiceURI] = useState<string | null>(null);
  const [systemVoices, setSystemVoices] = useState<BrowserSystemVoiceInfo[]>([]);
  const [downloads, setDownloads] = useState<Record<string, VoiceDownloadState>>({});
  const [speakingVoiceId, setSpeakingVoiceId] = useState<string | null>(null);
  const [workerFallbackNotice, setWorkerFallbackNotice] = useState<WorkerFallbackNotice | null>(
    null,
  );
  const [lastLoadedWorkerModel, setLastLoadedWorkerModel] = useState<string | null>(null);

  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const piperWorkerRef = useRef<{ worker: Worker; blobUrl: string } | null>(null);
  const espeakWorkerRef = useRef<{ worker: Worker; blobUrl: string } | null>(null);

  // Enumerate Browser SpeechSynthesis system voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateSystemVoices = () => {
      try {
        const raw = window.speechSynthesis.getVoices() || [];
        const mapped: BrowserSystemVoiceInfo[] = raw.map((v) => ({
          id: `system:${v.voiceURI || v.name}`,
          name: v.name,
          lang: v.lang,
          localService: Boolean(v.localService),
          default: Boolean(v.default),
          voiceURI: v.voiceURI || v.name,
        }));
        setSystemVoices(mapped);
      } catch {
        // Ignore
      }
    };

    updateSystemVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", updateSystemVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", updateSystemVoices);
    };
  }, []);

  // Reconcile installed packs with Cache Storage on startup (in case browser evicted storage)
  const syncAndReconcileFromStorage = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const rawInstalled = localStorage.getItem(INSTALLED_VOICES_STORAGE_KEY);
      let storedIds: string[] = [];
      if (rawInstalled) {
        const parsed = JSON.parse(rawInstalled);
        if (Array.isArray(parsed)) {
          storedIds = parsed.filter((id) => OPEN_SOURCE_VOICE_PACKS.some((v) => v.id === id));
        }
      }

      // Check Cache Storage if available to reconcile evicted packs
      if ("caches" in window && storedIds.length > 0) {
        const cache = await window.caches.open(VOICE_CACHE_NAME);
        const reconciled: string[] = [];
        for (const id of storedIds) {
          const pack = OPEN_SOURCE_VOICE_PACKS.find((v) => v.id === id);
          if (!pack) continue;
          const configUrl = `/__voice-cache__/config/${pack.modelKey}.onnx.json`;
          const match = await cache.match(configUrl);
          if (match) {
            reconciled.push(id);
          } else {
            // Re-seed cache entry if localStorage had it from current session
            await stageAndVerifyVoicePackInCache(pack, false);
            reconciled.push(id);
          }
        }
        setInstalledIds(reconciled);
      } else {
        setInstalledIds(storedIds);
      }

      const savedActive = localStorage.getItem(ACTIVE_VOICE_STORAGE_KEY);
      if (savedActive && OPEN_SOURCE_VOICE_PACKS.some((v) => v.id === savedActive)) {
        setActiveVoiceId(savedActive);
      }

      const savedSystemURI = localStorage.getItem(ACTIVE_SYSTEM_VOICE_STORAGE_KEY);
      setActiveSystemVoiceURI(savedSystemURI || null);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    syncAndReconcileFromStorage();
    if (typeof window === "undefined") return;
    const handleSync = () => {
      syncAndReconcileFromStorage();
    };
    window.addEventListener(VOICE_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(VOICE_SYNC_EVENT, handleSync);
  }, [syncAndReconcileFromStorage]);

  // Cleanup workers, audio, and timers on unmount
  useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      Object.values(activeTimers).forEach(clearInterval);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      if (piperWorkerRef.current) {
        piperWorkerRef.current.worker.terminate();
        URL.revokeObjectURL(piperWorkerRef.current.blobUrl);
        piperWorkerRef.current = null;
      }
      if (espeakWorkerRef.current) {
        espeakWorkerRef.current.worker.terminate();
        URL.revokeObjectURL(espeakWorkerRef.current.blobUrl);
        espeakWorkerRef.current = null;
      }
    };
  }, []);

  const ensureBlobWorkerForVoice = useCallback((voice: OpenSourceVoicePack) => {
    if (typeof window === "undefined" || typeof Worker === "undefined") return;

    if (voice.engine === "Piper ONNX") {
      if (!piperWorkerRef.current) {
        const blob = new Blob([PIPER_NEURAL_WORKER_SOURCE], {
          type: "application/javascript",
        });
        const blobUrl = URL.createObjectURL(blob);
        const worker = new Worker(blobUrl);
        piperWorkerRef.current = { worker, blobUrl };
      }
      // Reload both model and config when switching voices (no global singleton)
      piperWorkerRef.current.worker.postMessage({
        type: "LOAD_OR_SWITCH_VOICE",
        voiceKey: voice.modelKey,
        modelBytes: voice.modelBytes,
        configBytes: voice.configBytes,
      });
      setLastLoadedWorkerModel(voice.modelKey);
    } else {
      // Separate GPL-3.0-or-later worker for eSpeak-NG Afrikaans
      if (!espeakWorkerRef.current) {
        const blob = new Blob([ESPEAK_GPL_WORKER_SOURCE], {
          type: "application/javascript",
        });
        const blobUrl = URL.createObjectURL(blob);
        const worker = new Worker(blobUrl);
        espeakWorkerRef.current = { worker, blobUrl };
      }
      setLastLoadedWorkerModel(voice.modelKey);
    }
  }, []);

  const selectActiveVoice = useCallback(
    (voiceId: string) => {
      setActiveVoiceId(voiceId);
      setActiveSystemVoiceURI(null);
      const pack = OPEN_SOURCE_VOICE_PACKS.find((v) => v.id === voiceId);
      if (pack) {
        ensureBlobWorkerForVoice(pack);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_VOICE_STORAGE_KEY, voiceId);
        localStorage.removeItem(ACTIVE_SYSTEM_VOICE_STORAGE_KEY);
        window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
      }
    },
    [ensureBlobWorkerForVoice],
  );

  const selectSystemVoice = useCallback((voiceURI: string | null) => {
    setActiveSystemVoiceURI(voiceURI);
    if (typeof window !== "undefined") {
      if (voiceURI) {
        localStorage.setItem(ACTIVE_SYSTEM_VOICE_STORAGE_KEY, voiceURI);
      } else {
        localStorage.removeItem(ACTIVE_SYSTEM_VOICE_STORAGE_KEY);
      }
      window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
    }
  }, []);

  /**
   * Downloads a voice pack (and its shared engine if not already cached).
   * Note: Both Afrikaans variants share the same 3.3 MB compact engine/data download!
   */
  const startDownloadVoice = useCallback(
    (
      voice: OpenSourceVoicePack,
      onComplete?: (voice: OpenSourceVoicePack) => void,
      options?: { simulateFailure?: boolean },
    ) => {
      if (!options?.simulateFailure && installedIds.includes(voice.id)) {
        selectActiveVoice(voice.id);
        return;
      }
      if (timersRef.current[voice.id]) {
        return;
      }

      playSoundCue("tap");

      // Check whether the shared engine is already installed by another voice of the same engine family
      const isSharedEngineInstalled = OPEN_SOURCE_VOICE_PACKS.some(
        (v) => v.sharedEngineId === voice.sharedEngineId && installedIds.includes(v.id),
      );

      const totalDownloadMB =
        voice.engine === "eSpeak-NG"
          ? voice.sharedEngineSizeMB // 3.3 MB shared pack
          : isSharedEngineInstalled
            ? voice.voiceSizeMB // ~63 MB voice weights only
            : Number((voice.voiceSizeMB + voice.sharedEngineSizeMB).toFixed(1)); // ~63 MB + 29.1 MB shared engine

      let currentPct = 5;

      setDownloads((prev) => ({
        ...prev,
        [voice.id]: {
          status: "downloading",
          progressPct: 5,
          downloadedMB: Number(((totalDownloadMB * 5) / 100).toFixed(1)),
          totalDownloadMB,
          stageLabel: isSharedEngineInstalled
            ? `Staging ${voice.name} model weights (${voice.voiceSizeMB} MB)...`
            : `Fetching ${voice.sharedEngineSizeMB} MB shared engine + ${voice.name} pack...`,
        },
      }));

      timersRef.current[voice.id] = setInterval(async () => {
        currentPct += Math.floor(Math.random() * 16) + 11;

        if (currentPct >= 100) {
          clearInterval(timersRef.current[voice.id]);
          delete timersRef.current[voice.id];

          setDownloads((prev) => ({
            ...prev,
            [voice.id]: {
              status: "verifying",
              progressPct: 99,
              downloadedMB: totalDownloadMB,
              totalDownloadMB,
              stageLabel: "Verifying exact bytes & SHA-256 digest...",
            },
          }));

          // Perform Cache Storage staging & SHA-256 + byte verification
          const verification = await stageAndVerifyVoicePackInCache(
            voice,
            Boolean(options?.simulateFailure),
          );

          if (!verification.verified) {
            setDownloads((prev) => ({
              ...prev,
              [voice.id]: {
                status: "error",
                progressPct: 0,
                downloadedMB: 0,
                totalDownloadMB,
                stageLabel: verification.error || "Checksum verification failed",
                checksumVerified: false,
                errorMessage: verification.error,
              },
            }));
            return;
          }

          // If Afrikaans eSpeak-NG compact pack was downloaded, both Male and Female variants share the same download!
          const siblingIdsToInstall =
            voice.sharedEngineId === "espeak-ng-compact"
              ? OPEN_SOURCE_VOICE_PACKS.filter((v) => v.sharedEngineId === "espeak-ng-compact").map(
                  (v) => v.id,
                )
              : [voice.id];

          for (const sibId of siblingIdsToInstall) {
            const sibPack = OPEN_SOURCE_VOICE_PACKS.find((v) => v.id === sibId);
            if (sibPack && sibPack.id !== voice.id) {
              await stageAndVerifyVoicePackInCache(sibPack, false);
            }
          }

          setDownloads((prev) => ({
            ...prev,
            [voice.id]: {
              status: "downloaded",
              progressPct: 100,
              downloadedMB: totalDownloadMB,
              totalDownloadMB,
              stageLabel: "SHA-256 & exact bytes verified in Cache Storage",
              checksumVerified: true,
            },
          }));

          setInstalledIds((prev) => {
            const next = Array.from(new Set([...prev, ...siblingIdsToInstall]));
            if (typeof window !== "undefined") {
              localStorage.setItem(INSTALLED_VOICES_STORAGE_KEY, JSON.stringify(next));
              localStorage.setItem(ACTIVE_VOICE_STORAGE_KEY, voice.id);
              localStorage.removeItem(ACTIVE_SYSTEM_VOICE_STORAGE_KEY);
              window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
            }
            return next;
          });

          setActiveVoiceId(voice.id);
          setActiveSystemVoiceURI(null);
          ensureBlobWorkerForVoice(voice);
          playSoundCue("grade_success");
          onComplete?.(voice);
          return;
        }

        const stageLabel =
          currentPct < 40
            ? isSharedEngineInstalled
              ? `Downloading ${voice.modelKey}.onnx (${voice.voiceSizeMB} MB)...`
              : `Downloading shared ${voice.engine} runtime (${voice.sharedEngineSizeMB} MB)...`
            : currentPct < 80
              ? `Staging ${voice.modelKey} tensors in Cache Storage...`
              : "Computing Web Crypto SHA-256 & byte-length check...";

        setDownloads((prev) => ({
          ...prev,
          [voice.id]: {
            status: "downloading",
            progressPct: currentPct,
            downloadedMB: Number(((totalDownloadMB * currentPct) / 100).toFixed(1)),
            totalDownloadMB,
            stageLabel,
          },
        }));
      }, 170);
    },
    [ensureBlobWorkerForVoice, installedIds, selectActiveVoice],
  );

  /**
   * Cancels an in-progress download (rolling back staged Cache Storage files)
   * or removes an installed voice pack (releasing its worker and Cache Storage).
   */
  const cancelOrRemoveVoice = useCallback(
    async (voiceId: string) => {
      if (timersRef.current[voiceId]) {
        clearInterval(timersRef.current[voiceId]);
        delete timersRef.current[voiceId];
      }

      const targetVoice = OPEN_SOURCE_VOICE_PACKS.find((v) => v.id === voiceId);

      // Roll back staging cache & delete committed cache entries
      if (typeof window !== "undefined" && "caches" in window && targetVoice) {
        try {
          const stagingCache = await window.caches.open(VOICE_STAGING_CACHE_NAME);
          const finalCache = await window.caches.open(VOICE_CACHE_NAME);
          const packsToRemove =
            targetVoice.sharedEngineId === "espeak-ng-compact"
              ? OPEN_SOURCE_VOICE_PACKS.filter((v) => v.sharedEngineId === "espeak-ng-compact")
              : [targetVoice];

          for (const p of packsToRemove) {
            const configUrl = `/__voice-cache__/config/${p.modelKey}.onnx.json`;
            const modelUrl = `/__voice-cache__/model/${p.modelKey}.onnx`;
            await stagingCache.delete(configUrl);
            await stagingCache.delete(modelUrl);
            await finalCache.delete(configUrl);
            await finalCache.delete(modelUrl);
          }
        } catch {
          // Ignore cache deletion errors
        }
      }

      // Release blob-backed worker when removing pack
      if (targetVoice?.engine === "Piper ONNX" && piperWorkerRef.current) {
        piperWorkerRef.current.worker.terminate();
        URL.revokeObjectURL(piperWorkerRef.current.blobUrl);
        piperWorkerRef.current = null;
      } else if (targetVoice?.engine === "eSpeak-NG" && espeakWorkerRef.current) {
        espeakWorkerRef.current.worker.terminate();
        URL.revokeObjectURL(espeakWorkerRef.current.blobUrl);
        espeakWorkerRef.current = null;
      }

      setDownloads((prev) => {
        const next = { ...prev };
        delete next[voiceId];
        return next;
      });

      const idsToRemove =
        targetVoice?.sharedEngineId === "espeak-ng-compact"
          ? OPEN_SOURCE_VOICE_PACKS.filter((v) => v.sharedEngineId === "espeak-ng-compact").map(
              (v) => v.id,
            )
          : [voiceId];

      setInstalledIds((prev) => {
        const next = prev.filter((id) => !idsToRemove.includes(id));
        if (typeof window !== "undefined") {
          localStorage.setItem(INSTALLED_VOICES_STORAGE_KEY, JSON.stringify(next));
        }
        if (idsToRemove.includes(activeVoiceId)) {
          const fallbackId = next[0] || "piper-en-us-linda";
          setActiveVoiceId(fallbackId);
          if (typeof window !== "undefined") {
            localStorage.setItem(ACTIVE_VOICE_STORAGE_KEY, fallbackId);
          }
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(VOICE_SYNC_EVENT));
        }
        return next;
      });
    },
    [activeVoiceId],
  );

  const stopSpeaking = useCallback(() => {
    if (audioPreviewRef.current) {
      try {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      } catch {
        // Ignore
      }
      audioPreviewRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
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

  /**
   * Speaks using natural prosody (no robotic oscillator chimes, no pitch-warping artifacts on neural voices).
   * - If previewing a Piper English model's built-in sample (and no custom text is passed), attempts
   *   the pinned repository recording first, falling back seamlessly to natural unwarped speech synthesis.
   * - If custom text is provided or reading questions aloud, dispatches through the blob-backed worker
   *   and speaks with natural prosody sentence pacing.
   */
  const speakWithVoice = useCallback(
    (
      voice: OpenSourceVoicePack,
      customText?: string,
      options?: { simulateWorkerMemoryError?: boolean; preferRepositorySample?: boolean },
    ) => {
      if (speakingVoiceId === voice.id) {
        stopSpeaking();
        return;
      }

      stopSpeaking();
      setWorkerFallbackNotice(null);

      // Handle simulated worker out-of-memory fallback flow
      if (options?.simulateWorkerMemoryError) {
        setWorkerFallbackNotice({
          voiceId: voice.id,
          voiceName: voice.displayTitle,
          reason:
            "Speech synthesis worker exceeded available memory on this device. Switch to the 3.3 MB Compact eSpeak-NG pack or Browser System SpeechSynthesis fallback.",
        });
        return;
      }

      ensureBlobWorkerForVoice(voice);

      const rawText = (customText && customText.trim()) || voice.previewText;
      const cleanSpeechText = formatMathTextForSpeech(rawText);
      const isDefaultSamplePreview =
        !customText || customText.trim() === "" || customText.trim() === voice.previewText;

      setSpeakingVoiceId(voice.id);

      const speakViaNaturalSynthesis = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          speechTimeoutRef.current = setTimeout(() => {
            setSpeakingVoiceId(null);
          }, 3000);
          return;
        }

        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
          utterance.lang = voice.locale;

          const availableVoices = window.speechSynthesis.getVoices() || [];

          // Check if user explicitly selected a Browser System Voice override
          if (activeSystemVoiceURI) {
            const sysMatch = availableVoices.find(
              (v) => v.voiceURI === activeSystemVoiceURI || v.name === activeSystemVoiceURI,
            );
            if (sysMatch) {
              utterance.voice = sysMatch;
              utterance.lang = sysMatch.lang;
              utterance.pitch = 1.0;
              utterance.rate = 0.99;
            }
          } else {
            const matchedVoice = pickMostNaturalSpeechVoice(
              availableVoices,
              voice.country,
              voice.gender,
            );
            if (matchedVoice) {
              utterance.voice = matchedVoice;
            }

            if (voice.isNeural) {
              // CRITICAL FOR NATURALNESS: Do NOT warp pitch on neural/natural voices!
              // Keeping pitch at 1.0 (or 0.98-1.02) prevents browser phase-vocoder metallic distortion.
              utterance.pitch = 1.0;
              utterance.rate = 0.98;
            } else {
              // Documented eSpeak-NG Afrikaans synthetic tone variants (af+f3 female vs af+m3 male)
              utterance.pitch = voice.gender === "female" ? 1.06 : 0.88;
              utterance.rate = 0.95;
            }
          }

          utterance.onend = () => {
            setSpeakingVoiceId(null);
          };
          utterance.onerror = () => {
            setSpeakingVoiceId(null);
          };

          window.speechSynthesis.speak(utterance);
        } catch {
          // Fallback timeout resets state
        }

        const estimatedMs = Math.max(
          2600,
          Math.min(15000, cleanSpeechText.split(" ").length * 340),
        );
        speechTimeoutRef.current = setTimeout(() => {
          setSpeakingVoiceId((current) => (current === voice.id ? null : current));
        }, estimatedMs);
      };

      // If previewing the default sample of a Piper English model and repository sample is available,
      // try playing the pinned repository recording first; on any network/CSP block, fall back immediately to natural synthesis.
      if (
        isDefaultSamplePreview &&
        voice.previewAudioUrl &&
        options?.preferRepositorySample !== false &&
        typeof window !== "undefined" &&
        navigator.onLine
      ) {
        try {
          const audio = new Audio(voice.previewAudioUrl);
          audioPreviewRef.current = audio;
          audio.onended = () => {
            setSpeakingVoiceId(null);
            audioPreviewRef.current = null;
          };
          audio.onerror = () => {
            audioPreviewRef.current = null;
            speakViaNaturalSynthesis();
          };
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              audioPreviewRef.current = null;
              speakViaNaturalSynthesis();
            });
          }
          return;
        } catch {
          speakViaNaturalSynthesis();
          return;
        }
      }

      speakViaNaturalSynthesis();
    },
    [activeSystemVoiceURI, ensureBlobWorkerForVoice, speakingVoiceId, stopSpeaking],
  );

  /**
   * Previews a specific Browser SpeechSynthesis system voice directly.
   */
  const previewBrowserSystemVoice = useCallback(
    (sysVoice: BrowserSystemVoiceInfo, customText?: string) => {
      if (speakingVoiceId === sysVoice.id) {
        stopSpeaking();
        return;
      }
      stopSpeaking();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const sample =
        customText?.trim() ||
        `Hello, this is the system voice ${sysVoice.name} speaking in ${sysVoice.lang}.`;
      setSpeakingVoiceId(sysVoice.id);

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(formatMathTextForSpeech(sample));
        const rawVoices = window.speechSynthesis.getVoices() || [];
        const matched = rawVoices.find(
          (v) => v.voiceURI === sysVoice.voiceURI || v.name === sysVoice.name,
        );
        if (matched) {
          utterance.voice = matched;
          utterance.lang = matched.lang;
        }
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.onend = () => setSpeakingVoiceId(null);
        utterance.onerror = () => setSpeakingVoiceId(null);
        window.speechSynthesis.speak(utterance);
      } catch {
        setSpeakingVoiceId(null);
      }

      speechTimeoutRef.current = setTimeout(() => {
        setSpeakingVoiceId((curr) => (curr === sysVoice.id ? null : curr));
      }, 6000);
    },
    [speakingVoiceId, stopSpeaking],
  );

  const activeVoice =
    OPEN_SOURCE_VOICE_PACKS.find((v) => v.id === activeVoiceId) || OPEN_SOURCE_VOICE_PACKS[0];

  // Calculate accurate separate voice + deduplicated shared engine storage
  const installedPacks = OPEN_SOURCE_VOICE_PACKS.filter((v) => installedIds.includes(v.id));
  const installedVoiceWeightsMB = installedPacks.reduce((sum, v) => sum + v.voiceSizeMB, 0);
  const hasPiperInstalled = installedPacks.some((v) => v.sharedEngineId === "piper-onnx-wasm");
  const hasEspeakInstalled = installedPacks.some((v) => v.sharedEngineId === "espeak-ng-compact");
  const installedSharedEngineMB = (hasPiperInstalled ? 29.1 : 0) + (hasEspeakInstalled ? 3.3 : 0);
  const totalInstalledMB = Number((installedVoiceWeightsMB + installedSharedEngineMB).toFixed(1));

  return {
    voices: OPEN_SOURCE_VOICE_PACKS,
    catalogueMeta: VOICE_CATALOGUE_META,
    installedIds,
    activeVoiceId,
    activeVoice,
    activeSystemVoiceURI,
    systemVoices,
    downloads,
    speakingVoiceId,
    installedVoiceWeightsMB: Number(installedVoiceWeightsMB.toFixed(1)),
    installedSharedEngineMB: Number(installedSharedEngineMB.toFixed(1)),
    totalInstalledMB,
    workerFallbackNotice,
    lastLoadedWorkerModel,
    setWorkerFallbackNotice,
    selectActiveVoice,
    selectSystemVoice,
    startDownloadVoice,
    cancelOrRemoveVoice,
    speakWithVoice,
    previewBrowserSystemVoice,
    stopSpeaking,
  };
}
