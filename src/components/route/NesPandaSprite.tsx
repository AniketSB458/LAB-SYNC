import React from 'react';
import { useTheme } from '../../hooks';

interface NesPandaSpriteProps {
  x: number;
  y: number;
  facing?: 'left' | 'right';
  isWalking?: boolean;
  scale?: number;
  statusText?: string;
  className?: string;
}

/**
 * Authentic 8-bit NES Pixel Art Panda character.
 * Renders a crisp pixel-art panda sprite directly in SVG coordinates,
 * dynamically adapting its bandana, crown/cap, and status chip to the user's selected theme (Gold-Pink, Emerald-Mint, Default).
 */
export const NesPandaSprite: React.FC<NesPandaSpriteProps> = ({
  x,
  y,
  facing = 'right',
  isWalking = false,
  scale = 1.2,
  statusText,
  className = '',
}) => {
  const { isGoldPink, isEmeraldMint } = useTheme();

  // Flip horizontally if facing left
  const transform = `translate(${x}, ${y}) scale(${scale}) ${
    facing === 'left' ? 'scale(-1, 1)' : ''
  }`;

  // Theme-adaptive colors
  const bandanaMain = isGoldPink ? '#ec4899' : isEmeraldMint ? '#10b981' : '#ef4444';
  const bandanaDark = isGoldPink ? '#be185d' : isEmeraldMint ? '#047857' : '#991b1b';
  const bandanaKnot = isGoldPink ? '#f59e0b' : isEmeraldMint ? '#34d399' : '#dc2626';
  const bandanaHighlight = isGoldPink ? '#fbcfe8' : isEmeraldMint ? '#a7f3d0' : '#fca5a5';

  const capMain = isGoldPink ? '#f59e0b' : isEmeraldMint ? '#059669' : '#3b82f6';
  const capDark = isGoldPink ? '#d97706' : isEmeraldMint ? '#047857' : '#1d4ed8';
  const capBadge = isGoldPink ? '#f43f5e' : isEmeraldMint ? '#14b8a6' : '#fbbf24';

  const speechBorder = isGoldPink
    ? 'rgba(244, 114, 182, 0.45)'
    : isEmeraldMint
    ? 'rgba(52, 211, 153, 0.45)'
    : 'rgba(255, 255, 255, 0.25)';

  const speechBg = isGoldPink
    ? 'rgba(28, 17, 24, 0.9)'
    : isEmeraldMint
    ? 'rgba(6, 28, 20, 0.9)'
    : 'rgba(15, 23, 42, 0.9)';

  const cheekColor = isGoldPink ? '#fb7185' : isEmeraldMint ? '#34d399' : '#f43f5e';

  return (
    <g className={`nes-panda-group select-none pointer-events-none ${className}`}>
      {/* Soft ground shadow */}
      <ellipse
        cx={x}
        cy={y + 24 * scale}
        rx={16 * scale}
        ry={6 * scale}
        fill="rgba(0, 0, 0, 0.5)"
        className="filter blur-[2px]"
      />

      {/* Floating status tag above Panda (stays unflipped) */}
      {statusText && (
        <g transform={`translate(${x}, ${y - 34 * scale})`}>
          {/* Glassmorphic speech chip */}
          <rect
            x={-60}
            y={-14}
            width={120}
            height={22}
            rx={11}
            fill={speechBg}
            stroke={speechBorder}
            strokeWidth="1.2"
            className="filter drop-shadow-md"
          />
          <polygon
            points="0,8 -5,14 5,8"
            fill={speechBg}
            stroke={speechBorder}
            strokeWidth="0.8"
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill={isGoldPink ? '#fdf2f8' : isEmeraldMint ? '#ecfdf5' : '#ffffff'}
            className="font-mono tracking-wider"
          >
            {statusText}
          </text>
        </g>
      )}

      {/* NES Panda Pixel Character Group with walking bob */}
      <g
        transform={transform}
        className={isWalking ? 'animate-bounce' : ''}
        style={{ animationDuration: '0.6s' }}
      >
        {/* Centered around 0,0 with 28x28 pixel grid. Pixel size = 1.5 */}
        <g transform="translate(-21, -21)">
          {/* Outer Black Border / Silhouette */}
          {/* Ears */}
          <rect x="3" y="1" width="9" height="9" rx="1" fill="#090d16" />
          <rect x="5" y="3" width="5" height="5" fill="#1e293b" />
          <rect x="6" y="4" width="3" height="3" fill={isGoldPink ? '#f472b6' : '#475569'} />

          <rect x="29" y="1" width="9" height="9" rx="1" fill="#090d16" />
          <rect x="31" y="3" width="5" height="5" fill="#1e293b" />
          <rect x="32" y="4" width="3" height="3" fill={isGoldPink ? '#f472b6' : '#475569'} />

          {/* Head Base - White Pixel Face */}
          <rect x="6" y="7" width="29" height="24" rx="3" fill="#ffffff" stroke="#090d16" strokeWidth="1.5" />
          <rect x="9" y="9" width="23" height="20" fill="#f8fafc" />

          {/* NES Eye Patches (Black angled patches) */}
          <rect x="9" y="13" width="7" height="9" rx="1.5" fill="#090d16" />
          <rect x="10" y="14" width="5" height="7" fill="#1e293b" />
          {/* White glint pupil */}
          <rect x="13" y="15" width="2" height="3" fill="#ffffff" />

          <rect x="25" y="13" width="7" height="9" rx="1.5" fill="#090d16" />
          <rect x="26" y="14" width="5" height="7" fill="#1e293b" />
          {/* White glint pupil */}
          <rect x="26" y="15" width="2" height="3" fill="#ffffff" />

          {/* Cute Rosy Pixel Cheeks */}
          <rect x="6" y="21" width="4" height="3" rx="0.5" fill={cheekColor} opacity="0.85" />
          <rect x="31" y="21" width="4" height="3" rx="0.5" fill={cheekColor} opacity="0.85" />

          {/* Black Nose */}
          <rect x="18.5" y="19" width="4" height="2.5" rx="0.5" fill="#090d16" />

          {/* Cute Smile */}
          <rect x="18" y="23" width="1.5" height="1.5" fill="#090d16" />
          <rect x="19.5" y="24" width="2" height="1" fill="#090d16" />
          <rect x="21.5" y="23" width="1.5" height="1.5" fill="#090d16" />

          {/* Retro NES Theme-Matched Hero Bandana / Scarf */}
          <rect x="8" y="28" width="25" height="4" rx="1" fill={bandanaMain} stroke={bandanaDark} strokeWidth="0.8" />
          {/* Bandana knot fluttering behind */}
          <rect x="4" y="29" width="5" height="3" fill={bandanaMain} />
          <rect x="2" y="31" width="4" height="3" fill={bandanaKnot} />
          <rect x="18" y="29" width="5" height="2" fill={bandanaHighlight} />

          {/* Body / Torso */}
          <rect x="10" y="32" width="21" height="9" rx="2" fill="#ffffff" stroke="#090d16" strokeWidth="1.2" />
          {/* Dark Vest / Arms */}
          <rect x="8" y="32" width="4" height="7" rx="1" fill="#090d16" />
          <rect x="29" y="32" width="4" height="7" rx="1" fill="#090d16" />

          {/* Cute Little Feet */}
          <rect x="12" y="40" width="5" height="3" rx="1" fill="#090d16" />
          <rect x="24" y="40" width="5" height="3" rx="1" fill="#090d16" />

          {/* Head Accessory: Royal Crown in Gold-Pink, Gamer Cap in Emerald / Default */}
          {isGoldPink ? (
            <>
              {/* Royal Golden Pixel Crown */}
              <polygon
                points="13,7 13,1 17,4 20.5,0 24,4 28,1 28,7"
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="0.8"
              />
              <line x1="13" y1="7" x2="28" y2="7" stroke="#b45309" strokeWidth="1.2" />
              {/* Crown Jewels */}
              <circle cx="20.5" cy="4" r="1.2" fill="#f43f5e" />
              <circle cx="16" cy="5" r="0.9" fill="#fde047" />
              <circle cx="25" cy="5" r="0.9" fill="#fde047" />
            </>
          ) : (
            <>
              {/* Retro Gamer Cap */}
              <rect x="12" y="4" width="17" height="5" rx="1" fill={capMain} stroke={capDark} strokeWidth="0.8" />
              <rect x="15" y="2" width="11" height="3" fill={capMain} />
              <rect x="19" y="3" width="3" height="3" fill={capBadge} />
              {/* Cap Visor */}
              <rect x="24" y="7" width="9" height="2.5" rx="0.5" fill={capDark} />
            </>
          )}
        </g>
      </g>
    </g>
  );
};
