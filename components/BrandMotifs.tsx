'use client';

import React from 'react';
import { Zap, Heart, Sparkles, Check, Compass } from 'lucide-react';

export type BrandLogoVariant = 'flow' | 'portal' | 'prism' | 'orbit';

export interface BrandIdentityPreset {
  id: BrandLogoVariant;
  name: string;
  tagline: string;
  inspirationNote: string;
  accentVar: '--pk' | '--bl' | '--yl' | '--gr';
}

export const BRAND_IDENTITY_PRESETS: BrandIdentityPreset[] = [
  {
    id: 'flow',
    name: 'LearnFlow',
    tagline: 'Continuous AI practice that adapts to your momentum',
    inspirationNote: 'Layered tactile ribbon & organic color fields',
    accentVar: '--pk',
  },
  {
    id: 'portal',
    name: 'Mentra',
    tagline: 'Focused concentric mastery for exams, code & fluency',
    inspirationNote: 'Luminous concentric portal rings on deep slate',
    accentVar: '--bl',
  },
  {
    id: 'prism',
    name: 'Lumina',
    tagline: 'Multi-faceted step-by-step reasoning from first principles',
    inspirationNote: 'Faceted golden geometric polyhedron on warm obsidian',
    accentVar: '--yl',
  },
  {
    id: 'orbit',
    name: 'Kinetix',
    tagline: 'Physics-driven study sprints with instant rubric grading',
    inspirationNote: 'Dual-wave horizon & tactile glassmorphic badge',
    accentVar: '--gr',
  },
];

