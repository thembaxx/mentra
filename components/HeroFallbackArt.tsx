"use client";

/**
 * Zero-WebGL decorative fallback for the Mentra learning hero.
 * Shapes reuse the scene's pink, yellow, sage and cream palette so a phone
 * with a lost/unsupported graphics context still gets a deliberate composition.
 * No network requests, canvas allocations, animation loops or 3D dependencies.
 */
export function HeroFallbackArt() {
  return (
    <div
      className="absolute inset-0 z-[1] grid place-items-center overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 640 420"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full max-w-[960px]"
        focusable="false"
      >
        <defs>
          <radialGradient id="mentra-bloom" cx="42%" cy="26%" r="75%">
            <stop offset="0" stopColor="#fff7fc" />
            <stop offset="0.46" stopColor="#FFB2DD" />
            <stop offset="1" stopColor="#D571A7" />
          </radialGradient>
          <linearGradient id="mentra-cream" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E2DEC9" />
          </linearGradient>
          <linearGradient id="mentra-sage" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#C4D5A0" />
            <stop offset="1" stopColor="#78934F" />
          </linearGradient>
          <filter id="mentra-soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="9" stdDeviation="12" floodColor="#2D2D2B" floodOpacity=".13" />
          </filter>
        </defs>
        <g filter="url(#mentra-soft-shadow)">
          <g transform="translate(435 138)">
            {Array.from({ length: 6 }, (_, index) => (
              <ellipse
                key={index}
                cx="0"
                cy="-52"
                rx="27"
                ry="57"
                fill="url(#mentra-bloom)"
                transform={`rotate(${index * 60})`}
                stroke="#F7DAE9"
                strokeWidth="1.5"
              />
            ))}
            <circle r="34" fill="#F7D66E" stroke="#FFF7D7" strokeWidth="7" />
            <circle cx="-9" cy="-11" r="8" fill="#FFF5BD" opacity=".8" />
          </g>
          <g transform="translate(178 132)">
            {Array.from({ length: 8 }, (_, index) => (
              <path
                key={index}
                d="M0 -64 L17 -25 L-17 -25 Z"
                fill={index % 2 === 0 ? "#F7D66E" : "url(#mentra-cream)"}
                transform={`rotate(${index * 45})`}
                stroke="#F4E5C9"
                strokeWidth="1.5"
              />
            ))}
            <circle r="25" fill="url(#mentra-sage)" />
            <circle cx="-6" cy="-7" r="6" fill="#F6F9E8" opacity=".75" />
          </g>
          <g transform="translate(428 307)">
            <path
              d="M-100 18 C-72 -77 -26 -74 -3 10 S69 82 101 -10"
              fill="none"
              stroke="#69864E"
              strokeWidth="27"
              strokeLinecap="round"
            />
            <path
              d="M-100 14 C-72 -77 -26 -74 -3 10 S69 78 101 -14"
              fill="none"
              stroke="#BCD4A1"
              strokeWidth="6"
              strokeLinecap="round"
              opacity=".9"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="54"
              ry="22"
              fill="none"
              stroke="url(#mentra-cream)"
              strokeWidth="13"
              transform="rotate(-24)"
            />
          </g>
          <g transform="translate(173 311) rotate(-12)">
            <rect x="-60" y="4" width="124" height="23" rx="7" fill="#98AE78" />
            <rect x="-57" y="-20" width="124" height="23" rx="7" fill="url(#mentra-cream)" />
            <rect x="-53" y="-44" width="124" height="23" rx="7" fill="#FFB2DD" />
            <path d="M-36 -42 H41" stroke="#F8E8F2" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
        <circle cx="318" cy="84" r="8" fill="#F7D66E" />
        <circle cx="329" cy="312" r="6" fill="#FFB2DD" />
        <circle cx="550" cy="238" r="7" fill="#9AAB65" />
      </svg>
    </div>
  );
}
