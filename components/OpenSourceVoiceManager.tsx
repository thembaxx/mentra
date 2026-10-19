'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
} from 'lucide-react';
import {
  useOpenSourceVoices,
  OpenSourceVoicePack,
} from '@/lib/open-source-voices';
import { SpringButton, SPRING_SNAPPY, SPRING_BOUNCY } from './PhysicsUI';

export function OpenSourceVoicePackList({
  onNotify,
  compact = false,
}: {
  onNotify: (msg: string) => void;
  compact?: boolean;
}) {
  const {
    voices,
    installedIds,
    activeVoiceId,
    activeVoice,
    downloads,
    speakingVoiceId,
    totalInstalledMB,
    selectActiveVoice,
    startDownloadVoice,
    cancelOrRemoveVoice,
    speakWithVoice,
  } = useOpenSourceVoices();

  const [filterLocale, setFilterLocale] = useState<'all' | 'installed' | 'en-ZA' | 'nguni' | 'af-ZA'>('all');

  const filteredVoices = voices.filter((v) => {
    if (filterLocale === 'installed') return installedIds.includes(v.id);
    if (filterLocale === 'en-ZA') return v.locale === 'en-ZA';
    if (filterLocale === 'nguni') return v.locale === 'zu-ZA' || v.locale === 'xh-ZA';
    if (filterLocale === 'af-ZA') return v.locale === 'af-ZA';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Summary Banner */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--line)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl grid place-items-center shrink-0"
            style={{ backgroundColor: 'var(--bl)', color: '#2D2D2B' }}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display font-extrabold text-base sm:text-lg">
                Open-Source Neural Voice Packs
              </h4>
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--mute)' }}
              >
                · Active: {activeVoice.name}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--mute)' }}>
              Download local Piper ONNX, Kokoro-82M & Coqui VITS voices for South African STEM & language read-aloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
          <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--mute)' }} />
          <span>{installedIds.length} installed</span>
          <span aria-hidden="true">·</span>
          <span>{totalInstalledMB} MB cached</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {(
          [
            { id: 'all', label: 'All Open-Source Voices (6)' },
            { id: 'installed', label: `Downloaded (${installedIds.length})` },
            { id: 'en-ZA', label: 'SA English (en-ZA)' },
            { id: 'nguni', label: 'isiZulu & isiXhosa' },
            { id: 'af-ZA', label: 'Afrikaans (af-ZA)' },
          ] as const
        ).map((tab) => {
          const active = filterLocale === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterLocale(tab.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
              style={{
                backgroundColor: active ? 'var(--yl)' : 'var(--bg)',
                color: active ? '#2D2D2B' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Voice Pack Cards Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2'} gap-3`}>
        {filteredVoices.map((voice: OpenSourceVoicePack) => {
          const isInstalled = installedIds.includes(voice.id);
          const isActive = activeVoiceId === voice.id;
          const dlState = downloads[voice.id];
          const isDownloading = dlState?.status === 'downloading';
          const isSpeakingThis = speakingVoiceId === voice.id;

          return (
            <motion.div
              key={voice.id}
              layout
              transition={SPRING_SNAPPY}
              className="rounded-2xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden"
              style={{
                backgroundColor: 'var(--bg)',
                border: isActive
                  ? '2px solid var(--pk)'
                  : isInstalled
                    ? '1.5px solid var(--gr)'
                    : '1px solid var(--line)',
              }}
            >
              <div className="space-y-2">
                {/* Top Metadata Line (Unboxed clean metadata per design constitution) */}
                <div
                  className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold"
                  style={{ color: 'var(--mute)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: 'var(--ink)' }}>{voice.engine}</span>
                    <span aria-hidden="true">·</span>
                    <span>{voice.quantization}</span>
                    <span aria-hidden="true">·</span>
                    <span>{voice.locale}</span>
                  </div>
                  <span
                    className="tabular-nums font-extrabold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {voice.sizeMB.toFixed(1)} MB
                  </span>
                </div>

                {/* Title & Region */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-display font-extrabold text-base leading-snug">
                      {voice.name}
                    </h5>
                    {isActive && (
                      <span
                        className="text-[11px] font-extrabold flex items-center gap-1 shrink-0"
                        style={{ color: 'var(--gr)' }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--mute)' }}>
                    {voice.regionTag} · {voice.license} Open Source
                  </p>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--mute)' }}>
                  {voice.description}
                </p>

                {/* Preview Quote Box */}
                <div
                  className="rounded-xl p-2.5 text-[11px] leading-relaxed italic"
                  style={{
                    backgroundColor: 'var(--card)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  “{voice.previewText}”
                </div>
              </div>

              {/* Live Download Progress Bar when downloading */}
              <AnimatePresence mode="popLayout">
                {isDownloading && dlState && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 pt-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                      <span style={{ color: 'var(--ink)' }}>{dlState.stageLabel}</span>
                      <span style={{ color: 'var(--ink)' }}>
                        {dlState.downloadedMB.toFixed(1)} / {voice.sizeMB.toFixed(1)} MB ({dlState.progressPct}%)
                      </span>
                    </div>
                    <div
                      className="w-full h-2.5 rounded-full overflow-hidden p-0.5"
                      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
                    >
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${dlState.progressPct}%` }}
                        transition={SPRING_SNAPPY}
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--gr)' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Action Controls: Preview + Download / Activate / Delete */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
                style={{ borderColor: 'var(--line)' }}
              >
                {/* Preview Voice Button with Animated Waveform */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    speakWithVoice(voice);
                    if (!isSpeakingThis) {
                      onNotify(`Previewing ${voice.name} (${voice.engine})`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSpeakingThis ? '#2D2D2B' : 'var(--card)',
                    color: isSpeakingThis ? '#FFFCF5' : 'var(--ink)',
                    border: '1px solid var(--line)',
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
                            animate={{ height: ['35%', '100%', '45%'] }}
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

                {/* Right Action: Download / Cancel / Use Voice + Uninstall */}
                <div className="flex items-center gap-1.5">
                  {isDownloading ? (
                    <button
                      type="button"
                      onClick={() => {
                        cancelOrRemoveVoice(voice.id);
                        onNotify(`Cancelled ${voice.name} download`);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--pks)',
                        color: 'var(--ink)',
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
                          onNotify(`Selected ${voice.name} as active tutor voice`);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor: isActive ? 'var(--pk)' : 'var(--gr)',
                          color: '#2D2D2B',
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isActive ? 'Selected' : 'Use Voice'}</span>
                      </button>

                      {!voice.defaultInstalled && (
                        <button
                          type="button"
                          onClick={() => {
                            cancelOrRemoveVoice(voice.id);
                            onNotify(
                              `Removed ${voice.name} (${voice.sizeMB.toFixed(1)} MB freed)`
                            );
                          }}
                          className="p-1.5 rounded-xl cursor-pointer"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--mute)',
                            border: '1px solid var(--line)',
                          }}
                          title={`Uninstall ${voice.name} (${voice.sizeMB} MB)`}
                          aria-label={`Uninstall ${voice.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        startDownloadVoice(voice, (completedVoice) => {
                          onNotify(
                            `Downloaded ${completedVoice.name} (${completedVoice.sizeMB} MB) & set as active voice!`
                          );
                        })
                      }
                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer tabular-nums"
                      style={{
                        backgroundColor: 'var(--yl)',
                        color: '#2D2D2B',
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download · {voice.sizeMB.toFixed(1)} MB</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
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
          style={{ backgroundColor: 'rgba(28, 28, 26, 0.65)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={SPRING_BOUNCY}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-[32px] p-6 sm:p-7 space-y-5 shadow-2xl max-h-[88dvh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
                  style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
                >
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
                    Custom Open-Source Neural Voices
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
                    Preview, download & cache South African English, isiZulu, Afrikaans & isiXhosa TTS models
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full cursor-pointer"
                style={{ backgroundColor: 'var(--bg)' }}
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
