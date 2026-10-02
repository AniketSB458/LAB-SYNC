import React from 'react';

export interface RITLogoProps {
  className?: string;
  variant?: 'mark' | 'compact' | 'full' | 'shield';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showSubtitle?: boolean;
}

export const RITLogo: React.FC<RITLogoProps> = ({
  className = 'w-9 h-9',
  variant = 'mark',
  rounded = 'lg',
  showSubtitle = true,
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-lg';

  // Crisp, scalable SVG rendering the official RIT logo
  const svgLogo = (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block select-none"
    >
      {/* Official RIT Vivid Golden Yellow Background */}
      <rect width="400" height="400" fill="#FFC900" />

      {/* 'r' - Left vertical column and top horizontal bar */}
      <rect x="21" y="148" width="18" height="100" fill="#111111" />
      <rect x="21" y="148" width="163" height="19" fill="#111111" />

      {/* 'i' - Red square dot and black vertical stem */}
      <rect x="195" y="116" width="18" height="18" fill="#E11D2A" />
      <rect x="195" y="146" width="18" height="102" fill="#111111" />

      {/* 't' - Ascender vertical stem, crossbar, and lower horizontal bar */}
      <rect x="224" y="116" width="18" height="132" fill="#111111" />
      <rect x="224" y="147" width="163" height="19" fill="#111111" />
      <rect x="224" y="229" width="163" height="19" fill="#111111" />

      {/* Official Subtitle: RAJARAMBAPU INSTITUTE OF TECHNOLOGY */}
      <text
        x="21"
        y="278"
        fill="#111111"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        fontSize="19"
        fontWeight="900"
        letterSpacing="0.4"
        textLength="366"
        lengthAdjust="spacingAndGlyphs"
      >
        RAJARAMBAPU INSTITUTE OF TECHNOLOGY
      </text>
    </svg>
  );

  const emblem = (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden shadow-sm shrink-0 border border-amber-300/40 ring-1 ring-black/5 ${roundedClasses} ${className}`}
      title="Rajarambapu Institute of Technology"
    >
      {svgLogo}
    </div>
  );

  if (variant === 'mark' || variant === 'compact' || variant === 'shield') {
    return emblem;
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      {emblem}
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-sm tracking-tight text-white group-hover:text-amber-400 transition-colors">
            RIT SmartCampus
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
            RIT
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
            Rajarambapu Institute of Technology
          </span>
        )}
      </div>
    </div>
  );
};

export default RITLogo;
