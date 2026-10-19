'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, CreditCard, Zap } from 'lucide-react';
import { FlowerShape, StarburstShape } from './BrandMotifs';
import { SpringButton, BouncySurface, SPRING_SNAPPY, SPRING_BOUNCY } from './PhysicsUI';

export function PlansSectionView({
  isPro,
  onUpgradePro,
  onNotify,
}: {
  isPro: boolean;
  onUpgradePro: () => void;
  onNotify: (msg: string) => void;
}) {
  const [billingCycle, setBillingCycle] = useState<'m' | 'y'>('m');
  const [selectedCard, setSelectedCard] = useState<'mc' | 'visa'>('mc');
  const [selectedPack, setSelectedPack] = useState<'32' | '128'>('32');

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2
          className="font-display font-extrabold tracking-tight"
          style={{
            fontSize: 'clamp(38px, 6.5vw, 76px)',
            lineHeight: 0.96,
            textWrap: 'balance',
          }}
        >
          Learn free.
          <br />
          Go deeper with Pro.
        </h2>

        {/* Billing Cycle Toggle with Spring Layout Indicator */}
        <div
          className="inline-flex items-center p-1.5 rounded-full"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          {([
            { id: 'm', label: 'Monthly' },
            { id: 'y', label: 'Yearly, save 33%' },
          ] as const).map((b) => {
            const active = billingCycle === b.id;
            return (
              <motion.button
                key={b.id}
                type="button"
                onClick={() => setBillingCycle(b.id)}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_SNAPPY}
                className="relative px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap"
                style={{ color: active ? '#2D2D2B' : 'var(--ink)' }}
              >
                {active && (
                  <motion.span
                    layoutId="billingTogglePill"
                    transition={SPRING_BOUNCY}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: 'var(--yl)' }}
                  />
                )}
                <span className="relative z-10">{b.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Free vs Pro Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <BouncySurface
          hoverLift={3}
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
          className="rounded-3xl p-7 flex flex-col justify-between gap-6"
        >
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-extrabold">Free</h3>
            <div className="font-display font-extrabold text-5xl sm:text-6xl tracking-tight tabular-nums">
              R0
            </div>
            <ul className="space-y-3 text-sm sm:text-base font-medium pt-2">
              {[
                '5 AI-generated questions a day',
                'Instant grading with KaTeX math rendering',
                'Offline Open-Source SA Voice Packs (Piper / Kokoro)',
                'NSC / IEB STEM, CAPS IT & SA Languages',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <SpringButton variant="soft" className="w-full justify-center" disabled={!isPro}>
            {isPro ? 'Included in your Pro plan' : 'Your current plan'}
          </SpringButton>
        </BouncySurface>

        {/* Pro Plan */}
        <BouncySurface
          hoverLift={5}
          style={{ backgroundColor: 'var(--pk)', color: '#2D2D2B' }}
          className="rounded-3xl p-7 flex flex-col justify-between gap-6 relative"
        >
          <span
            className="absolute -top-3 right-6 px-3.5 py-1 rounded-full text-xs font-extrabold"
            style={{ backgroundColor: 'var(--yl)', color: '#2D2D2B' }}
          >
            Most popular
          </span>

          <div className="space-y-4">
            <h3 className="text-2xl font-display font-extrabold">Pro (SA Learner & Varsity)</h3>
            <div className="font-display font-extrabold text-5xl sm:text-6xl tracking-tight tabular-nums flex items-baseline gap-1">
              <motion.span
                key={billingCycle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_SNAPPY}
              >
                {billingCycle === 'y' ? 'R99' : 'R149'}
              </motion.span>
              <span className="text-base font-medium opacity-75 tracking-normal font-sans">
                {billingCycle === 'y' ? '/mo, billed yearly' : '/mo'}
              </span>
            </div>

            <ul className="space-y-3 text-sm sm:text-base font-medium pt-2">
              {[
                'Unlimited NSC / IEB Paper 1 & 2 STEM questions',
                'Step-by-step KaTeX derivations & NSC formula sheet',
                'Full isiZulu, Afrikaans & SA English voice tutoring',
                '50% off for verified NSFAS & public school learners',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <SpringButton
            variant="blue"
            magnetic
            onClick={onUpgradePro}
            className="w-full justify-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isPro ? 'You’re on Pro (Active)' : 'Start 7-day free trial'}</span>
          </SpringButton>
        </BouncySurface>
      </div>

      {/* Live 1-on-1 Mentor Lesson Pack Top-Up (Inspired by IMG_5789.jpeg) */}
      <div
        className="rounded-3xl p-6 sm:p-7 space-y-5"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-2xl font-display font-extrabold">
              1-on-1 Mentor Lesson Balance
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--mute)' }}>
              Combine unlimited AI practice with live human coaching packs
            </p>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            Current balance: 1 live session remaining
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Methods */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold" style={{ color: 'var(--mute)' }}>
              SA Payment Method (PayFast / Ozow / Card)
            </div>
            {[
              { id: 'mc' as const, label: 'Capitec Pay / Ozow Instant EFT', tag: 'Zero Fees' },
              { id: 'visa' as const, label: 'FNB / Standard Bank Visa ···· 0378', tag: 'Card' },
            ].map((pm) => {
              const active = selectedCard === pm.id;
              return (
                <motion.button
                  key={pm.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCard(pm.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl cursor-pointer text-sm font-semibold"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: active ? '2px solid var(--pk)' : '1px solid var(--line)',
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4" />
                    <span>{pm.label}</span>
                  </span>
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{
                      border: active ? '5px solid var(--pk)' : '1.5px solid var(--mute)',
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Lesson Bundles */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold" style={{ color: 'var(--mute)' }}>
              Select SA Tutor Bundle
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPack('32')}
              className="w-full p-4 rounded-2xl text-left cursor-pointer flex items-center justify-between"
              style={{
                backgroundColor: selectedPack === '32' ? 'var(--pk)' : 'var(--bg)',
                color: selectedPack === '32' ? '#2D2D2B' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <div>
                <div className="font-display font-extrabold text-lg tabular-nums">
                  R180 / lesson · 32 lessons
                </div>
                <div className="text-xs opacity-80">Matric & NBT Intensive · Save 10%</div>
              </div>
              <div className="font-display font-extrabold text-xl tabular-nums">R5,760</div>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPack('128')}
              className="w-full p-4 rounded-2xl text-left cursor-pointer flex items-center justify-between"
              style={{
                backgroundColor: selectedPack === '128' ? 'var(--gr)' : 'var(--bg)',
                color: selectedPack === '128' ? '#2D2D2B' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <div>
                <div className="font-display font-extrabold text-lg tabular-nums">
                  R145 / lesson · 128 lessons
                </div>
                <div className="text-xs opacity-80">Full Year Distinction Pack · Save 25%</div>
              </div>
              <div className="font-display font-extrabold text-xl tabular-nums">R18,560</div>
            </motion.button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <SpringButton
            variant="blue"
            onClick={() =>
              onNotify(
                `Added ${selectedPack}-lesson bundle via ${selectedCard === 'mc' ? 'Capitec Pay / Ozow EFT' : 'Visa 0378'}`
              )
            }
          >
            <Zap className="w-4 h-4" />
            <span>Top up {selectedPack} lessons now</span>
          </SpringButton>
          <SpringButton
            variant="soft"
            onClick={() =>
              onNotify('PayFlex / Float 0% interest-free monthly installment selected')
            }
          >
            Pay via PayFlex (0% interest)
          </SpringButton>
        </div>
      </div>

      {/* Streaming Architecture Code Card matching attached HTML */}
      <div
        className="rounded-3xl p-6 space-y-3"
        style={{ backgroundColor: '#2D2D2B', color: '#F8F3E7' }}
      >
        <div className="font-display font-extrabold text-lg">
          How the server-side AI streaming works
        </div>
        <pre className="overflow-x-auto font-mono-code text-xs sm:text-[13px] leading-relaxed opacity-90">
{`// app/api/tutor/route.ts
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  const { action, topic, difficulty, questionPrompt, userAnswer } = await req.json();
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.8-flash",
    contents: buildPrompt({ action, topic, difficulty, questionPrompt, userAnswer }),
  });
  return new Response(toReadableStream(responseStream), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}`}
        </pre>
      </div>
    </div>
  );
}

export function PaywallModal({
  open,
  reason,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  reason: string;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(45, 45, 43, 0.58)' }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            initial={{ scale: 0.88, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={SPRING_BOUNCY}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-[28px] overflow-hidden shadow-2xl"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
          >
            {/* Geometric Header matching HTML .pwt */}
            <div
              className="relative h-28 overflow-hidden"
              style={{ backgroundColor: 'var(--pk)' }}
            >
              <FlowerShape
                className="w-36 h-36 absolute -right-5 -top-5"
                color="var(--bl)"
              />
              <StarburstShape
                className="w-20 h-20 absolute left-6 top-7"
                color="var(--yl)"
              />
            </div>

            <div className="p-6 space-y-4">
              <h2 id="paywall-title" className="text-3xl font-display font-extrabold">
                Unlock your AI tutor
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
                {reason || 'Upgrade to LearnFlow Pro for unlimited adaptive questions and step-by-step derivations.'}
              </p>

              <ul className="space-y-2.5 text-sm font-semibold py-1">
                {[
                  'Unlimited AI-generated questions',
                  'Step-by-step explanations on every problem',
                  'Deeper model for interactive follow-ups',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 pt-2">
                <SpringButton
                  variant="pink"
                  onClick={onUpgrade}
                  className="w-full justify-center"
                >
                  Start 7-day free trial
                </SpringButton>
                <SpringButton
                  variant="soft"
                  onClick={onClose}
                  className="w-full justify-center"
                >
                  Maybe later
                </SpringButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
