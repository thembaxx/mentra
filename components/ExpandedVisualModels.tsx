"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { QuestionVisualization } from "@/lib/visualization-schema";
import {
  binomialMass,
  horizontalAcceleration,
  triangleHypotenuse,
} from "@/lib/visualization-schema";

type Geometry = Extract<QuestionVisualization, { type: "right_triangle" }>;
type Forces = Extract<QuestionVisualization, { type: "forces" }>;
type Probability = Extract<QuestionVisualization, { type: "binomial" }>;
type Molecule = Extract<QuestionVisualization, { type: "molecule" }>;

const round = (n: number, digits = 2) => Number(n.toFixed(digits));
const buttonClass =
  "visual-lab-reset inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold";
const buttonFocus =
  " focus-visible:outline-3 focus-visible:outline-[var(--series-blue)] focus-visible:outline-offset-2";

function Control({
  name,
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label htmlFor={name} className="flex min-w-0 flex-col gap-2 text-sm font-semibold">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <output
          htmlFor={name}
          className="visual-lab-output rounded-lg px-2 py-1 font-mono-code text-xs tabular-nums"
        >
          {round(value)}
          {unit}
        </output>
      </span>
      <input
        id={name}
        type="range"
        className="visual-lab-range w-full cursor-pointer"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function RightTriangleModel({ data }: { data: Geometry | null }) {
  const initialA = data?.legA ?? 3;
  const initialB = data?.legB ?? 4;
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const c = triangleHypotenuse(a, b);
  const angle = (Math.atan2(b, a) * 180) / Math.PI;
  const scale = 160 / Math.max(a, b);
  const ax = 125,
    ay = 226;
  const bx = ax + a * scale,
    by = ay;
  const cx = ax,
    cy = ay - b * scale;
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <p className="mb-2 text-xs font-semibold visual-lab-muted">Pythagoras · a² + b² = c²</p>
        <svg
          viewBox="0 0 550 280"
          className="h-auto w-full"
          role="img"
          aria-label={
            "Right angled triangle. Perpendicular legs " +
            a +
            " and " +
            b +
            " centimetres. Hypotenuse " +
            round(c) +
            " centimetres."
          }
        >
          <path
            d={"M" + ax + "," + ay + "L" + bx + "," + by + "L" + cx + "," + cy + "Z"}
            fill="var(--bls)"
            stroke="var(--series-blue)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d={"M" + (ax + 17) + "," + ay + "v-17 h-17"}
            fill="none"
            stroke="var(--series-pink)"
            strokeWidth="2.5"
          />
          {[
            [ax, ay],
            [bx, by],
            [cx, cy],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--series-pink)" />
          ))}
          <text
            x={(ax + bx) / 2}
            y={ay + 27}
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            fill="var(--ink)"
          >
            a = {round(a)} cm
          </text>
          <text
            x={ax - 15}
            y={(ay + cy) / 2}
            textAnchor="end"
            fontSize="15"
            fontWeight="700"
            fill="var(--ink)"
          >
            b = {round(b)}
          </text>
          <text
            x={(bx + cx) / 2 + 18}
            y={(by + cy) / 2 - 8}
            fontSize="15"
            fontWeight="700"
            fill="var(--series-blue)"
          >
            c = {round(c)}
          </text>
          <text x="428" y="86" textAnchor="middle" fontSize="13" fill="var(--mute)">
            Angle at B
          </text>
          <text
            x="428"
            y="118"
            textAnchor="middle"
            fontSize="25"
            fontWeight="800"
            fill="var(--series-pink)"
          >
            {round(angle, 1)}°
          </text>
          <text x="428" y="184" textAnchor="middle" fontSize="13" fill="var(--mute)">
            Opposite · Adjacent
          </text>
          <text x="428" y="206" textAnchor="middle" fontSize="13" fill="var(--ink)">
            tan θ = b/a
          </text>
          <text x="25" y="270" fontSize="12" fill="var(--mute)">
            {reduceMotion
              ? "Move the sliders to change the triangle"
              : "Explore how the triangle changes"}
          </text>
        </svg>
      </div>
      <div className="visual-lab-insight rounded-xl p-3.5 text-sm flex flex-wrap gap-3 items-center justify-between">
        <strong>
          c = √({round(a * a)} + {round(b * b)}) = {round(c)} cm
        </strong>
        <span>Area: {round((a * b) / 2)} cm²</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Control
          name="geometry-leg-a"
          label="Base a"
          value={a}
          min={0.5}
          max={20}
          step={0.5}
          unit=" cm"
          onChange={setA}
        />
        <Control
          name="geometry-leg-b"
          label="Height b"
          value={b}
          min={0.5}
          max={20}
          step={0.5}
          unit=" cm"
          onChange={setB}
        />
      </div>
      <button
        type="button"
        className={buttonClass + buttonFocus}
        onClick={() => {
          setA(initialA);
          setB(initialB);
        }}
      >
        <RotateCcw size={14} /> Reset to {data ? "question" : "example"}
      </button>
    </div>
  );
}

