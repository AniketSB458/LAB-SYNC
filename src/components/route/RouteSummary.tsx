import React from 'react';
import { RouteResult } from '../../types';
import { DistanceDisplay, ETADisplay } from './DistanceDisplay';
import { StatusBadge } from '../common';
import {
  Compass,
  CheckCircle2,
  Check,
  ChevronRight,
  Sparkles,
  Footprints,
  MapPin,
  Flag,
} from 'lucide-react';
import { useTheme } from '../../hooks';

interface RouteSummaryProps {
  route: RouteResult;
  currentStepIndex?: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

export const RouteSummary: React.FC<RouteSummaryProps> = ({
  route,
  currentStepIndex = 0,
  onStepChange,
  className = '',
}) => {
  const { isGoldPink, isEmeraldMint } = useTheme();

  // Map node IDs to node names
  const nodeMap = new Map<string, string>();
  route.nodes.forEach((n) => nodeMap.set(n.id, n.name));

  const steps = route.path.map((nodeId) => nodeMap.get(nodeId) || nodeId);
  const totalSteps = steps.length;
  const isAllCompleted = currentStepIndex >= totalSteps - 1 && totalSteps > 1;

  // Theme-adaptive Card Container Styling
  const containerClasses = isGoldPink
    ? 'bg-white/90 border border-pink-200/80 shadow-md text-slate-800 backdrop-blur-md'
    : isEmeraldMint
    ? 'bg-slate-900/80 border border-emerald-500/25 shadow-xl text-slate-100 backdrop-blur-xl'
    : 'glass-panel border border-slate-800 shadow-xl text-slate-100 backdrop-blur-xl';

  const headerBadgeClasses = isGoldPink
    ? 'text-pink-700 bg-pink-100 border-pink-200'
    : isEmeraldMint
    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    : 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';

  const titleColor = isGoldPink ? 'text-slate-900' : 'text-white';
  const subtitleColor = isGoldPink ? 'text-slate-600' : 'text-slate-300/80';
  const counterColor = isGoldPink ? 'text-slate-500' : 'text-slate-400';
  const mapPinColor = isGoldPink ? 'text-pink-500' : isEmeraldMint ? 'text-emerald-400' : 'text-emerald-400';
  const compassColor = isGoldPink ? 'text-pink-500' : isEmeraldMint ? 'text-emerald-400' : 'text-indigo-400';
  const listHeaderColor = isGoldPink ? 'text-slate-700' : 'text-slate-300';
  const borderDivider = isGoldPink ? 'border-pink-100' : 'border-white/10';

  return (
    <div className={`rounded-2xl p-5 sm:p-6 transition-all duration-300 ${containerClasses} ${className}`}>
      {/* Header Info */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${borderDivider}`}>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${headerBadgeClasses}`}
            >
              Turn-by-Turn Waypoints
            </span>
            <span className={`text-xs ${counterColor}`}>
              • Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
            </span>
          </div>
          <h3 className={`text-base sm:text-lg font-bold mt-1 flex items-center gap-2 ${titleColor}`}>
            <MapPin className={`w-4 h-4 shrink-0 ${mapPinColor}`} />
            <span>Path to {route.destination}</span>
          </h3>
          <p className={`text-xs mt-0.5 ${subtitleColor}`}>
            Departing from:{' '}
            <strong className={isGoldPink ? 'text-slate-900' : 'text-white'}>
              {route.source}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DistanceDisplay distanceMeters={route.distanceMeters} />
          <ETADisplay minutes={route.estimatedTravelTimeMinutes} />
          <StatusBadge status={route.routeStatus} size="sm" />
        </div>
      </div>

      {/* Waypoint Trajectory List with Click Completed Interaction */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${listHeaderColor}`}>
            <Compass className={`w-3.5 h-3.5 ${compassColor}`} />
            <span>Campus Trajectory & Corridor Steps</span>
          </h4>
          <span className={`text-[11px] font-mono ${counterColor}`}>
            {isAllCompleted ? '🎉 Arrived' : 'Click "Completed" as you walk'}
          </span>
        </div>

        <div className="space-y-2.5">
          {steps.map((stepName, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === steps.length - 1;
            const isPassed = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            // Compute styling dynamically based on theme
            let cardClasses = '';
            let iconClasses = '';
            let titleClasses = '';
            let descClasses = '';

            if (isCurrent) {
              if (isLast) {
                // Current Destination Step
                if (isGoldPink) {
                  cardClasses =
                    'bg-gradient-to-r from-amber-50 via-pink-50 to-amber-50/80 border-amber-300 shadow-md ring-1 ring-amber-300';
                  iconClasses =
                    'bg-gradient-to-tr from-amber-500 to-pink-500 text-white shadow-sm scale-110';
                  titleClasses = 'text-amber-950 font-bold';
                  descClasses = 'text-amber-800 font-semibold';
                } else if (isEmeraldMint) {
                  cardClasses =
                    'bg-gradient-to-r from-teal-950/45 via-emerald-950/40 to-cyan-950/45 border-teal-400/60 shadow-lg ring-1 ring-teal-400/40 text-teal-200';
                  iconClasses =
                    'bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-md scale-110';
                  titleClasses = 'text-teal-200 font-extrabold';
                  descClasses = 'text-teal-300 font-semibold';
                } else {
                  cardClasses =
                    'bg-gradient-to-r from-indigo-950/45 via-purple-950/40 to-indigo-950/45 border-indigo-400/60 shadow-lg ring-1 ring-indigo-400/40 text-indigo-200';
                  iconClasses =
                    'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md scale-110';
                  titleClasses = 'text-indigo-200 font-extrabold';
                  descClasses = 'text-indigo-300 font-semibold';
                }
              } else {
                // Current Intermediate Step
                if (isGoldPink) {
                  cardClasses =
                    'bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50/70 border-pink-300 shadow-md ring-1 ring-pink-300';
                  iconClasses =
                    'bg-gradient-to-tr from-pink-500 to-amber-500 text-white shadow-sm scale-110';
                  titleClasses = 'text-slate-900 font-bold';
                  descClasses = 'text-pink-800 font-medium';
                } else if (isEmeraldMint) {
                  cardClasses =
                    'bg-gradient-to-r from-emerald-950/45 via-teal-950/35 to-cyan-950/35 border-emerald-400/55 shadow-md ring-1 ring-emerald-400/35';
                  iconClasses =
                    'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md scale-110';
                  titleClasses = 'text-white font-extrabold';
                  descClasses = 'text-emerald-200 font-medium';
                } else {
                  cardClasses =
                    'bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border-indigo-400/50 shadow-md ring-1 ring-indigo-400/30';
                  iconClasses = 'bg-indigo-600 text-white shadow-md scale-110';
                  titleClasses = 'text-white font-extrabold';
                  descClasses = 'text-indigo-200 font-medium';
                }
              }
            } else if (isPassed) {
              // Past / Completed Step
              if (isGoldPink) {
                cardClasses = 'bg-pink-50/45 border-pink-200/80 text-slate-800';
                iconClasses = 'bg-pink-500 text-white shadow-sm';
                titleClasses = 'text-slate-800 font-semibold';
                descClasses = 'text-slate-500';
              } else if (isEmeraldMint) {
                cardClasses = 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200';
                iconClasses = 'bg-emerald-500 text-slate-950 shadow-sm';
                titleClasses = 'text-emerald-300 font-semibold';
                descClasses = 'text-emerald-400/80';
              } else {
                cardClasses = 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200';
                iconClasses = 'bg-emerald-500 text-slate-950 shadow-sm';
                titleClasses = 'text-emerald-300 font-semibold';
                descClasses = 'text-emerald-400/80';
              }
            } else if (isLast) {
              // Upcoming Destination Step
              if (isGoldPink) {
                cardClasses =
                  'bg-amber-50/40 border-amber-200/90 text-slate-800 hover:bg-amber-50/70 hover:border-amber-300';
                iconClasses = 'bg-amber-100 text-amber-800 border border-amber-300';
                titleClasses = 'text-amber-950 font-bold';
                descClasses = 'text-amber-800 font-medium';
              } else if (isEmeraldMint) {
                cardClasses =
                  'bg-emerald-950/20 border-teal-500/30 text-teal-200 hover:bg-emerald-950/30 hover:border-teal-400/50';
                iconClasses = 'bg-teal-500/20 text-teal-300 border border-teal-500/40';
                titleClasses = 'text-teal-200 font-bold';
                descClasses = 'text-teal-300/80 font-medium';
              } else {
                cardClasses =
                  'bg-indigo-950/20 border-indigo-500/30 text-indigo-200 hover:bg-indigo-950/30 hover:border-indigo-400/50';
                iconClasses = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';
                titleClasses = 'text-indigo-200 font-bold';
                descClasses = 'text-indigo-300/80 font-medium';
              }
            } else {
              // Regular Upcoming Step
              if (isGoldPink) {
                cardClasses =
                  'bg-white/60 border-slate-200/80 text-slate-700 hover:bg-pink-50/30 hover:border-pink-200';
                iconClasses = 'bg-slate-100 text-slate-600 border border-slate-200';
                titleClasses = 'text-slate-700 font-medium';
                descClasses = 'text-slate-500';
              } else if (isEmeraldMint) {
                cardClasses =
                  'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:border-slate-700';
                iconClasses = 'bg-white/10 text-slate-400 border border-white/10';
                titleClasses = 'text-slate-300 font-medium';
                descClasses = 'text-slate-400';
              } else {
                cardClasses =
                  'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:border-slate-700';
                iconClasses = 'bg-white/10 text-slate-400 border border-white/10';
                titleClasses = 'text-slate-300 font-medium';
                descClasses = 'text-slate-400';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => onStepChange && onStepChange(idx)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardClasses}`}
              >
                {/* Left Side: Step Circle & Name */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${iconClasses}`}
                  >
                    {isPassed ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <Footprints className="w-4 h-4 text-white animate-pulse" />
                    ) : isLast ? (
                      <Flag className="w-3.5 h-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm ${titleClasses}`}>{stepName}</span>

                      {isCurrent && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono animate-pulse flex items-center gap-1 ${
                            isGoldPink
                              ? 'bg-pink-100 text-pink-700 border-pink-300'
                              : isEmeraldMint
                              ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                              : 'bg-indigo-500/30 text-indigo-300 border-indigo-400/40'
                          }`}
                        >
                          <span>NES Panda Location</span>
                        </span>
                      )}

                      {isPassed && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                            isGoldPink
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          Completed
                        </span>
                      )}

                      {isLast && !isPassed && !isCurrent && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono border ${
                            isGoldPink
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : isEmeraldMint
                              ? 'bg-teal-500/20 text-teal-300 border-teal-400/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                          }`}
                        >
                          Final Destination
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] mt-0.5 ${descClasses}`}>
                      {isFirst
                        ? 'Origin: Proceed through the primary automated campus portal'
                        : isLast
                        ? 'Destination: Enter building facility for workstation check-in'
                        : 'Traverse interconnecting bridge / indoor corridor'}
                    </p>
                  </div>
                </div>

                {/* Right Side Action: "Mark Completed" Button for Active Step */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isCurrent && !isLast && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStepChange) onStepChange(idx + 1);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md border flex items-center gap-1.5 transition-all active:scale-95 ${
                        isGoldPink
                          ? 'bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 border-pink-400 text-white shadow-pink-500/25'
                          : isEmeraldMint
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-emerald-400/40 shadow-emerald-500/35 text-white'
                          : 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 border-emerald-400/30 shadow-emerald-500/30 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  {isCurrent && isLast && (
                    <span
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                        isGoldPink
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : isEmeraldMint
                          ? 'bg-teal-500/25 text-teal-200 border-teal-400/40 shadow-teal-500/25'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>Arrived at Destination!</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
