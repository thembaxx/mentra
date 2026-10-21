'use client';

import { useEffect, useId, useState } from 'react';
import type { QuestionVisualization } from '@/lib/visualization-schema';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Atom, ChartLine, Hand, Pause, Play, RotateCcw, Waves, Activity, ArrowLeftRight } from 'lucide-react';
import { MathText } from './MathRenderer';

export type VisualizationMode = QuestionVisualization['type'];

export function getSuggestedVisualization(topic: string): VisualizationMode | null {
  if (/\b(trigonometry|trigonometric|sine|cosine|unit circle|sin|cos)\b/i.test(topic)) {
    return 'trigonometry';
  }
  if (/\b(atom|atomic|electron|nucleus|proton|chemical element)\b/i.test(topic)) {
    return 'atom';
  }
  if (/\b(doppler|sound wave|ambulance)\b/i.test(topic)) return 'doppler';
  if (/\b(linear|straight line|linear equations)\b/i.test(topic)) return 'linear';
  if (/\b(quadratic|parabola|nature of roots)\b/i.test(topic)) {
    return 'quadratic';
  }
  return null;
}

const MODES: { id: VisualizationMode; label: string; icon: typeof ChartLine }[] = [
  { id: 'quadratic', label: 'Functions', icon: ChartLine },
  { id: 'trigonometry', label: 'Unit circle', icon: Waves },
  { id: 'atom', label: 'Atom', icon: Atom },
  { id: 'linear', label: 'Linear', icon: Activity },
  { id: 'doppler', label: 'Doppler', icon: ArrowLeftRight },
];

const X_MIN = -12;
const X_MAX = 12;
const plotX = (x: number) => 280 + x * 21;
const plotY = (y: number) => 152 - y * 16;

function quadraticPath(h: number, k: number, curvature: number): string {
  const points: string[] = [];
  for (let step = 0; step <= 240; step++) {
    const x = X_MIN + (step / 240) * (X_MAX - X_MIN);
    const y = curvature * (x - h) ** 2 + k;
    points.push((step === 0 ? 'M' : 'L') + plotX(x).toFixed(2) + ',' + plotY(y).toFixed(2));
  }
  return points.join(' ');
}

