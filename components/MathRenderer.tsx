'use client';

import React, { useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Copy, Check, Sparkles, Sigma } from 'lucide-react';
import { SpringButton, SPRING_BOUNCY, SPRING_SNAPPY } from './PhysicsUI';
import { playSoundCue } from '@/lib/sound-effects';

interface MathSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

/**
 * Splits a string containing $$...$$ (block) and $...$ (inline) LaTeX into segments.
 * Gracefully handles partial/unclosed $ delimiters while AI text is actively streaming.
 */
function tokenizeMathText(input: string): MathSegment[] {
  if (!input) return [];

  const segments: MathSegment[] = [];
  // Match $$...$$, \[...\], \(...\), or $...$
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?:\\.|[^$\\])+\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: input.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({
        type: 'block-math',
        content: token.slice(2, -2).trim(),
      });
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      segments.push({
        type: 'block-math',
        content: token.slice(2, -2).trim(),
      });
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      segments.push({
        type: 'inline-math',
        content: token.slice(2, -2).trim(),
      });
    } else if (token.startsWith('$') && token.endsWith('$')) {
      segments.push({
        type: 'inline-math',
        content: token.slice(1, -1).trim(),
      });
    } else {
      segments.push({
        type: 'text',
        content: token,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({
      type: 'text',
      content: input.slice(lastIndex),
    });
  }

  return segments;
}

export function MathText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const segments = useMemo(() => tokenizeMathText(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
        }

        const isDisplay = seg.type === 'block-math';
        try {
          const html = katex.renderToString(seg.content, {
            displayMode: isDisplay,
            throwOnError: false,
            strict: false,
            // AI-provided LaTeX must not opt into trusted HTML or URLs.
            trust: false,
          });

          if (isDisplay) {
            return (
              <span
                key={idx}
                className="block my-2.5 py-2 px-3 rounded-xl overflow-x-auto"
                style={{
                  backgroundColor: 'rgba(182, 202, 235, 0.12)',
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          return (
            <span
              key={idx}
              className="inline-block align-baseline mx-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={idx}>{seg.content}</code>;
        }
      })}
    </span>
  );
}

export interface NSCFormulaItem {
  id: string;
  paper: 'Maths Paper 1' | 'Maths Paper 2' | 'Physical Sciences';
  title: string;
  latex: string;
  plainInsert: string;
  topicTag: string;
  note: string;
}

export const SA_NSC_STEM_FORMULAS: NSCFormulaItem[] = [
  {
    id: 'nsc-quad',
    paper: 'Maths Paper 1',
    title: 'Quadratic Roots & Nature of Roots',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}, \\quad \\Delta = b^2 - 4ac',
    plainInsert: 'x = (-b ± √(b² - 4ac)) / (2a)',
    topicTag: 'Quadratic & nature of roots',
    note: 'Real roots when $\\Delta \\ge 0$; equal roots when $\\Delta = 0$; non-real when $\\Delta < 0$.',
  },
  {
    id: 'nsc-calc',
    paper: 'Maths Paper 1',
    title: 'Derivative from First Principles',
    latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}",
    plainInsert: "f'(x) = lim(h→0) [f(x+h) - f(x)] / h",
    topicTag: 'Calculus & cubic graphs',
    note: 'Stationary points occur where $f\'(x) = 0$; point of inflection where $f\'\'(x) = 0$.',
  },
  {
    id: 'nsc-fin-fv',
    paper: 'Maths Paper 1',
    title: 'Future & Present Value Annuities (ZAR)',
    latex: 'F = \\frac{x\\left[(1 + i)^n - 1\\right]}{i}, \\quad P = \\frac{x\\left[1 - (1 + i)^{-n}\\right]}{i}',
    plainInsert: 'P = x[1 - (1 + i)^(-n)] / i',
    topicTag: 'Financial maths (Annuities)',
    note: 'Use $F$ for sinking funds/savings and $P$ for home loans/vehicle finance in Rand ($\\text{R}$).',
  },
  {
    id: 'nsc-seq',
    paper: 'Maths Paper 1',
    title: 'Arithmetic & Geometric Series',
    latex: 'S_n = \\frac{n}{2}\\left[2a + (n-1)d\\right], \\quad S_\\infty = \\frac{a}{1 - r} \\; (|r| < 1)',
    plainInsert: 'Sn = (n/2)[2a + (n-1)d] | S∞ = a / (1 - r)',
    topicTag: 'Sequences & series',
    note: 'A geometric series converges if and only if $-1 < r < 1$.',
  },
  {
    id: 'nsc-circle',
    paper: 'Maths Paper 2',
    title: 'Circle & Analytical Geometry',
    latex: '(x - a)^2 + (y - b)^2 = r^2, \\quad m_{\\text{tangent}} \\cdot m_{\\text{radius}} = -1',
    plainInsert: '(x - a)² + (y - b)² = r²',
    topicTag: 'Analytical & Euclidean geometry',
    note: 'Angle of inclination $\\tan \\theta = m$; perpendicular gradients satisfy $m_1 \\cdot m_2 = -1$.',
  },
  {
    id: 'nsc-trig',
    paper: 'Maths Paper 2',
    title: 'Compound & Double Angle Identities',
    latex: '\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta, \\quad \\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha',
    plainInsert: 'sin(2α) = 2 sin(α)cos(α)',
    topicTag: 'Trigonometry & 3D problems',
    note: 'Cosine rule: $a^2 = b^2 + c^2 - 2bc\\cos A$; Area rule: $\\text{Area} = \\tfrac{1}{2}ab\\sin C$.',
  },
  {
    id: 'nsc-doppler',
    paper: 'Physical Sciences',
    title: 'Doppler Effect & Work-Energy Theorem',
    latex: 'f_L = \\frac{v \\pm v_L}{v \\pm v_S} f_S, \\quad W_{\\text{net}} = \\Delta E_k = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2',
    plainInsert: 'fL = [(v ± vL) / (v ± vS)] * fS',
    topicTag: 'Physical Sciences (Mechanics & Doppler)',
    note: 'Towards: $+v_L$ in numerator, $-v_S$ in denominator. Away: $-v_L$ in numerator, $+v_S$ in denominator.',
  },
  {
    id: 'nsc-electro',
    paper: 'Physical Sciences',
    title: 'Internal Resistance & Photoelectric Effect',
    latex: '\\mathcal{E} = I(R + r), \\quad E = W_0 + E_{k(\\max)} = hf_0 + \\frac{1}{2}mv_{\\max}^2',
    plainInsert: 'ε = I(R + r) | E = W0 + Ek(max)',
    topicTag: 'Physical Sciences (Mechanics & Doppler)',
    note: 'Threshold frequency $f_0 = W_0 / h$ where Planck constant $h = 6.63 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$.',
  },
];

