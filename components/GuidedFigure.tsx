"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { FIGURE_LESSONS, type GuidedFigureMode } from "@/lib/teachable-lessons";

export function GuidedFigure({ mode, children }: { mode: GuidedFigureMode; children: ReactNode }) {
  const [guided, setGuided] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [transfer, setTransfer] = useState<number | null>(null);
  const lesson = FIGURE_LESSONS[mode];
  const reset = () => {
    setPrediction(null);
    setRevealed(false);
    setTransfer(null);
  };
  const choiceClass =
    "visual-lab-tab min-h-11 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">Guided experiment</span>
        <button
          type="button"
          aria-pressed={guided}
          onClick={() => {
            setGuided((value) => !value);
            reset();
          }}
          className="visual-lab-reset min-h-11 rounded-full px-4 text-sm font-bold"
        >
          {guided ? "Exit guide" : "Start guide"}
        </button>
      </div>
      {!guided ? (
        children
      ) : (
        <div className="space-y-4">
          <section aria-label="Predict" className="visual-lab-insight space-y-3 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide visual-lab-muted">
              1 · Predict
            </p>
            <h4 className="text-base font-bold">{lesson.question}</h4>
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="group"
              aria-label="Choose your prediction"
            >
              {lesson.choices.map((choice, index) => (
                <button
                  type="button"
                  key={choice}
                  aria-pressed={prediction === index}
                  className={choiceClass}
                  disabled={prediction !== null}
                  onClick={() => setPrediction(index)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </section>
          {prediction !== null && (
            <>
              <section aria-label="Try" className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide visual-lab-muted">
                  2 · Try
                </p>
                <p className="text-sm visual-lab-muted">{lesson.instruction}</p>
                {children}
                {!revealed && (
                  <button
                    type="button"
                    className="visual-lab-play min-h-11 rounded-full px-4 py-2.5 text-sm font-bold"
                    onClick={() => setRevealed(true)}
                  >
                    Reveal explanation
                  </button>
                )}
              </section>
              {revealed && (
                <section
                  aria-label="Explain"
                  className="visual-lab-insight space-y-3 rounded-xl p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide visual-lab-muted">
                    3 · Explain
                  </p>
                  <p role="status" className="text-sm font-bold">
                    {prediction === lesson.correct ? "Prediction matched." : "Prediction differed."}
                  </p>
                  <p className="text-sm">{lesson.explanation}</p>
                  <h4 className="text-sm font-bold">{lesson.transfer}</h4>
                  <div
                    role="group"
                    aria-label="Apply what you learned"
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {lesson.transferChoices.map((choice, index) => (
                      <button
                        key={choice}
                        type="button"
                        className={choiceClass}
                        aria-pressed={transfer === index}
                        disabled={transfer === lesson.transferCorrect}
                        onClick={() => setTransfer(index)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                  {transfer !== null && (
                    <p role="status" className="text-sm font-semibold">
                      {transfer === lesson.transferCorrect
                        ? "Correct — you can apply the idea."
                        : "Try again after reviewing the explanation."}
                    </p>
                  )}
                  <button
                    type="button"
                    className="visual-lab-reset inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold"
                    onClick={reset}
                  >
                    <RotateCcw size={16} aria-hidden="true" /> Try another prediction
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
