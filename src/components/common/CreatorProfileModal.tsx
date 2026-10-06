import React, { useEffect, useState } from 'react';
import {
  X,
  Github,
  Linkedin,
  Mail,
  Globe,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../../hooks';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isGoldPink } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const socialLinks = [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/AniketSB458',
      icon: Github,
      detail: 'github.com/AniketSB458',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/aniket-bandgar-47800532a',
      icon: Linkedin,
      detail: 'linkedin.com/in/aniket-bandgar-47800532a',
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      url: 'https://aniketsb-458-portfolio.vercel.app/',
      icon: Globe,
      detail: 'aniketsb-458-portfolio.vercel.app',
    },
    {
      id: 'email',
      label: 'Email',
      url: 'mailto:anyabandgar458@gmail.com',
      icon: Mail,
      detail: 'anyabandgar458@gmail.com',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
      onClick={onClose}
    >
      {/* Small Profile Grid Card matching user's requested design */}
      <div
        className={`relative w-full max-w-[320px] rounded-3xl p-6 border-2 transition-all transform shadow-xl shadow-pink-500/10 animate-scale-up ${
          isGoldPink
            ? 'bg-[#fffafc] border-[#fbcfe8] text-[#671037]'
            : 'bg-slate-900 border-pink-900/60 text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${
            isGoldPink
              ? 'text-pink-400 hover:text-pink-700 hover:bg-pink-100/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="pr-6">
          <h2
            className={`text-xl font-bold tracking-tight leading-tight ${
              isGoldPink ? 'text-[#671037]' : 'text-pink-100'
            }`}
          >
            Aniket S. Bandgar
          </h2>
          <p
            className={`text-[11px] font-bold tracking-[0.2em] uppercase mt-1 ${
              isGoldPink ? 'text-[#be185d]' : 'text-pink-400'
            }`}
          >
            DEVELOPER
          </p>
        </div>

        {/* Subtle Horizontal Divider */}
        <div
          className={`my-4 border-t ${
            isGoldPink ? 'border-[#fce7f3]' : 'border-slate-800'
          }`}
        />

        {/* Rounded Square Icon Buttons Row */}
        <div className="flex items-center gap-2.5">
          {socialLinks.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.id;
            return (
              <a
                key={item.id}
                href={item.url}
                target={item.id === 'email' ? undefined : '_blank'}
                rel={item.id === 'email' ? undefined : 'noopener noreferrer'}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs ${
                  isGoldPink
                    ? 'bg-[#fce7f3] hover:bg-[#fbcfe8] text-[#be185d]'
                    : 'bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-900/30'
                }`}
                title={`${item.label}: ${item.detail}`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </a>
            );
          })}
        </div>

        {/* Tiny Dynamic Helper on Hover */}
        <div className="mt-3 min-h-[16px] flex items-center justify-between text-[11px]">
          <span
            className={`transition-opacity duration-150 truncate ${
              hoveredItem
                ? isGoldPink
                  ? 'text-[#be185d] font-medium'
                  : 'text-pink-300 font-medium'
                : 'opacity-0'
            }`}
          >
            {socialLinks.find((l) => l.id === hoveredItem)?.detail || ''}
          </span>
          {hoveredItem && (
            <ExternalLink
              className={`w-3 h-3 shrink-0 ml-1 ${
                isGoldPink ? 'text-[#be185d]' : 'text-pink-400'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
};