export function ForcesModel({ data }: { data: Forces | null }) {
  const start = data ?? { type: "forces" as const, mass: 5, appliedForce: 30, frictionForce: 10 };
  const [mass, setMass] = useState(start.mass);
  const [applied, setApplied] = useState(start.appliedForce);
  const [friction, setFriction] = useState(start.frictionForce);
  const net = applied - friction;
  const acceleration = horizontalAcceleration(mass, applied, friction);
  const rightLength = 36 + (applied / 500) * 125;
  const leftLength = 36 + (friction / 500) * 125;
  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <p className="mb-2 text-xs font-semibold visual-lab-muted">
          Free-body diagram · level horizontal surface
        </p>
        <svg
          viewBox="0 0 550 255"
          className="h-auto w-full"
          role="img"
          aria-label={
            "Body of mass " +
            mass +
            " kilograms with " +
            applied +
            " newtons force right, " +
            friction +
            " newtons friction left, net force " +
            net +
            " newtons."
          }
        >
          <defs>
            <marker
              id="forces-right-head"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0 0L6 3L0 6Z" fill="var(--series-blue)" />
            </marker>
            <marker
              id="forces-left-head"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0 0L6 3L0 6Z" fill="var(--series-pink)" />
            </marker>
            <marker
              id="forces-up-head"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0 0L6 3L0 6Z" fill="var(--series-green)" />
            </marker>
          </defs>
          <path d="M48 195H502" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" />
          <rect
            x="235"
            y="136"
            width="80"
            height="58"
            rx="10"
            stroke="var(--ink)"
            strokeWidth="1.5"
            fill="var(--bls)"
          />
          <text
            x="275"
            y="167"
            textAnchor="middle"
            fontSize="17"
            fontWeight="800"
            fill="var(--ink)"
          >
            {round(mass)} kg
          </text>
          <line
            x1="316"
            y1="163"
            x2={316 + rightLength}
            y2="163"
            stroke="var(--series-blue)"
            strokeWidth="4"
            markerEnd="url(#forces-right-head)"
          />
          <text
            x={Math.min(495, 316 + rightLength / 2)}
            y="145"
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            fill="var(--series-blue)"
          >
            {round(applied)} N →
          </text>
          <line
            x1="234"
            y1="163"
            x2={234 - leftLength}
            y2="163"
            stroke="var(--series-pink)"
            strokeWidth="4"
            markerEnd="url(#forces-left-head)"
          />
          <text
            x={Math.max(48, 234 - leftLength / 2)}
            y="145"
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            fill="var(--series-pink)"
          >
            ← {round(friction)} N
          </text>
          <line
            x1="275"
            y1="135"
            x2="275"
            y2="57"
            stroke="var(--series-green)"
            strokeWidth="3"
            markerEnd="url(#forces-up-head)"
          />
          <text x="288" y="66" fontSize="12" fill="var(--ink)">
            Normal = mg
          </text>
          <line x1="275" y1="196" x2="275" y2="231" stroke="var(--mute)" strokeWidth="3" />
          <text x="285" y="236" fontSize="12" fill="var(--mute)">
            Weight = mg
          </text>
          <text x="32" y="22" fontSize="12" fill="var(--mute)">
            Arrow lengths illustrate forces; not to scale
          </text>
        </svg>
      </div>
      <div className="visual-lab-insight rounded-xl p-3.5 text-sm flex flex-wrap gap-3 items-center justify-between">
        <strong>Fₙₑₜ = {round(net)} N</strong>
        <span>
          a = Fₙₑₜ / m = <strong>{round(acceleration)} m/s²</strong>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Control
          name="forces-mass"
          label="Mass"
          value={mass}
          min={0.5}
          max={100}
          step={0.5}
          unit=" kg"
          onChange={setMass}
        />
        <Control
          name="forces-applied"
          label="Applied →"
          value={applied}
          min={0}
          max={500}
          step={5}
          unit=" N"
          onChange={setApplied}
        />
        <Control
          name="forces-friction"
          label="Opposing ←"
          value={friction}
          min={0}
          max={500}
          step={5}
          unit=" N"
          onChange={setFriction}
        />
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs visual-lab-muted">
          Model assumes kinetic friction of constant magnitude and no vertical acceleration.
        </p>
        <button
          type="button"
          className={buttonClass + buttonFocus}
          onClick={() => {
            setMass(start.mass);
            setApplied(start.appliedForce);
            setFriction(start.frictionForce);
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}

export function BinomialModel({ data }: { data: Probability | null }) {
  const initialTrials = data?.trials ?? 10;
  const initialProbability = data?.probability ?? 0.3;
  const [trials, setTrials] = useState(initialTrials);
  const [probability, setProbability] = useState(initialProbability);
  const [successes, setSuccesses] = useState(Math.floor(initialTrials * initialProbability));
  const activeSuccesses = Math.min(trials, successes);
  const bars = Array.from({ length: trials + 1 }, (_, k) => binomialMass(trials, probability, k));
  const largest = Math.max(...bars, 0.01);
  const width = 456 / bars.length;
  const selected = bars[activeSuccesses];
  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <p className="mb-2 text-xs font-semibold visual-lab-muted">
          Binomial distribution · P(X = k)
        </p>
        <svg
          viewBox="0 0 550 286"
          className="h-auto w-full"
          role="img"
          aria-label={
            "Binomial probability histogram with " +
            trials +
            " trials and success probability " +
            probability +
            ". Probability of " +
            activeSuccesses +
            " successes is " +
            round(selected * 100, 2) +
            " percent."
          }
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="46"
              x2="510"
              y1={232 - i * 46}
              y2={232 - i * 46}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
          ))}
          {bars.map((value, k) => {
            const height = (value / largest) * 181;
            const x = 50 + k * width;
            return (
              <g key={k}>
                <rect
                  x={x}
                  y={232 - height}
                  height={Math.max(0, height)}
                  width={Math.max(2, width - 3)}
                  rx="3"
                  fill={k === activeSuccesses ? "var(--series-pink)" : "var(--series-blue)"}
                  opacity={k === activeSuccesses ? 1 : 0.65}
                />
                {(bars.length <= 12 || k % 2 === 0) && (
                  <text
                    x={x + (width - 3) / 2}
                    y="252"
                    fontSize="11"
                    textAnchor="middle"
                    fill="var(--mute)"
                  >
                    {k}
                  </text>
                )}
              </g>
            );
          })}
          <text x="50" y="24" fontSize="12" fill="var(--mute)">
            Relative bar height
          </text>
          <text x="505" y="277" fontSize="12" textAnchor="end" fill="var(--mute)">
            k successes
          </text>
        </svg>
      </div>
      <div className="visual-lab-insight rounded-xl p-3.5 flex flex-wrap justify-between gap-3 text-sm">
        <strong>
          P(X = {activeSuccesses}) = {round(selected * 100, 2)}%
        </strong>
        <span>
          Expected: {round(trials * probability)} · Variance:{" "}
          {round(trials * probability * (1 - probability))}
        </span>
      </div>
      <Control
        name="binomial-target"
        label="Highlight k successes"
        value={activeSuccesses}
        min={0}
        max={trials}
        step={1}
        onChange={setSuccesses}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Control
          name="binomial-trials"
          label="Independent trials (n)"
          value={trials}
          min={1}
          max={20}
          step={1}
          onChange={(value) => {
            setTrials(value);
            setSuccesses((k) => Math.min(k, value));
          }}
        />
        <Control
          name="binomial-chance"
          label="Success chance (p)"
          value={probability}
          min={0}
          max={1}
          step={0.05}
          onChange={setProbability}
        />
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs visual-lab-muted">
          Assumes independent trials with constant success probability.
        </p>
        <button
          type="button"
          className={buttonClass + buttonFocus}
          onClick={() => {
            setTrials(initialTrials);
            setProbability(initialProbability);
            setSuccesses(Math.floor(initialTrials * initialProbability));
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}

type InspectAtom = "central" | "outer";
export function MoleculeModel({ data }: { data: Molecule | null }) {
  const [formula, setFormula] = useState<"H2O" | "CO2">(data?.formula ?? "H2O");
  const [inspect, setInspect] = useState<InspectAtom>("central");
  const reducedMotion = useReducedMotion();
  const water = formula === "H2O";
  // The H–O–H vectors form ~104.5°; the O–C–O vectors form 180°.
  const outerPositions = water
    ? [
        [177, 93],
        [363, 93],
      ]
    : [
        [130, 165],
        [410, 165],
      ];
  const center = { x: 270, y: 165 };
  const centralElement = water ? "O" : "C";
  const outerElement = water ? "H" : "O";
  return (
    <div className="space-y-4">
      <div className="visual-lab-plot rounded-2xl p-2.5 sm:p-4">
        <p className="mb-2 text-xs font-semibold visual-lab-muted">
          Simplified ball-and-stick molecular geometry
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.svg
            key={formula}
            viewBox="0 0 550 275"
            role="img"
            aria-label={
              water
                ? "Water molecule with bent H-O-H bond angle of approximately 104.5 degrees"
                : "Carbon dioxide molecule with linear O-C-O bond angle of 180 degrees"
            }
            initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="h-auto w-full"
          >
            {outerPositions.map(([x, y], i) => (
              <g key={i}>
                {water ? (
                  <line
                    x1={center.x}
                    y1={center.y}
                    x2={x}
                    y2={y}
                    stroke="var(--mute)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <line
                      x1={center.x}
                      y1={center.y - 6}
                      x2={x}
                      y2={y - 6}
                      stroke="var(--mute)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1={center.x}
                      y1={center.y + 6}
                      x2={x}
                      y2={y + 6}
                      stroke="var(--mute)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={water ? 24 : 29}
                  fill={water ? "var(--bl)" : "var(--series-pink)"}
                  stroke="var(--ink)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y + 6}
                  textAnchor="middle"
                  fontWeight="800"
                  fontSize="21"
                  fill={water ? "var(--ink)" : "var(--bg)"}
                >
                  {outerElement}
                </text>
              </g>
            ))}
            <circle
              cx={center.x}
              cy={center.y}
              r="34"
              fill={water ? "var(--series-pink)" : "var(--series-blue)"}
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <text
              x={center.x}
              y={center.y + 7}
              textAnchor="middle"
              fontWeight="800"
              fontSize="25"
              fill="var(--bg)"
            >
              {centralElement}
            </text>
            <text
              x="270"
              y="252"
              textAnchor="middle"
              fontSize="15"
              fill="var(--ink)"
              fontWeight="700"
            >
              {formula} · {water ? "Bent, ~104.5°" : "Linear, 180°"}
            </text>
            <text x="24" y="26" fontSize="12" fill="var(--mute)">
              Illustrative bonding; not to scale
            </text>
          </motion.svg>
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Choose molecule"
          className="visual-lab-tabs rounded-xl p-1 flex gap-1"
        >
          {(["H2O", "CO2"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={formula === value}
              className={"visual-lab-tab rounded-lg px-4 py-2 text-xs font-bold " + buttonFocus}
              onClick={() => {
                setFormula(value);
                setInspect("central");
              }}
            >
              {value === "H2O" ? "Water" : "Carbon dioxide"}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Inspect atom" className="flex gap-1">
          {(["central", "outer"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={inspect === value}
              onClick={() => setInspect(value)}
              className={
                (inspect === value ? "visual-lab-play " : "visual-lab-reset ") +
                "rounded-full px-3 py-2 text-xs font-bold " +
                buttonFocus
              }
            >
              {value === "central" ? "Central atom" : "Outer atoms"}
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="visual-lab-insight rounded-xl p-3.5 text-sm">
        <strong>{inspect === "central" ? centralElement : outerElement}</strong>
        {" · "}
        {inspect === "central"
          ? water
            ? "Oxygen has two bonding pairs and two lone pairs, giving a bent molecular shape."
            : "Carbon forms two double bonds to oxygen; the molecule is linear."
          : water
            ? "Hydrogen contributes one electron to each O–H covalent bond."
            : "Each oxygen forms a double bond with carbon and has two lone pairs."}
      </div>
      <p className="text-xs visual-lab-muted">
        Electron-density geometry requires a quantum model; atoms shown here are simplified symbols,
        not orbiting particles.
      </p>
    </div>
  );
}