export function BrandSquircleLogo({
  variant = 'flow',
  size = 'md',
  className = '',
}: {
  variant?: BrandLogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const dims =
    size === 'sm'
      ? 'w-8 h-8 rounded-[9px]'
      : size === 'lg'
        ? 'w-14 h-14 rounded-[16px]'
        : size === 'xl'
          ? 'w-20 h-20 rounded-[22px]'
          : 'w-10 h-10 rounded-[12px]';

  if (variant === 'portal') {
    // Inspired by IMG_5047 row 2 col 4: glowing concentric neon pink/blue/white portal rings
    return (
      <div
        className={`relative shrink-0 overflow-hidden inline-flex items-center justify-center select-none ${dims} ${className}`}
        style={{
          background: 'radial-gradient(circle at 30% 25%, #2B3346 0%, #171A24 100%)',
          boxShadow:
            'inset 0 1.5px 2px rgba(255,255,255,0.32), inset 0 -2px 4px rgba(0,0,0,0.55), 0 4px 12px rgba(45,45,43,0.16)',
        }}
        aria-hidden="true"
      >
        <span
          className="absolute w-[78%] h-[78%] rounded-full"
          style={{
            background: 'linear-gradient(135deg, #FFB2DD 0%, #B6CAEB 100%)',
            boxShadow: '0 0 12px rgba(255, 178, 221, 0.65)',
          }}
        />
        <span
          className="absolute w-[56%] h-[56%] rounded-full"
          style={{
            backgroundColor: '#FFFCF5',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
          }}
        />
        <span
          className="absolute w-[30%] h-[30%] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #4A6FA5 0%, #1C1C1A 100%)',
          }}
        />
      </div>
    );
  }

  if (variant === 'prism') {
    // Inspired by IMG_5047 row 4 col 4: faceted golden geometric polyhedron crystal on warm dark squircle
    return (
      <div
        className={`relative shrink-0 overflow-hidden inline-flex items-center justify-center select-none ${dims} ${className}`}
        style={{
          background: 'radial-gradient(circle at 50% 45%, #3A2E1E 0%, #1B1815 100%)',
          boxShadow:
            'inset 0 1.5px 2px rgba(247,214,110,0.45), inset 0 -2px 4px rgba(0,0,0,0.6), 0 4px 12px rgba(45,45,43,0.16)',
        }}
        aria-hidden="true"
      >
        {[0, 30, 60, 90, 120, 150].map((deg, idx) => (
          <span
            key={deg}
            className="absolute w-[28%] h-[76%]"
            style={{
              background:
                idx % 2 === 0
                  ? 'linear-gradient(180deg, #FEEFBF 0%, #F7D66E 55%, #C89628 100%)'
                  : 'linear-gradient(180deg, #FFB2DD 0%, #F7D66E 100%)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: `rotate(${deg}deg)`,
              opacity: 0.92,
            }}
          />
        ))}
        <span
          className="relative z-10 w-[26%] h-[26%] rounded-full"
          style={{
            backgroundColor: '#FFFCF5',
            boxShadow: '0 0 8px rgba(247,214,110,0.9)',
          }}
        />
      </div>
    );
  }

  if (variant === 'orbit') {
    // Inspired by IMG_5047 row 1 col 5 & row 2 col 7: tactile wave horizon & check badge
    return (
      <div
        className={`relative shrink-0 overflow-hidden inline-flex items-center justify-center select-none ${dims} ${className}`}
        style={{
          background: 'linear-gradient(145deg, #FFB2DD 0%, #FAE0E4 52%, #B6CAEB 100%)',
          boxShadow:
            'inset 0 2px 3px rgba(255,255,255,0.75), inset 0 -2px 4px rgba(45,45,43,0.15), 0 4px 12px rgba(45,45,43,0.12)',
        }}
        aria-hidden="true"
      >
        <span
          className="absolute -bottom-2 -left-2 w-[85%] h-[60%] rounded-full"
          style={{
            background: 'linear-gradient(135deg, #9AAB65 0%, #B6CAEB 100%)',
            opacity: 0.85,
          }}
        />
        <span
          className="relative z-10 w-[68%] h-[68%] rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(255, 252, 245, 0.88)',
            boxShadow: '0 2px 6px rgba(45,45,43,0.14)',
            color: '#2D2D2B',
          }}
        >
          <Check className="w-[62%] h-[62%] stroke-[3]" />
        </span>
      </div>
    );
  }

  // Default 'flow' (LearnFlow Ribbon Squircle — combines IMG_5047 row 3 col 5/7 & IMG_5783 Classly squircle)
  return (
    <div
      className={`relative shrink-0 overflow-hidden inline-flex items-center justify-center select-none ${dims} ${className}`}
      style={{
        background: 'linear-gradient(145deg, #2D2D2B 0%, #1C1C1A 100%)',
        boxShadow:
          'inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.45), 0 4px 12px rgba(45,45,43,0.15)',
      }}
      aria-hidden="true"
    >
      {/* Top-right Sage Green sphere */}
      <span
        className="absolute -top-[18%] -right-[18%] w-[62%] h-[62%] rounded-full"
        style={{ backgroundColor: 'var(--gr)' }}
      />
      {/* Bottom-left Marigold Yellow sphere */}
      <span
        className="absolute -bottom-[18%] -left-[16%] w-[56%] h-[56%] rounded-full"
        style={{ backgroundColor: 'var(--yl)' }}
      />
      {/* Central Periwinkle Blue Pillar */}
      <span
        className="absolute right-[22%] bottom-[16%] w-[22%] h-[58%] rounded-full"
        style={{
          background: 'linear-gradient(180deg, #EAF0F9 0%, #B6CAEB 100%)',
          transform: 'rotate(14deg)',
        }}
      />
      {/* Blossom Pink Flow Ribbon */}
      <span
        className="absolute left-[20%] top-[16%] w-[24%] h-[64%] rounded-full"
        style={{
          background: 'linear-gradient(180deg, #FFB2DD 0%, #F794CA 100%)',
          transform: 'rotate(-16deg)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
        }}
      />
      {/* Crossbar Flow Bridge */}
      <span
        className="absolute w-[58%] h-[20%] rounded-full"
        style={{
          background: 'linear-gradient(90deg, #FFB2DD 0%, #FFFCF5 50%, #B6CAEB 100%)',
          transform: 'rotate(-8deg)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
        }}
      />
      {/* Glowing Cream & Gold Knowledge Core */}
      <span
        className="relative z-10 w-[24%] h-[24%] rounded-full"
        style={{
          backgroundColor: '#FFFCF5',
          boxShadow: '0 0 0 2px rgba(247, 214, 110, 0.95)',
        }}
      />
    </div>
  );
}

