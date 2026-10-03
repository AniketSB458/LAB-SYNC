import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Check, ChevronDown, Palette, Sun, Leaf } from 'lucide-react';
import { useTheme, AppTheme } from '../../hooks';

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showDropdown = true }) => {
  const { theme, setTheme, toggleTheme, isGoldPink, isEmeraldMint } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: Array<{
    id: AppTheme;
    name: string;
    tag: string;
    swatchGrad: string;
    dot1: string;
    dot2: string;
    icon: React.ReactNode;
    activeBorder: string;
    activeBg: string;
  }> = [
    {
      id: 'gold-pink',
      name: 'Gold & Pink',
      tag: 'Default',
      swatchGrad: 'from-amber-200 via-pink-100 to-rose-300',
      dot1: 'bg-amber-400',
      dot2: 'bg-pink-500',
      icon: <Sun className="w-3.5 h-3.5 text-pink-600" />,
      activeBorder: 'border-pink-400 ring-2 ring-pink-400/30 shadow-pink-200/50',
      activeBg: 'bg-pink-50 text-pink-700',
    },
    {
      id: 'default',
      name: 'Cyber Slate',
      tag: 'Indigo',
      swatchGrad: 'from-slate-950 via-slate-900 to-indigo-600',
      dot1: 'bg-indigo-500',
      dot2: 'bg-cyan-400',
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-900/30',
      activeBg: 'bg-indigo-950/40 text-indigo-200',
    },
    {
      id: 'emerald-mint',
      name: 'Emerald Mint',
      tag: 'Mint',
      swatchGrad: 'from-emerald-950 via-slate-900 to-teal-500',
      dot1: 'bg-emerald-500',
      dot2: 'bg-teal-300',
      icon: <Leaf className="w-3.5 h-3.5 text-emerald-400" />,
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-900/30',
      activeBg: 'bg-emerald-950/40 text-emerald-200',
    },
  ];

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (showDropdown) {
            setIsOpen(!isOpen);
          } else {
            toggleTheme();
          }
        }}
        title={`Active: ${currentTheme.name} - Click to switch theme`}
        className={`group relative flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all duration-200 select-none ${
          isGoldPink
            ? 'bg-white border-pink-300 hover:border-pink-400 text-pink-700 shadow-sm shadow-pink-200/50'
            : isEmeraldMint
            ? 'bg-emerald-950/70 border-emerald-500/40 hover:border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/40'
            : 'bg-slate-900/90 border-slate-700/80 hover:border-indigo-500/50 text-slate-300 hover:text-white shadow-md shadow-slate-950/40'
        }`}
        aria-label="Toggle Theme"
        aria-expanded={isOpen}
      >
        {/* Dynamic Orb */}
        <div className="relative flex items-center justify-center shrink-0">
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center shadow-sm p-0.5 border ${
              isGoldPink
                ? 'bg-gradient-to-tr from-amber-300 via-rose-300 to-pink-400 border-pink-300'
                : isEmeraldMint
                ? 'bg-gradient-to-tr from-emerald-900 via-teal-800 to-emerald-500 border-emerald-400/50'
                : 'bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-500 border-indigo-400/50'
            }`}
          >
            {currentTheme.icon}
          </div>

          {/* Ambient Glow */}
          <span
            className={`absolute -inset-1 rounded-full blur-xs -z-10 transition-opacity duration-300 opacity-60 group-hover:opacity-100 ${
              isGoldPink
                ? 'bg-pink-400/40'
                : isEmeraldMint
                ? 'bg-emerald-500/30'
                : 'bg-indigo-500/30'
            }`}
          />
        </div>

        {/* Text Label on sm+ screens */}
        <span className="hidden sm:inline-block text-xs font-bold tracking-tight">
          {currentTheme.name}
        </span>

        {showDropdown && (
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 shrink-0 ${
              isGoldPink ? 'text-pink-600' : isEmeraldMint ? 'text-emerald-400' : 'text-slate-400'
            } ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Small Size Grid Popover Dropdown */}
      {showDropdown && isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`fixed sm:absolute inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-80 rounded-2xl border shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl ${
              isGoldPink
                ? 'bg-white/98 border-pink-200 shadow-pink-900/10 text-slate-800'
                : isEmeraldMint
                ? 'bg-slate-950/98 border-emerald-500/30 shadow-emerald-950/80 text-slate-100'
                : 'bg-slate-950/98 border-slate-800 shadow-slate-950/90 text-slate-100'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between pb-2 mb-2 border-b px-1 text-xs font-bold uppercase tracking-wider ${
                isGoldPink ? 'border-pink-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-extrabold">Appearance Theme</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">3 Themes</span>
            </div>

            {/* Small Size 3-Theme Grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {themes.map((item) => {
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTheme(item.id);
                      setIsOpen(false);
                    }}
                    className={`relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-150 group hover:scale-[1.02] cursor-pointer ${
                      isSelected
                        ? `${item.activeBorder} ${item.activeBg}`
                        : isGoldPink
                        ? 'bg-slate-50/80 border-slate-200/90 hover:bg-pink-50/50 hover:border-pink-200 text-slate-700'
                        : isEmeraldMint
                        ? 'bg-slate-900/60 border-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/30 text-slate-300'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {/* Active Checkmark Pin */}
                    {isSelected && (
                      <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                      </span>
                    )}

                    {/* Small visual swatch badge */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr ${item.swatchGrad} p-1 border border-white/20 shadow-xs flex items-center justify-center gap-0.5 mb-1.5 group-hover:scale-105 transition-transform`}
                    >
                      <span className={`w-2 h-2 rounded-full ${item.dot1} shadow-xs`} />
                      <span className={`w-2 h-2 rounded-full ${item.dot2} shadow-xs`} />
                    </div>

                    {/* Theme Name */}
                    <span className="text-[11px] font-bold leading-tight line-clamp-1">
                      {item.name}
                    </span>

                    {/* Micro Tag */}
                    <span
                      className={`text-[9px] font-mono uppercase font-semibold px-1 py-0.2 rounded mt-1 ${
                        isSelected
                          ? 'bg-white/20 text-current'
                          : isGoldPink
                          ? 'bg-slate-200/70 text-slate-600'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick 1-click toggle hint */}
            <div
              className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] px-1 ${
                isGoldPink ? 'border-pink-100 text-slate-500' : 'border-slate-800/80 text-slate-500'
              }`}
            >
              <span>Quick Cycle</span>
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
                className={`font-semibold hover:underline ${
                  isGoldPink
                    ? 'text-pink-600'
                    : isEmeraldMint
                    ? 'text-emerald-400'
                    : 'text-indigo-400'
                }`}
              >
                Next Theme &rarr;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
