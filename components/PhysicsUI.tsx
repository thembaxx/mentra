'use client';

import React, { useState, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { playSoundCue, SoundCueType } from '@/lib/sound-effects';

export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 20,
  mass: 0.75,
};

export const SPRING_BOUNCY = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 15,
  mass: 0.85,
};

export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
  mass: 1,
};

interface SpringButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'pink' | 'soft' | 'blue' | 'yellow' | 'green' | 'ink' | 'card';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  soundCue?: SoundCueType | false;
  children: React.ReactNode;
}

export function SpringButton({
  variant = 'pink',
  size = 'md',
  magnetic = false,
  soundCue = 'tap',
  className = '',
  children,
  disabled,
  onClick,
  onMouseMove,
  onMouseLeave,
  ...props
}: SpringButtonProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (magnetic && !disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setOffset({
        x: (e.clientX - cx) * 0.14,
        y: (e.clientY - cy) * 0.18,
      });
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (magnetic) {
      setOffset({ x: 0, y: 0 });
    }
    onMouseLeave?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && soundCue) {
      playSoundCue(soundCue);
    }
    onClick?.(e);
  };

  const bgStyles: Record<NonNullable<SpringButtonProps['variant']>, React.CSSProperties> = {
    pink: { backgroundColor: 'var(--pk)', color: '#2D2D2B' },
    soft: { backgroundColor: 'var(--pks)', color: 'var(--ink)' },
    blue: { backgroundColor: 'var(--bl)', color: '#2D2D2B' },
    yellow: { backgroundColor: 'var(--yl)', color: '#2D2D2B' },
    green: { backgroundColor: 'var(--gr)', color: '#2D2D2B' },
    ink: { backgroundColor: 'var(--ink)', color: 'var(--bg)' },
    card: { backgroundColor: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line)' },
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-3.5 py-2 text-xs font-semibold'
      : size === 'lg'
        ? 'px-7 py-4 text-base font-bold'
        : 'px-5 py-3.5 text-[15px] font-semibold';

  return (
    <motion.button
      type="button"
      disabled={disabled}
      animate={{ x: offset.x, y: offset.y }}
      whileHover={
        disabled
          ? undefined
          : {
              scale: 1.03,
              y: offset.y - 2,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale: 0.94,
              y: 1,
            }
      }
      transition={SPRING_SNAPPY}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={bgStyles[variant]}
      className={`inline-flex items-center justify-center gap-2 rounded-full cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-3 focus-visible:outline-[var(--bl)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function ShakeContainer({
  shakeKey,
  className = '',
  children,
}: {
  shakeKey: number;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (shakeKey > 0) {
      playSoundCue('error');
    }
  }, [shakeKey]);

  return (
    <motion.div
      key={shakeKey}
      animate={
        shakeKey > 0
          ? {
              x: [0, -11, 11, -8, 8, -4, 4, 0],
            }
          : { x: 0 }
      }
      transition={{ duration: 0.42, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BouncySurface({
  children,
  className = '',
  style,
  onClick,
  hoverLift = 4,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverLift?: number;
}) {
  const handleSurfaceClick = () => {
    if (onClick) {
      playSoundCue('tap');
      onClick();
    }
  };

  return (
    <motion.div
      onClick={onClick ? handleSurfaceClick : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSurfaceClick();
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-disabled={onClick ? false : undefined}
      whileHover={onClick ? { y: -hoverLift, scale: 1.012 } : undefined}
      whileTap={onClick ? { scale: 0.975, y: 0 } : undefined}
      transition={SPRING_BOUNCY}
      style={style}
      className={onClick ? className + ' cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--series-blue)] focus-visible:outline-offset-2' : className}
    >
      {children}
    </motion.div>
  );
}