export function FlowerShape({
  className = 'w-16 h-16',
  color = 'var(--bl)',
  centerColor,
}: {
  className?: string;
  color?: string;
  centerColor?: string;
}) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {angles.map((deg) => (
        <span
          key={deg}
          className="absolute rounded-full"
          style={{
            width: '32%',
            height: '92%',
            backgroundColor: color,
            transform: `rotate(${deg}deg)`,
          }}
        />
      ))}
      {centerColor && (
        <span
          className="relative z-10 rounded-full"
          style={{
            width: '28%',
            height: '28%',
            backgroundColor: centerColor,
          }}
        />
      )}
    </div>
  );
}

export function StarburstShape({
  className = 'w-16 h-16',
  color = 'var(--yl)',
}: {
  className?: string;
  color?: string;
}) {
  const angles = [0, 36, 72, 108, 144];
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {angles.map((deg) => (
        <span
          key={deg}
          className="absolute"
          style={{
            width: '24%',
            height: '96%',
            backgroundColor: color,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            transform: `rotate(${deg}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function SquiggleBoltShape({
  className = 'w-24 h-20',
  waveColor = 'var(--pk)',
  boltColor = 'var(--bl)',
}: {
  className?: string;
  waveColor?: string;
  boltColor?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1">
        <span
          className="w-5 h-14 rounded-full"
          style={{ backgroundColor: waveColor, transform: 'rotate(-12deg)' }}
        />
        <span
          className="w-5 h-16 rounded-full"
          style={{ backgroundColor: waveColor, transform: 'rotate(12deg)' }}
        />
        <span
          className="w-5 h-14 rounded-full"
          style={{ backgroundColor: waveColor, transform: 'rotate(-12deg)' }}
        />
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: boltColor }}
      >
        <Zap className="w-10 h-10 fill-current stroke-[1.5]" />
      </div>
    </div>
  );
}

export function ArrowsMotifShape({
  className = 'w-16 h-16',
  color = 'var(--gr)',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center gap-0.5 select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-4 h-10"
          style={{
            backgroundColor: color,
            clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
          }}
        />
      ))}
    </div>
  );
}

export function HeartCloudMotif({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <span
        className="absolute inset-1 rounded-full"
        style={{ backgroundColor: 'var(--yl)' }}
      />
      <Heart
        className="relative z-10 w-8 h-8 fill-current"
        style={{ color: 'var(--pk)' }}
      />
    </div>
  );
}

export function MentorAvatar({
  name,
  accentVar = '--pk',
  size = 'md',
}: {
  name: string;
  accentVar?: '--pk' | '--bl' | '--yl' | '--gr';
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  const dims =
    size === 'sm'
      ? 'w-11 h-11 text-sm rounded-2xl'
      : size === 'lg'
        ? 'w-16 h-16 text-xl rounded-3xl'
        : 'w-13 h-13 text-base rounded-2xl';

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center font-display font-extrabold select-none ${dims}`}
      style={{
        backgroundColor: `var(${accentVar})`,
        color: '#2D2D2B',
      }}
    >
      <span
        className="absolute -right-2 -top-2 w-6 h-6 rounded-full opacity-55"
        style={{ backgroundColor: '#FFFCF5' }}
      />
      <span
        className="absolute -left-2 -bottom-2 w-7 h-7 rounded-full opacity-40"
        style={{ backgroundColor: 'var(--yl)' }}
      />
      <span className="relative z-10 tracking-tight">{initials}</span>
      <Sparkles className="w-3 h-3 absolute top-1.5 right-1.5 opacity-60" />
    </div>
  );
}
