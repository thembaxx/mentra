'use client';

import React from 'react';
import { Zap, Heart, Sparkles } from 'lucide-react';

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
    <div className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`} aria-hidden="true">
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
    <div className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`} aria-hidden="true">
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
    <div className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`} aria-hidden="true">
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
    <div className={`relative inline-flex items-center justify-center gap-0.5 select-none pointer-events-none ${className}`} aria-hidden="true">
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

export function HeartCloudMotif({
  className = 'w-16 h-16',
}: {
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`} aria-hidden="true">
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