const PARENT_PATH = quadraticPath(0, 0, 1);
const GRID_X = Array.from({ length: 23 }, (_, i) => i - 11);
const GRID_Y = Array.from({ length: 17 }, (_, i) => i - 8);

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 text-sm font-semibold">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <output htmlFor={id} className="rounded-lg px-2 py-1 font-mono-code text-xs tabular-nums visual-lab-output">
          {display}
        </output>
      </span>
      <input
        id={id}
        className="visual-lab-range w-full cursor-pointer"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function QuadraticModel({ data }: { data: Extract<QuestionVisualization, { type: 'quadratic' }> | null }) {
  const initialA = data?.a ?? 1;
  const initialH = data ? -data.b / (2 * data.a) : 3;
  const initialK = data ? data.c - data.b ** 2 / (4 * data.a) : 4;
  const [h, setH] = useState(initialH);
  const [k, setK] = useState(initialK);
  const [a, setA] = useState(initialA);
  const clipId = useId().replace(/:/g, '-');
  const diff = -k / a;
  const roots = Math.abs(k) < 0.001 ? 'One repeated real root'
    : diff > 0 ? 'Two distinct real roots' : 'No real roots';
  const fmt = (value: number) => Number(value.toFixed(2)).toString();
  const equation = '$$f(x) = ' + fmt(a) + '(x ' +
    (h < 0 ? '+ ' + fmt(Math.abs(h)) : '- ' + fmt(h)) + ')^2 ' +
    (k < 0 ? '- ' + fmt(Math.abs(k)) : '+ ' + fmt(k)) + '$$';

  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <span>Explore turning points and roots</span>
          <span className="visual-lab-muted">Dashed: parent function</span>
        </div>
        <svg viewBox="0 0 560 310" role="img" aria-label={'Parabola with turning point at (' + fmt(h) + ', ' + fmt(k) + '). ' + roots} className="h-auto w-full">
          <defs><clipPath id={clipId}><rect x="18" y="8" width="524" height="281" rx="6" /></clipPath></defs>
          <g clipPath={'url(#' + clipId + ')'}>
            {GRID_X.map((x) => <line key={'x' + x} x1={plotX(x)} y1="8" x2={plotX(x)} y2="289" stroke="var(--chart-grid)" />)}
            {GRID_Y.map((y) => <line key={'y' + y} x1="18" y1={plotY(y)} x2="542" y2={plotY(y)} stroke="var(--chart-grid)" />)}
            <line x1="18" y1={plotY(0)} x2="542" y2={plotY(0)} stroke="var(--mute)" strokeWidth="1.5" />
            <line x1={plotX(0)} y1="8" x2={plotX(0)} y2="289" stroke="var(--mute)" strokeWidth="1.5" />
            <path d={PARENT_PATH} stroke="var(--mute)" strokeWidth="2.5" opacity=".45" strokeDasharray="6 7" fill="none" />
            <path d={quadraticPath(h, k, a)} stroke="var(--series-blue)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <line x1={plotX(h)} y1="8" x2={plotX(h)} y2="289" stroke="var(--series-pink)" strokeWidth="1.5" strokeDasharray="4 5" />
            <circle cx={plotX(h)} cy={plotY(k)} r="7" fill="var(--series-pink)" stroke="var(--bg)" strokeWidth="2.5" />
          </g>
          <text x="532" y={plotY(0) - 7} fontSize="12" textAnchor="end" fill="var(--mute)">x</text>
          <text x={plotX(0) + 9} y="19" fontSize="12" fill="var(--mute)">y</text>
          <text x={Math.min(506, Math.max(55, plotX(h) + 12))} y={Math.max(22, Math.min(278, plotY(k) - 13))} fontSize="14" fontWeight="700" fill="var(--series-pink)">
            ({fmt(h)}, {fmt(k)})
          </text>
          <text x="280" y="307" textAnchor="middle" fontSize="11" fill="var(--mute)">Move the sliders to reshape the graph</text>
        </svg>
      </div>
      <div className="visual-lab-insight flex flex-wrap items-center justify-between gap-2 rounded-xl p-3.5">
        <div className="min-w-0 text-sm font-semibold"><MathText text={equation} /></div>
        <span className="text-xs font-bold">{roots}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RangeControl id="visual-shift" label="Horizontal shift" value={h} min={-5} max={5} step={0.1} display={'h = ' + fmt(h)} onChange={setH} />
        <RangeControl id="visual-height" label="Vertical shift" value={k} min={-8} max={8} step={0.1} display={'k = ' + fmt(k)} onChange={setK} />
        <RangeControl id="visual-curvature" label="Curve strength" value={Math.abs(a)} min={0.1} max={5} step={0.1} display={'|a| = ' + fmt(Math.abs(a))} onChange={(value) => setA(Math.sign(a) * value)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input className="visual-lab-check" type="checkbox" checked={a < 0} onChange={(event) => setA(Math.abs(a) * (event.target.checked ? -1 : 1))} />
          Open downwards
        </label>
        <button type="button" className="visual-lab-reset inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold" onClick={() => { setH(initialH); setK(initialK); setA(initialA); }}>
          <RotateCcw size={14} /> Reset to {data ? 'question' : 'example'}
        </button>
      </div>
    </div>
  );
}

const TAU = Math.PI * 2;
const MAX_ANGLE = TAU * 2;
const WAVE_PATH = Array.from({ length: 241 }, (_, i) => {
  const angle = (i / 240) * MAX_ANGLE;
  return (i === 0 ? 'M' : 'L') + (42 + (angle / MAX_ANGLE) * 317).toFixed(2) + ',' + (105 - Math.cos(angle) * 65).toFixed(2);
}).join(' ');

