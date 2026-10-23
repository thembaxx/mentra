"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Check,
  Volume2,
  Square,
  Trash2,
  HardDrive,
  Sparkles,
  X,
  Cpu,
  Globe,
  ShieldCheck,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  Radio,
} from "lucide-react";
import {
  useOpenSourceVoices,
  OpenSourceVoicePack,
  VoiceCountryCode,
  VoiceGender,
} from "@/lib/open-source-voices";
import { SpringButton, SPRING_SNAPPY, SPRING_BOUNCY } from "./PhysicsUI";

export function OpenSourceVoicePackList({
  onNotify,
  compact = false,
}: {
  onNotify: (msg: string) => void;
  compact?: boolean;
}) {
  const {
    voices,
    catalogueMeta,
    installedIds,
    activeVoiceId,
    activeVoice,
    activeSystemVoiceURI,
    systemVoices,
    downloads,
    speakingVoiceId,
    installedVoiceWeightsMB,
    installedSharedEngineMB,
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
  } = useOpenSourceVoices();

  const [countryFilter, setCountryFilter] = useState<"all" | "installed" | VoiceCountryCode>("all");
  const [genderFilter, setGenderFilter] = useState<"all" | VoiceGender>("all");
  const [customPreviewText, setCustomPreviewText] = useState<string>(
    "Let us solve x squared minus 6x plus 9 equals 0 step by step with natural pacing.",
  );
  const [showSystemVoices, setShowSystemVoices] = useState<boolean>(false);
  const [showResearchNotes, setShowResearchNotes] = useState<boolean>(false);

  const filteredVoices = voices.filter((v) => {
    if (countryFilter === "installed" && !installedIds.includes(v.id)) return false;
    if (countryFilter !== "all" && countryFilter !== "installed" && v.country !== countryFilter) {
      return false;
    }
    if (genderFilter !== "all" && v.gender !== genderFilter) {
      return false;
    }
    return true;
  });

  const isSelectedPackInstalled = installedIds.includes(activeVoice.id);
  const isSpeakingCustom = speakingVoiceId === activeVoice.id;

  return (
    <div className="space-y-4">
      {/* Top Architecture & Separate Storage Summary Banner */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 mt-0.5"
              style={{ backgroundColor: "var(--bl)", color: "#2D2D2B" }}
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display font-extrabold text-base sm:text-lg">
                  Downloadable Reading Voices
                </h4>
                <span className="text-xs font-bold" style={{ color: "var(--mute)" }}>
                  · Active:{" "}
                  {activeSystemVoiceURI
                    ? `System (${activeSystemVoiceURI})`
                    : activeVoice.displayTitle}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--mute)" }}>
                {catalogueMeta.privacyGuarantee}
              </p>
            </div>
          </div>

          {/* Separate Voice & Shared-Engine Storage Readout */}
          <div
            className="rounded-xl px-3 py-2 text-xs font-bold tabular-nums space-y-0.5"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" style={{ color: "var(--mute)" }} />
              <span>{installedIds.length} voices installed</span>
              <span aria-hidden="true">·</span>
              <span>{totalInstalledMB} MB total</span>
            </div>
            <div className="text-[11px] font-medium" style={{ color: "var(--mute)" }}>
              Voice models: {installedVoiceWeightsMB} MB · Shared engines: {installedSharedEngineMB}{" "}
              MB
            </div>
          </div>
        </div>

        {/* Shared Engine Specs Strip */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t text-[11px]"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">
              English Neural: @diffusionstudio/piper-wasm + ONNX 1.18.0 SIMD
            </span>
            <span className="tabular-nums font-extrabold shrink-0" style={{ color: "var(--mute)" }}>
              29.1 MB shared · ~63 MB/voice
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">Afrikaans Compact: eSpeak-NG Separate GPL-3.0 Worker</span>
            <span className="tabular-nums font-extrabold shrink-0" style={{ color: "var(--mute)" }}>
              3.3 MB shared pack (Male & Female)
            </span>
          </div>
        </div>
      </div>

      {/* Worker Memory / Fallback Notice (if triggered) */}
      <AnimatePresence>
        {workerFallbackNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-3.5 space-y-2"
            style={{
              backgroundColor: "var(--pks)",
              border: "1.5px solid var(--pk)",
              color: "var(--ink)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{workerFallbackNotice.reason}</span>
              </div>
              <button
                type="button"
                onClick={() => setWorkerFallbackNotice(null)}
                className="p-1 rounded-lg cursor-pointer"
                aria-label="Dismiss worker fallback alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const compactPack = voices.find((v) => v.id === "espeak-af-female") || voices[4];
                  if (compactPack) {
                    startDownloadVoice(compactPack, () => {
                      setWorkerFallbackNotice(null);
                      onNotify("Switched to 3.3 MB Compact eSpeak-NG pack fallback");
                    });
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                style={{ backgroundColor: "var(--yl)", color: "#2D2D2B" }}
              >
                Use 3.3 MB Compact Pack Fallback
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstSys = systemVoices[0];
                  selectSystemVoice(firstSys ? firstSys.voiceURI : "default");
                  setWorkerFallbackNotice(null);
                  onNotify("Switched to Browser System SpeechSynthesis fallback");
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                }}
              >
                Use Browser System SpeechSynthesis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country & Gender Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Country Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: `All Voices (${voices.length})` },
              { id: "US", label: "US Accent (2)" },
              { id: "UK", label: "UK Accent (2)" },
              { id: "ZA", label: "Afrikaans · ZA (2)" },
              { id: "installed", label: `Downloaded (${installedIds.length})` },
            ] as const
          ).map((tab) => {
            const active = countryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCountryFilter(tab.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: active ? "var(--yl)" : "var(--bg)",
                  color: active ? "#2D2D2B" : "var(--ink)",
                  border: "1px solid var(--line)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: "var(--mute)" }} />
          {(
            [
              { id: "all", label: "All Genders" },
              { id: "female", label: "Female" },
              { id: "male", label: "Male" },
            ] as const
          ).map((g) => {
            const active = genderFilter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGenderFilter(g.id)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? "var(--pk)" : "var(--bg)",
                  color: active ? "#2D2D2B" : "var(--ink)",
                  border: "1px solid var(--line)",
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom-Text Preview Box (Uses Selected Downloaded Pack, 16px input) */}
      <div
        className="rounded-2xl p-3.5 space-y-2"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold">
            Custom-Text Preview · Selected Pack:{" "}
            <span style={{ color: "var(--ink)" }}>{activeVoice.displayTitle}</span>
            {lastLoadedWorkerModel && (
              <span className="ml-1.5 font-normal" style={{ color: "var(--mute)" }}>
                (Worker model loaded: {lastLoadedWorkerModel})
              </span>
            )}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: "var(--mute)" }}>
            {isSelectedPackInstalled
              ? "Ready offline in blob-backed worker"
              : "Download selected pack to unlock custom-text synthesis"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={customPreviewText}
            onChange={(e) => setCustomPreviewText(e.target.value)}
            placeholder="Type custom text or math formula to preview with selected downloaded pack..."
            aria-label="Custom text preview input"
            className="flex-1 rounded-xl px-3.5 py-2 text-base font-medium focus:outline-2 focus:outline-[var(--pk)]"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!isSelectedPackInstalled && !activeSystemVoiceURI) {
                  onNotify(
                    `Download ${activeVoice.name} first to synthesize custom text, or use the card Preview button for pre-download sample.`,
                  );
                  return;
                }
                speakWithVoice(activeVoice, customPreviewText, {
                  preferRepositorySample: false,
                });
                if (!isSpeakingCustom) {
                  onNotify(`Synthesizing custom text with ${activeVoice.displayTitle}`);
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: isSelectedPackInstalled ? "var(--gr)" : "var(--card)",
                color: isSelectedPackInstalled ? "#2D2D2B" : "var(--mute)",
                border: "1px solid var(--line)",
              }}
            >
              {isSpeakingCustom ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak Custom Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                speakWithVoice(activeVoice, customPreviewText, {
                  simulateWorkerMemoryError: true,
                })
              }
              title="Simulate worker memory pressure on older phones to verify compact/system fallback"
              className="px-2.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--mute)",
                border: "1px solid var(--line)",
              }}
            >
              Test Memory Fallback
            </button>
          </div>
        </div>
      </div>

      {/* Voice Pack Cards Grid */}
      <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-2" : "md:grid-cols-2"} gap-3`}>
        {filteredVoices.map((voice: OpenSourceVoicePack) => {
          const isInstalled = installedIds.includes(voice.id);
          const isActive = activeVoiceId === voice.id && !activeSystemVoiceURI;
          const dlState = downloads[voice.id];
          const isDownloading =
            dlState?.status === "downloading" || dlState?.status === "verifying";
          const isError = dlState?.status === "error";
          const isSpeakingThis = speakingVoiceId === voice.id;

          const isSharedEngineCached = voices.some(
            (v) => v.sharedEngineId === voice.sharedEngineId && installedIds.includes(v.id),
          );

          return (
            <motion.div
              key={voice.id}
              layout
              transition={SPRING_SNAPPY}
              className="rounded-2xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden"
              style={{
                backgroundColor: "var(--bg)",
                border: isActive
                  ? "2px solid var(--pk)"
                  : isInstalled
                    ? "1.5px solid var(--gr)"
                    : "1px solid var(--line)",
              }}
            >
              <div className="space-y-2">
                {/* Top Metadata Line: Engine, Country/Gender & Separate Sizes */}
                <div
                  className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold"
                  style={{ color: "var(--mute)" }}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span style={{ color: "var(--ink)" }}>{voice.engine}</span>
                    <span aria-hidden="true">·</span>
                    <span>{voice.country}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{voice.gender}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {voice.isSyntheticToneVariant ? "Synthetic Tone Variant" : "Neural Recording"}
                    </span>
                  </div>
                  <span className="tabular-nums font-extrabold" style={{ color: "var(--ink)" }}>
                    {voice.voiceSizeMB > 0
                      ? `${voice.voiceSizeMB.toFixed(1)} MB voice + ${voice.sharedEngineSizeMB.toFixed(1)} MB engine`
                      : `${voice.sharedEngineSizeMB.toFixed(1)} MB shared compact pack`}
                  </span>
                </div>

                {/* Title & Active Indicator */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-display font-extrabold text-base leading-snug">
                      {voice.displayTitle}
                    </h5>
                    {isActive && (
                      <span
                        className="text-[11px] font-extrabold flex items-center gap-1 shrink-0"
                        style={{ color: "var(--gr)" }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold mt-0.5"
                    style={{ color: "var(--mute)" }}
                  >
                    <span>{voice.license}</span>
                    <span aria-hidden="true">·</span>
                    <a
                      href={voice.modelCardPath}
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-1 hover:opacity-80"
                      style={{ color: "var(--ink)" }}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Model Card & Licence</span>
                    </a>
                  </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "var(--mute)" }}>
                  {voice.description}
                </p>

                {/* Exact Bytes & SHA-256 Pinned Verification Line */}
                <div
                  className="text-[10px] font-mono-code flex flex-wrap items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--mute)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <span>
                    {voice.modelKey} ({voice.modelBytes.toLocaleString()} B)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[var(--gr)]" />
                    SHA-256: {voice.modelSha256.slice(0, 12)}…
                  </span>
                </div>

                {/* Preview Quote Box */}
                <div
                  className="rounded-xl p-2.5 text-[11px] leading-relaxed italic"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                >
                  “{voice.previewText}”
                </div>
              </div>

              {/* Live Download Progress or Verification Error Feedback */}
              <AnimatePresence mode="popLayout">
                {isDownloading && dlState && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 pt-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                      <span style={{ color: "var(--ink)" }}>{dlState.stageLabel}</span>
                      <span style={{ color: "var(--ink)" }}>
                        {dlState.downloadedMB.toFixed(1)} / {dlState.totalDownloadMB.toFixed(1)} MB
                        ({dlState.progressPct}%)
                      </span>
                    </div>
                    <div
                      className="w-full h-2.5 rounded-full overflow-hidden p-0.5"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)" }}
                    >
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${dlState.progressPct}%` }}
                        transition={SPRING_SNAPPY}
                        className="h-full rounded-full"
                        style={{ backgroundColor: "var(--gr)" }}
                      />
                    </div>
                  </motion.div>
                )}

                {isError && dlState && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl p-2.5 text-[11px] font-bold flex items-center justify-between gap-2"
                    style={{
                      backgroundColor: "var(--pks)",
                      color: "var(--ink)",
                      border: "1px solid var(--pk)",
                    }}
                  >
                    <span>{dlState.errorMessage || dlState.stageLabel}</span>
                    <button
                      type="button"
                      onClick={() => startDownloadVoice(voice)}
                      className="underline font-extrabold cursor-pointer shrink-0"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Action Controls: Pre-Download Preview + Download / Use / Remove */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
                style={{ borderColor: "var(--line)" }}
              >
                {/* Preview Voice Button (Works BEFORE downloading!) */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    speakWithVoice(voice);
                    if (!isSpeakingThis) {
                      onNotify(
                        `Previewing ${voice.displayTitle} (${
                          voice.isNeural ? "Pinned Repository Sample" : "Shipped eSpeak-NG Worker"
                        })`,
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSpeakingThis ? "#2D2D2B" : "var(--card)",
                    color: isSpeakingThis ? "#FFFCF5" : "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                >
                  {isSpeakingThis ? (
                    <>
                      <Square className="w-3 h-3 fill-current text-[var(--pk)]" />
                      <span>Stop Preview</span>
                      <span className="flex items-end gap-0.5 h-3 ml-1" aria-hidden="true">
                        {[0, 1, 2, 3].map((bar) => (
                          <motion.span
                            key={bar}
                            animate={{ height: ["35%", "100%", "45%"] }}
                            transition={{
                              duration: 0.45,
                              repeat: Infinity,
                              delay: bar * 0.1,
                            }}
                            className="w-0.5 rounded-full bg-[var(--yl)]"
                          />
                        ))}
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </>
                  )}
                </motion.button>

                {/* Right Action: Download / Cancel / Use Voice + Remove */}
                <div className="flex items-center gap-1.5">
                  {isDownloading ? (
                    <button
                      type="button"
                      onClick={() => {
                        cancelOrRemoveVoice(voice.id);
                        onNotify(`Cancelled ${voice.name} download & rolled back staged files`);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      style={{
                        backgroundColor: "var(--pks)",
                        color: "var(--ink)",
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  ) : isInstalled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          selectActiveVoice(voice.id);
                          onNotify(`Loaded ${voice.displayTitle} model & config in worker`);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor: isActive ? "var(--pk)" : "var(--gr)",
                          color: "#2D2D2B",
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isActive ? "Selected" : "Use Voice"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          cancelOrRemoveVoice(voice.id);
                          onNotify(
                            `Removed ${voice.displayTitle} & released worker + Cache Storage`,
                          );
                        }}
                        className="p-1.5 rounded-xl cursor-pointer"
                        style={{
                          backgroundColor: "var(--card)",
                          color: "var(--mute)",
                          border: "1px solid var(--line)",
                        }}
                        title={`Remove ${voice.displayTitle} and release worker/storage`}
                        aria-label={`Remove ${voice.displayTitle}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          startDownloadVoice(voice, (completedVoice) => {
                            onNotify(
                              `Verified SHA-256 & installed ${completedVoice.displayTitle} in Cache Storage!`,
                            );
                          })
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer tabular-nums"
                        style={{
                          backgroundColor: "var(--yl)",
                          color: "#2D2D2B",
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          Download ·{" "}
                          {voice.engine === "eSpeak-NG"
                            ? "3.3 MB shared"
                            : isSharedEngineCached
                              ? `${voice.voiceSizeMB.toFixed(1)} MB`
                              : `${voice.voiceSizeMB.toFixed(1)} + ${voice.sharedEngineSizeMB.toFixed(1)} MB`}
                        </span>
                      </motion.button>

                      <button
                        type="button"
                        onClick={() =>
                          startDownloadVoice(voice, undefined, { simulateFailure: true })
                        }
                        title="Simulate SHA-256 / byte-length mismatch to test rollback & failure feedback"
                        className="px-2 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer"
                        style={{
                          backgroundColor: "var(--card)",
                          color: "var(--mute)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        Test Fail
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Browser SpeechSynthesis System Voices & Research Notes Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowSystemVoices((s) => !s)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          style={{
            backgroundColor: showSystemVoices ? "var(--bl)" : "var(--bg)",
            color: showSystemVoices ? "#2D2D2B" : "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Browser SpeechSynthesis System Voices ({systemVoices.length} detected)</span>
        </button>

        <button
          type="button"
          onClick={() => setShowResearchNotes((s) => !s)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          style={{
            backgroundColor: showResearchNotes ? "var(--yl)" : "var(--bg)",
            color: showResearchNotes ? "#2D2D2B" : "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Engine Research & Licence Notes (12 Oct 2026)</span>
        </button>
      </div>

      {/* Browser SpeechSynthesis System Voices Section */}
      <AnimatePresence>
        {showSystemVoices && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-4 space-y-3 overflow-hidden"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="space-y-1">
              <h5 className="font-display font-extrabold text-sm">
                Browser SpeechSynthesis Voices (OS-Managed)
              </h5>
              <p className="text-xs leading-relaxed" style={{ color: "var(--mute)" }}>
                The browser SpeechSynthesis API does not expose pack download size or gender.
                System-provided names, languages, and their local/online flag are listed below.
                Remote system voices may contact their system provider; installation is managed by
                your OS.
              </p>
            </div>

            {systemVoices.length === 0 ? (
              <p className="text-xs italic" style={{ color: "var(--mute)" }}>
                No OS SpeechSynthesis voices reported by this browser environment. Downloaded worker
                packs remain available offline.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {systemVoices.slice(0, 24).map((sv) => {
                  const isSysActive = activeSystemVoiceURI === sv.voiceURI;
                  const isSysSpeaking = speakingVoiceId === sv.id;
                  return (
                    <div
                      key={sv.id}
                      className="rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                      style={{
                        backgroundColor: "var(--card)",
                        border: isSysActive ? "1.5px solid var(--pk)" : "1px solid var(--line)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{sv.name}</div>
                        <div
                          className="text-[11px] flex items-center gap-1.5"
                          style={{ color: "var(--mute)" }}
                        >
                          <span>{sv.lang}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {sv.localService ? "Local OS Service" : "Online / Remote Provider"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => previewBrowserSystemVoice(sv, customPreviewText)}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                          style={{
                            backgroundColor: isSysSpeaking ? "#2D2D2B" : "var(--bg)",
                            color: isSysSpeaking ? "#FFFCF5" : "var(--ink)",
                            border: "1px solid var(--line)",
                          }}
                        >
                          {isSysSpeaking ? "Stop" : "Preview"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            selectSystemVoice(isSysActive ? null : sv.voiceURI);
                            onNotify(
                              isSysActive
                                ? `Reverted to downloaded pack ${activeVoice.displayTitle}`
                                : `Using browser system voice: ${sv.name}`,
                            );
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer"
                          style={{
                            backgroundColor: isSysActive ? "var(--pk)" : "var(--gr)",
                            color: "#2D2D2B",
                          }}
                        >
                          {isSysActive ? "Active" : "Use"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engine Research, Licensing & Exclusions Inspector */}
      <AnimatePresence>
        {showResearchNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-4 space-y-2.5 text-xs overflow-hidden"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="font-display font-extrabold text-sm">
              Researched {catalogueMeta.researchedDate} · Pinned Revision:{" "}
              <span className="font-mono-code">{catalogueMeta.repositoryRevision}</span>
            </div>
            <ul className="list-disc list-inside space-y-1" style={{ color: "var(--mute)" }}>
              <li>
                <strong>Piper Neural English (Linda, John, Cori, Northern English):</strong> First
                three use public-domain training data; Northern English uses CC BY-SA 4.0 data.
                Model-repository weights use MIT licensing.
              </li>
              <li>
                <strong>Excluded Models:</strong> Alan’s all-rights-reserved training card and
                Ryan’s noncommercial dataset were excluded. Kokoro’s larger English-only quantized
                base did not improve Afrikaans coverage.
              </li>
              <li>
                <strong>Worker Isolation & Model Switching:</strong> Neural worker uses{" "}
                <code>@diffusionstudio/piper-wasm</code> + ONNX Runtime Web <code>1.18.0</code>{" "}
                single-thread SIMD and reloads both model and config when changing voices (no global
                singleton). eSpeak-NG Afrikaans stays in a separate GPL-3.0-or-later worker.
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OpenSourceVoiceModal({
  open,
  onClose,
  onNotify,
}: {
  open: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(28, 28, 26, 0.65)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={SPRING_BOUNCY}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-[32px] p-6 sm:p-7 space-y-5 shadow-2xl max-h-[88dvh] overflow-y-auto"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
                  style={{ backgroundColor: "var(--pk)", color: "#2D2D2B" }}
                >
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
                    Downloadable Reading Voices
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: "var(--mute)" }}>
                    Natural Piper ONNX 1.18.0 English voices (Linda, John, Cori, Northern English) &
                    eSpeak-NG Afrikaans compact pack
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full cursor-pointer"
                style={{ backgroundColor: "var(--bg)" }}
                aria-label="Close voice manager"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <OpenSourceVoicePackList onNotify={onNotify} />

            <div className="flex justify-end pt-2">
              <SpringButton variant="pink" size="sm" onClick={onClose}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Done</span>
              </SpringButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