export function NSCFormulaSheetModal({
  open,
  onClose,
  onInsertFormula,
  onSelectTopic,
  onNotify,
}: {
  open: boolean;
  onClose: () => void;
  onInsertFormula: (plainFormula: string) => void;
  onSelectTopic: (topic: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [activePaper, setActivePaper] = useState<
    'All' | 'Maths Paper 1' | 'Maths Paper 2' | 'Physical Sciences'
  >('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = SA_NSC_STEM_FORMULAS.filter(
    (f) => activePaper === 'All' || f.paper === activePaper
  );

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
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={SPRING_BOUNCY}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-[32px] p-6 sm:p-7 space-y-5 shadow-2xl max-h-[88dvh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
                  style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
                >
                  <Sigma className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
                    SA Grade 12 NSC / IEB STEM Formula Sheet
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--mute)' }}>
                    Rendered with KaTeX · Official DBE & IEB Mathematics & Physical Sciences reference
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full cursor-pointer"
                style={{ backgroundColor: 'var(--card)' }}
                aria-label="Close formula sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paper Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Maths Paper 1', 'Maths Paper 2', 'Physical Sciences'] as const).map(
                (paper) => {
                  const active = activePaper === paper;
                  return (
                    <motion.button
                      key={paper}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => {
                        playSoundCue('option');
                        setActivePaper(paper);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--pk)' : 'var(--card)',
                        color: active ? '#2D2D2B' : 'var(--ink)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {paper}
                    </motion.button>
                  );
                }
              )}
            </div>

            {/* KaTeX Formula Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between text-xs font-semibold"
                      style={{ color: 'var(--mute)' }}
                    >
                      <span>{item.paper}</span>
                      <span>·</span>
                      <span>{item.topicTag}</span>
                    </div>

                    <h3 className="font-display font-extrabold text-base sm:text-lg">
                      {item.title}
                    </h3>

                    <div
                      className="rounded-xl p-3 overflow-x-auto"
                      style={{
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <MathText text={`$$${item.latex}$$`} />
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: 'var(--mute)' }}>
                      <MathText text={item.note} />
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        playSoundCue('tap');
                        onInsertFormula(item.plainInsert);
                        setCopiedId(item.id);
                        onNotify(`Inserted formula: ${item.plainInsert}`);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Inserted</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Insert into answer</span>
                        </>
                      )}
                    </button>

                    <SpringButton
                      size="sm"
                      variant="yellow"
                      onClick={() => {
                        onSelectTopic(item.topicTag);
                        onClose();
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Practice Topic</span>
                    </SpringButton>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