function TrigModel() {
  const [angle, setAngle] = useState(Math.PI / 3);
  const [playing, setPlaying] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!playing || reduceMotion) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setAngle((previous) => previous >= MAX_ANGLE ? 0 : Math.min(MAX_ANGLE, previous + 0.045));
    }, 50);
    return () => window.clearInterval(interval);
  }, [playing, reduceMotion]);

  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const waveX = 42 + (angle / MAX_ANGLE) * 317;
  const waveY = 105 - cosine * 65;
  const circleX = 451 + cosine * 62;
  const circleY = 105 - sine * 62;

  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <p className="mb-3 text-xs font-semibold visual-lab-muted">One angle, two connected views · f(θ) = cos(θ)</p>
        <svg viewBox="0 0 550 222" className="h-auto w-full" role="img" aria-label={'Cosine graph and unit circle at ' + Math.round(angle * 180 / Math.PI) + ' degrees; cosine is ' + cosine.toFixed(2)}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1={42 + i * 317 / 4} y1="27" x2={42 + i * 317 / 4} y2="182" stroke="var(--chart-grid)" />
              <text x={42 + i * 317 / 4} y="202" textAnchor="middle" fontSize="11" fill="var(--mute)">{['0', 'π', '2π', '3π', '4π'][i]}</text>
            </g>
          ))}
          <line x1="42" y1="105" x2="362" y2="105" stroke="var(--mute)" strokeWidth="1.5" />
          <line x1="42" y1="27" x2="42" y2="182" stroke="var(--mute)" strokeWidth="1.5" />
          <text x="32" y="44" fontSize="12" fill="var(--mute)">1</text>
          <text x="24" y="175" fontSize="12" fill="var(--mute)">−1</text>
          <path d={WAVE_PATH} fill="none" stroke="var(--series-blue)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1={waveX} x2={waveX} y1="30" y2="182" stroke="var(--series-pink)" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx={waveX} cy={waveY} r="7" fill="var(--series-pink)" stroke="var(--bg)" strokeWidth="2" />
          <circle cx="451" cy="105" r="62" fill="none" stroke="var(--series-green)" strokeWidth="3.5" />
          <line x1="380" x2="522" y1="105" y2="105" stroke="var(--mute)" />
          <line x1="451" x2="451" y1="33" y2="177" stroke="var(--mute)" />
          <line x1="451" y1="105" x2={circleX} y2={circleY} stroke="var(--series-pink)" strokeWidth="3.5" />
          <line x1={circleX} y1={circleY} x2={circleX} y2="105" stroke="var(--series-blue)" strokeDasharray="4 4" strokeWidth="2" />
          <circle cx={circleX} cy={circleY} r="6.5" fill="var(--series-blue)" stroke="var(--bg)" strokeWidth="2" />
          <text x="451" y="205" textAnchor="middle" fontSize="12" fill="var(--mute)">Unit circle</text>
        </svg>
      </div>
      <div className="visual-lab-insight flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5 text-sm">
        <span>θ = <strong className="font-mono-code tabular-nums">{Math.round(angle * 180 / Math.PI)}°</strong></span>
        <span>cos θ = <strong className="font-mono-code tabular-nums">{cosine.toFixed(2)}</strong></span>
        <span>sin θ = <strong className="font-mono-code tabular-nums">{sine.toFixed(2)}</strong></span>
      </div>
      <RangeControl id="visual-angle" label="Angle θ" min={0} max={MAX_ANGLE} step={0.01} value={angle} display={Math.round(angle * 180 / Math.PI) + '°'} onChange={(value) => { setPlaying(false); setAngle(value); }} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-xs leading-relaxed visual-lab-muted">The unit circle’s horizontal coordinate is cos θ; the moving point shows the same value on the graph.</p>
        <button type="button" disabled={Boolean(reduceMotion)} onClick={() => setPlaying((previous) => !previous)} className="visual-lab-play inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40" aria-label={playing ? 'Pause cosine animation' : 'Play cosine animation'}>
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Animate'}
        </button>
      </div>
    </div>
  );
}

const ELEMENTS = ['', 'Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon'];

