import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', glow = true }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const pixelMap = {
    sm: 28,
    md: 40,
    lg: 64,
    xl: 96,
  };

  const px = pixelMap[size];

  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}
    >
      {/* Dynamic ambient backdrop glow */}
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 blur-lg opacity-60 animate-pulse pointer-events-none" />
      )}

      {/* High-end vector SVG logo */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="aetherCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          <linearGradient id="aetherRingGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.9" />
          </linearGradient>

          <filter id="aetherGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer squircle glass housing */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          fill="#0D0F18"
          stroke="url(#aetherRingGrad)"
          strokeWidth="2.5"
          strokeOpacity="0.6"
        />

        {/* Orbital rings */}
        <ellipse
          cx="50"
          cy="50"
          rx="34"
          ry="15"
          transform="rotate(-28 50 50)"
          stroke="url(#aetherRingGrad)"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeOpacity="0.75"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="34"
          ry="15"
          transform="rotate(38 50 50)"
          stroke="url(#aetherCoreGrad)"
          strokeWidth="2"
          strokeOpacity="0.6"
        />

        {/* Central glowing reactor / node */}
        <g filter="url(#aetherGlow)">
          <circle cx="50" cy="50" r="14" fill="url(#aetherCoreGrad)" />
          {/* Transmission beam / arrow upward and forward */}
          <path
            d="M50 38L50 58M50 38L43 45M50 38L57 45"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Base pulse dot */}
          <circle cx="50" cy="62" r="2.5" fill="#FFFFFF" />
        </g>

        {/* Orbiting satellite particles */}
        <circle cx="24" cy="38" r="3" fill="#38BDF8" filter="url(#aetherGlow)" />
        <circle cx="76" cy="62" r="3" fill="#A855F7" filter="url(#aetherGlow)" />
      </svg>
    </div>
  );
};