function AtomModel() {
  const [atomicNumber, setAtomicNumber] = useState(6);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!playing || reduceMotion) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setPhase((previous) => (previous + 0.035) % TAU);
    }, 50);
    return () => window.clearInterval(interval);
  }, [playing, reduceMotion]);

  const firstShell = Math.min(2, atomicNumber);
  const secondShell = Math.max(0, atomicNumber - 2);
  const electrons = Array.from({ length: atomicNumber }, (_, index) => {
    const inner = index < firstShell;
    const shellIndex = inner ? index : index - firstShell;
    const count = inner ? firstShell : secondShell;
    const radius = inner ? 53 : 103;
    const t = shellIndex * TAU / count + phase * (inner ? 1 : -0.65);
    return { x: 260 + radius * Math.cos(t), y: 132 + radius * Math.sin(t) * 0.72, shell: inner ? 1 : 2 };
  });

  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <p className="mb-2 text-xs font-semibold visual-lab-muted">Explore a simplified electron-shell model</p>
        <svg viewBox="0 0 520 275" className="h-auto w-full" role="img" aria-label={ELEMENTS[atomicNumber] + ': a neutral atom with ' + atomicNumber + ' protons and ' + atomicNumber + ' electrons shown in two shells'}>
          <ellipse cx="260" cy="132" rx="103" ry="74.16" fill="none" stroke="var(--series-blue)" opacity=".45" strokeDasharray="5 6" strokeWidth="1.7" />
          <ellipse cx="260" cy="132" rx="53" ry="38.16" fill="none" stroke="var(--series-green)" opacity=".75" strokeDasharray="5 5" strokeWidth="1.7" />
          <circle cx="260" cy="132" r="24" fill="var(--pk)" opacity=".55" />
          <circle cx="260" cy="132" r="13" fill="var(--series-pink)" />
          <text x="260" y="136" textAnchor="middle" fontWeight="800" fontSize="12" fill="var(--bg)">+{atomicNumber}</text>
          {electrons.map((electron, index) => (
            <circle key={index} cx={electron.x} cy={electron.y} r="7" stroke="var(--bg)" strokeWidth="2.5" fill={electron.shell === 1 ? 'var(--series-green)' : 'var(--series-blue)'}>
              <title>{'Electron ' + (index + 1) + ' · shell ' + electron.shell}</title>
            </circle>
          ))}
          <line x1="286" y1="132" x2="385" y2="132" stroke="var(--mute)" strokeDasharray="3 5" />
          <text x="391" y="136" fontSize="13" fill="var(--ink)">Nucleus</text>
          <text x="260" y="250" textAnchor="middle" fontSize="13" fill="var(--mute)">First shell: {firstShell} · Second shell: {secondShell}</text>
        </svg>
      </div>
      <div className="visual-lab-insight flex flex-wrap items-center justify-between gap-2 rounded-xl p-3.5 text-sm">
        <span className="font-bold">{ELEMENTS[atomicNumber]}</span>
        <span className="visual-lab-muted">{atomicNumber} protons · {atomicNumber} electrons · neutral</span>
      </div>
      <RangeControl id="visual-atomic-number" label="Atomic number" value={atomicNumber} min={1} max={10} display={String(atomicNumber)} onChange={setAtomicNumber} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-xs leading-relaxed visual-lab-muted">Teaching model only: electrons form probability clouds, not literal planetary orbits.</p>
        <button type="button" disabled={Boolean(reduceMotion)} onClick={() => setPlaying((previous) => !previous)} className="visual-lab-play inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40" aria-label={playing ? 'Pause electron animation' : 'Play electron animation'}>
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Animate'}
        </button>
      </div>
    </div>
  );
}

export function InteractiveVisualLab({ topic }: { topic: string }) {
  const suggested = getSuggestedVisualization(topic);
  const [mode, setMode] = useState<VisualizationMode>(suggested ?? 'quadratic');
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="Interactive visual learning lab" className="visual-lab-shell space-y-4 rounded-[26px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="visual-lab-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"><Hand size={18} /></span>
          <div>
            <h3 className="font-display text-lg font-extrabold leading-tight">See how it works</h3>
            <p className="mt-1 text-xs leading-relaxed visual-lab-muted">Move the controls to explore the concept.</p>
          </div>
        </div>
        <span className="visual-lab-tag rounded-full px-3 py-1.5 text-[11px] font-extrabold">Interactive lab</span>
      </div>
      <div role="group" aria-label="Choose a visual model" className="visual-lab-tabs grid grid-cols-3 gap-1 rounded-2xl p-1">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className="visual-lab-tab inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-bold transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:text-xs">
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
          {mode === 'quadratic' ? <QuadraticModel /> : mode === 'trigonometry' ? <TrigModel /> : <AtomModel />}
        </motion.div>
      </AnimatePresence>
      <p className="border-t pt-3 text-[11px] leading-relaxed visual-lab-muted" style={{ borderColor: 'var(--line)' }}>
        Concept explorer · Values are illustrative and may not match the exact question above.
      </p>
    </section>
  );
}
