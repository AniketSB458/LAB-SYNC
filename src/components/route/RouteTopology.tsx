import React, { useState, useEffect, useRef } from 'react';
import { RouteNode, RouteEdge } from '../../types';
import {
  Compass,
  MapPin,
  CheckCircle2,
  Play,
  RotateCcw,
  Radio,
  Sparkles,
  ChevronRight,
  Info,
  Footprints,
  Crosshair,
  Award,
} from 'lucide-react';
import { NesPandaSprite } from './NesPandaSprite';
import { useDeviceLocation, useTheme, useAuth } from '../../hooks';
import { recordAuditLog } from '../../services/supabase/auditLog.service';

export interface RouteTopologyProps {
  nodes: RouteNode[];
  edges: RouteEdge[];
  activePath: string[]; // array of node IDs
  sourceNodeId?: string;
  destinationNodeId?: string;
  currentStepIndex?: number;
  onStepChange?: (newIndex: number) => void;
  className?: string;
}

export const RouteTopology: React.FC<RouteTopologyProps> = ({
  nodes,
  edges,
  activePath = [],
  sourceNodeId,
  destinationNodeId,
  currentStepIndex: controlledStepIndex,
  onStepChange,
  className = '',
}) => {
  const { isGoldPink, isEmeraldMint } = useTheme();
  const { user } = useAuth();

  // Support both controlled and uncontrolled step navigation
  const [internalStepIndex, setInternalStepIndex] = useState(0);
  const stepIndex = controlledStepIndex !== undefined ? controlledStepIndex : internalStepIndex;

  const [hoveredNode, setHoveredNode] = useState<RouteNode | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [pandaPos, setPandaPos] = useState<{ x: number; y: number }>({ x: 80, y: 440 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [showCelebration, setShowCelebration] = useState(false);

  // Device Geolocation Hook
  const {
    isTracking,
    latitude,
    longitude,
    accuracy,
    speed,
    isSimulated,
    toggleTracking,
    nearestNode,
  } = useDeviceLocation(nodes);

  // Build node lookup map
  const nodeMap = useRef<Map<string, RouteNode>>(new Map());
  useEffect(() => {
    const map = new Map<string, RouteNode>();
    nodes.forEach((n) => map.set(n.id, n));
    nodeMap.current = map;
  }, [nodes]);

  // Sync panda position whenever stepIndex changes
  useEffect(() => {
    if (!activePath.length) return;
    const currentNodeId = activePath[stepIndex] || activePath[0];
    const node = nodeMap.current.get(currentNodeId);
    if (node) {
      // Determine facing direction toward next node if available
      const nextNodeId = activePath[stepIndex + 1];
      if (nextNodeId) {
        const nextNode = nodeMap.current.get(nextNodeId);
        if (nextNode) {
          setFacing(nextNode.x >= node.x ? 'right' : 'left');
        }
      }

      setIsWalking(true);
      setPandaPos({ x: node.x, y: node.y });
      const timer = setTimeout(() => setIsWalking(false), 800);

      // Check if arrived at destination
      if (stepIndex === activePath.length - 1 && activePath.length > 1) {
        setShowCelebration(true);
        const celebTimer = setTimeout(() => setShowCelebration(false), 4500);

        const destNode = nodeMap.current.get(activePath[stepIndex])?.name || activePath[stepIndex];
        recordAuditLog({
          action: 'CAMPUS_WAYFINDING_DESTINATION_REACHED',
          actorId: user?.id,
          actorName: user?.name,
          actorRole: user?.role,
          actorEmail: user?.email,
          correlationId: `corr-dest-${Date.now()}`,
          after: {
            destination: destNode,
            totalSteps: activePath.length,
            email: user?.email,
            userEmail: user?.email,
            actorEmail: user?.email,
            timestamp: new Date().toISOString(),
          },
        }).catch((e) => console.warn('Supabase destination audit notice:', e));

        return () => {
          clearTimeout(timer);
          clearTimeout(celebTimer);
        };
      }

      return () => clearTimeout(timer);
    }
  }, [stepIndex, activePath, user]);

  // Handle advancing to next step
  const handleNextStep = () => {
    if (stepIndex < activePath.length - 1) {
      const nextIdx = stepIndex + 1;
      const nextNodeName = nodeMap.current.get(activePath[nextIdx])?.name || activePath[nextIdx];
      
      // Stream step completion to Supabase Realtime
      recordAuditLog({
        action: 'CAMPUS_WAYFINDING_STEP_COMPLETED',
        actorId: user?.id,
        actorName: user?.name,
        actorRole: user?.role,
        actorEmail: user?.email,
        correlationId: `corr-waypoint-${nextIdx}-${Date.now()}`,
        after: {
          stepIndex: nextIdx + 1,
          totalSteps: activePath.length,
          arrivedAtWaypoint: nextNodeName,
          email: user?.email,
          userEmail: user?.email,
          actorEmail: user?.email,
          timestamp: new Date().toISOString(),
        },
      }).catch((e) => console.warn('Supabase audit notice:', e));

      if (onStepChange) onStepChange(nextIdx);
      else setInternalStepIndex(nextIdx);
    }
  };

  // Handle resetting navigation to start
  const handleReset = () => {
    setIsAutoWalking(false);
    setShowCelebration(false);
    if (onStepChange) onStepChange(0);
    else setInternalStepIndex(0);
  };

  // Handle snapping to user's real device location
  const handleSnapToDevice = () => {
    const nearest = nearestNode();
    if (nearest && activePath.includes(nearest.id)) {
      const idx = activePath.indexOf(nearest.id);
      if (onStepChange) onStepChange(idx);
      else setInternalStepIndex(idx);
    } else if (nearest) {
      setPandaPos({ x: nearest.x, y: nearest.y });
    }
  };

  // Auto-walk simulator effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoWalking) {
      interval = setInterval(() => {
        if (stepIndex < activePath.length - 1) {
          const nextIdx = stepIndex + 1;
          if (onStepChange) onStepChange(nextIdx);
          else setInternalStepIndex(nextIdx);
        } else {
          setIsAutoWalking(false);
        }
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isAutoWalking, stepIndex, activePath.length, onStepChange]);

  // Check if an edge is in the active path
  const isEdgeInPath = (edge: RouteEdge): boolean => {
    if (activePath.length < 2) return false;
    for (let i = 0; i < activePath.length - 1; i++) {
      const u = activePath[i];
      const v = activePath[i + 1];
      if ((edge.from === u && edge.to === v) || (edge.from === v && edge.to === u)) {
        return true;
      }
    }
    return false;
  };

  // Current and next node objects
  const currentNode = activePath[stepIndex]
    ? nodeMap.current.get(activePath[stepIndex])
    : null;
  const nextNode = activePath[stepIndex + 1]
    ? nodeMap.current.get(activePath[stepIndex + 1])
    : null;
  const destinationNode = activePath.length
    ? nodeMap.current.get(activePath[activePath.length - 1])
    : null;

  const totalSteps = activePath.length;
  const progressPercent =
    totalSteps > 1 ? Math.round((stepIndex / (totalSteps - 1)) * 100) : 0;
  const isCompleted = stepIndex >= totalSteps - 1 && totalSteps > 1;

  // Outer container background styling
  const containerStyle: React.CSSProperties = {
    background: isGoldPink
      ? 'radial-gradient(ellipse at 12% 12%, rgba(251, 191, 36, 0.32) 0%, transparent 48%), radial-gradient(ellipse at 88% 88%, rgba(244, 63, 94, 0.35) 0%, transparent 48%), radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 60%), linear-gradient(135deg, #2b0b1e 0%, #1f0816 45%, #380f27 100%)'
      : isEmeraldMint
      ? 'radial-gradient(ellipse at 15% 15%, rgba(16, 185, 129, 0.28) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(20, 184, 166, 0.3) 0%, transparent 50%), linear-gradient(135deg, #062118 0%, #03140e 50%, #08291f 100%)'
      : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.65) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: isGoldPink
      ? '1.5px solid rgba(244, 114, 182, 0.45)'
      : isEmeraldMint
      ? '1.5px solid rgba(52, 211, 153, 0.4)'
      : '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: isGoldPink
      ? '0 25px 60px -10px rgba(244, 63, 94, 0.45), 0 0 45px rgba(251, 191, 36, 0.25), inset 0 1px 2px rgba(254, 205, 211, 0.4)'
      : isEmeraldMint
      ? '0 25px 60px -10px rgba(16, 185, 129, 0.4), 0 0 35px rgba(20, 184, 166, 0.2), inset 0 1px 2px rgba(167, 243, 208, 0.3)'
      : '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
  };

  const headerBarBg = isGoldPink
    ? 'bg-gradient-to-r from-pink-950/85 via-rose-950/75 to-amber-950/80 border-b border-pink-400/35'
    : isEmeraldMint
    ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-emerald-950/80 border-b border-emerald-400/30'
    : 'bg-slate-900/40 border-b border-white/10';

  const footerBarBg = isGoldPink
    ? 'bg-gradient-to-r from-pink-950/85 via-rose-950/75 to-amber-950/80 border-t border-pink-400/35'
    : isEmeraldMint
    ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-emerald-950/80 border-t border-emerald-400/30'
    : 'bg-slate-900/50 border-t border-white/10';

  const headerIconGradient = isGoldPink
    ? 'from-amber-400 via-rose-500 to-pink-600 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
    : isEmeraldMint
    ? 'from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
    : 'from-indigo-600 to-violet-500 shadow-lg';

  const engineBadgeStyle = isGoldPink
    ? 'bg-gradient-to-r from-amber-500/25 to-pink-500/25 text-amber-200 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
    : isEmeraldMint
    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

  const progressBarGradient = isGoldPink
    ? 'from-amber-400 via-rose-500 to-pink-500 shadow-[0_0_16px_rgba(251,191,36,0.7)]'
    : isEmeraldMint
    ? 'from-emerald-400 via-teal-500 to-cyan-400 shadow-[0_0_16px_rgba(16,185,129,0.7)]'
    : 'from-emerald-400 via-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]';

  const markCompletedBtnStyle = isGoldPink
    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 border border-amber-300/50 shadow-[0_4px_25px_rgba(244,63,94,0.45)] text-white font-extrabold'
    : isEmeraldMint
    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border border-teal-300/50 shadow-[0_4px_25px_rgba(16,185,129,0.45)] text-white font-extrabold'
    : 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 border border-emerald-400/30 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-bold';

  const celebrationBadgeStyle = isGoldPink
    ? 'from-amber-400 via-rose-500 to-pink-600 shadow-[0_0_45px_rgba(244,63,94,0.6)]'
    : isEmeraldMint
    ? 'from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
    : 'from-emerald-500 to-teal-400 shadow-[0_0_40px_rgba(16,185,129,0.5)]';

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${className}`}
      style={containerStyle}
    >
      {/* Radiant Ambient Glass Glow Orbs */}
      <div
        className={`absolute -top-28 -left-28 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isGoldPink
            ? 'bg-gradient-to-br from-amber-400/30 to-pink-500/25'
            : isEmeraldMint
            ? 'bg-gradient-to-br from-emerald-400/30 to-teal-500/25'
            : 'bg-indigo-500/15'
        }`}
      />
      <div
        className={`absolute -bottom-28 -right-28 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isGoldPink
            ? 'bg-gradient-to-tl from-rose-500/35 to-pink-600/30'
            : isEmeraldMint
            ? 'bg-gradient-to-tl from-teal-500/35 to-cyan-600/30'
            : 'bg-emerald-500/15'
        }`}
      />

      {/* Top Glassmorphic Navigation Bar */}
      <div
        className={`relative z-10 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl ${headerBarBg}`}
      >
        {/* Title & Path Stats */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${headerIconGradient} p-0.5 border border-white/30 flex items-center justify-center`}
          >
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight drop-shadow-sm">
                Campus Wayfinding Graph
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${engineBadgeStyle}`}
              >
                Dijkstra Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-200/90 font-medium">
              {nodes.length} campus nodes • {edges.length} corridors •{' '}
              <span
                className={`font-bold ${
                  isGoldPink
                    ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : isEmeraldMint
                    ? 'text-emerald-300'
                    : 'text-emerald-400'
                }`}
              >
                {totalSteps} Waypoints in Route
              </span>
            </p>
          </div>
        </div>

        {/* Right Controls: Device GPS Track & Auto Walk */}
        <div className="flex items-center gap-2">
          {/* Live Device Geolocation Button */}
          <button
            onClick={toggleTracking}
            title={isTracking ? 'Device GPS tracking active' : 'Enable device GPS live tracking'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all backdrop-blur-md border ${
              isTracking
                ? isGoldPink
                  ? 'bg-pink-500/30 text-pink-200 border-pink-400/50 shadow-[0_0_18px_rgba(244,63,94,0.45)]'
                  : 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isTracking
                  ? isGoldPink
                    ? 'text-amber-300 animate-pulse'
                    : 'text-emerald-400 animate-pulse'
                  : 'text-slate-300'
              }`}
            />
            <span>{isTracking ? 'GPS Tracking Active' : 'Track Device GPS'}</span>
            {isTracking && (
              <span
                className={`w-2 h-2 rounded-full animate-ping ${
                  isGoldPink ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            )}
          </button>

          {/* Auto Walk Simulation Button */}
          <button
            onClick={() => setIsAutoWalking(!isAutoWalking)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md border ${
              isAutoWalking
                ? isGoldPink
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                  : 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isAutoWalking ? 'text-amber-300 animate-spin' : 'text-slate-300'}`} />
            <span>{isAutoWalking ? 'Auto Walking...' : 'Auto Walk'}</span>
          </button>

          {/* Reset Navigation */}
          <button
            onClick={handleReset}
            title="Reset route to start"
            className="p-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GPS Live Telemetry Glass Banner (when tracking) */}
      {isTracking && (
        <div
          className={`relative z-10 px-4 sm:px-6 py-2 border-b backdrop-blur-md flex flex-wrap items-center justify-between text-[11px] ${
            isGoldPink
              ? 'bg-pink-950/40 border-pink-400/25 text-pink-200'
              : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono font-semibold">
              <Crosshair
                className={`w-3.5 h-3.5 ${isGoldPink ? 'text-amber-300' : 'text-emerald-400'}`}
              />
              <span>
                {latitude ? latitude.toFixed(5) : '17.04520'}°N,{' '}
                {longitude ? longitude.toFixed(5) : '74.26540'}°E
              </span>
            </span>
            <span className={isGoldPink ? 'text-pink-400/70' : 'text-emerald-400/60'}>•</span>
            <span>Accuracy: ±{accuracy || 4}m</span>
            <span className={isGoldPink ? 'text-pink-400/70' : 'text-emerald-400/60'}>•</span>
            <span>Speed: {speed || 1.2} m/s</span>
            {isSimulated && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                  isGoldPink
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                Indoor Sim Mode
              </span>
            )}
          </div>
          <button
            onClick={handleSnapToDevice}
            className={`font-bold flex items-center gap-1 text-[11px] hover:underline ${
              isGoldPink ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            <span>Snap Panda to Device Position</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className={`absolute top-16 right-4 z-20 backdrop-blur-xl px-4 py-2.5 rounded-2xl border text-xs shadow-2xl animate-in fade-in flex items-center gap-3 ${
            isGoldPink
              ? 'bg-pink-950/90 border-pink-400/40 shadow-pink-950/60'
              : isEmeraldMint
              ? 'bg-emerald-950/90 border-emerald-400/40 shadow-emerald-950/60'
              : 'bg-slate-900/90 border-indigo-400/30'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isGoldPink
                ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                : isEmeraldMint
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white text-xs">{hoveredNode.name}</p>
            <p
              className={`text-[10px] font-mono mt-0.5 uppercase ${
                isGoldPink ? 'text-pink-300/80' : 'text-slate-400'
              }`}
            >
              Facility Type: {hoveredNode.type || 'Building'} • Node: #{hoveredNode.id}
            </p>
          </div>
        </div>
      )}

      {/* SVG Canvas Map with Radiant Theme Background */}
      <div className="relative w-full h-80 sm:h-[420px] flex items-center justify-center p-2 overflow-hidden">
        <svg
          viewBox="50 140 850 540"
          className="w-full h-full select-none"
        >
          <defs>
            {/* Gold-Pink Rich Gradient Underlay */}
            <linearGradient id="goldPinkCanvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3d0f28" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#260819" stopOpacity="0.98" />
              <stop offset="70%" stopColor="#200715" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#44132e" stopOpacity="0.95" />
            </linearGradient>

            {/* Radiant Ambient Radial Pools for Gold-Pink Mode */}
            <radialGradient id="goldGlowSpot1" cx="20%" cy="25%" r="45%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="pinkGlowSpot2" cx="78%" cy="70%" r="48%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="magentaGlowSpot3" cx="50%" cy="45%" r="40%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </radialGradient>

            {/* Emerald-Mint Canvas Background */}
            <linearGradient id="emeraldMintCanvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#08291f" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#03140e" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#0a3327" stopOpacity="0.95" />
            </linearGradient>

            {/* Gold-Pink Grid with Sparkling Warm Gold Lines & Stars */}
            <pattern id="goldPinkGrid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path
                d="M 45 0 L 0 0 0 45"
                fill="none"
                stroke="rgba(251, 191, 36, 0.16)"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="1.5" fill="#fde047" opacity="0.65" />
              <circle cx="45" cy="45" r="1.2" fill="#f472b6" opacity="0.6" />
            </pattern>

            {/* Default Glass Grid */}
            <pattern id="glassGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.08)" />
            </pattern>

            {/* Neon Glow Filters */}
            <filter id="neonPathGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="nodeGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Theme-Adaptive Linear Gradient for Path */}
            <linearGradient id="activePathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {isGoldPink ? (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="35%" stopColor="#f43f5e" />
                  <stop offset="70%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#fde047" />
                </>
              ) : isEmeraldMint ? (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Canvas Underlay */}
          <rect
            x="0"
            y="0"
            width="1000"
            height="750"
            fill={
              isGoldPink
                ? 'url(#goldPinkCanvasBg)'
                : isEmeraldMint
                ? 'url(#emeraldMintCanvasBg)'
                : '#0b1120'
            }
          />

          {/* Ambient Radiant Glow Pools for Gold-Pink */}
          {isGoldPink && (
            <>
              <rect x="0" y="0" width="1000" height="750" fill="url(#goldGlowSpot1)" />
              <rect x="0" y="0" width="1000" height="750" fill="url(#pinkGlowSpot2)" />
              <rect x="0" y="0" width="1000" height="750" fill="url(#magentaGlowSpot3)" />
            </>
          )}

          {/* Grid Pattern Overlay */}
          <rect
            x="0"
            y="0"
            width="1000"
            height="750"
            fill={isGoldPink ? 'url(#goldPinkGrid)' : 'url(#glassGrid)'}
          />

          {/* All Inactive Corridor Edges */}
          {edges.map((edge, idx) => {
            const fromNode = nodeMap.current.get(edge.from);
            const toNode = nodeMap.current.get(edge.to);
            if (!fromNode || !toNode) return null;

            const isHighlighted = isEdgeInPath(edge);

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={
                    isHighlighted
                      ? 'url(#activePathGradient)'
                      : isGoldPink
                      ? 'rgba(244, 114, 182, 0.32)'
                      : isEmeraldMint
                      ? 'rgba(52, 211, 153, 0.28)'
                      : 'rgba(148, 163, 184, 0.18)'
                  }
                  strokeWidth={isHighlighted ? 5 : 2.5}
                  strokeDasharray={isHighlighted ? '8 5' : undefined}
                  className={isHighlighted ? 'animate-pulse' : ''}
                  filter={isHighlighted ? 'url(#neonPathGlow)' : undefined}
                  strokeLinecap="round"
                />

                {/* Corridor Distance Pill */}
                {(() => {
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  return (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-19"
                        y="-9"
                        width="38"
                        height="18"
                        rx="9"
                        fill={
                          isGoldPink
                            ? 'rgba(58, 16, 38, 0.92)'
                            : isEmeraldMint
                            ? 'rgba(6, 30, 22, 0.92)'
                            : 'rgba(15, 23, 42, 0.85)'
                        }
                        stroke={
                          isHighlighted
                            ? isGoldPink
                              ? 'rgba(251, 191, 36, 0.7)'
                              : isEmeraldMint
                              ? 'rgba(52, 211, 153, 0.6)'
                              : 'rgba(99, 102, 241, 0.5)'
                            : isGoldPink
                            ? 'rgba(244, 114, 182, 0.4)'
                            : 'rgba(255, 255, 255, 0.1)'
                        }
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontSize="9.5"
                        fill={
                          isHighlighted
                            ? isGoldPink
                              ? '#fde047'
                              : isEmeraldMint
                              ? '#a7f3d0'
                              : '#a5b4fc'
                            : isGoldPink
                            ? '#fbcfe8'
                            : '#94a3b8'
                        }
                        className="font-mono font-bold select-none pointer-events-none"
                      >
                        {edge.weight}m
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Campus Graph Nodes - Theme Adaptive & High Contrast */}
          {nodes.map((node) => {
            const isStart = node.id === sourceNodeId || node.id === activePath[0];
            const isEnd =
              node.id === destinationNodeId || node.id === activePath[activePath.length - 1];
            const isInPath = activePath.includes(node.id);
            const pathIndex = activePath.indexOf(node.id);
            const isPastNode = pathIndex !== -1 && pathIndex < stepIndex;
            const isCurrentNode = pathIndex === stepIndex;

            let fillColor = isGoldPink
              ? 'rgba(55, 17, 38, 0.92)'
              : 'rgba(30, 41, 59, 0.85)';
            let strokeColor = isGoldPink
              ? 'rgba(244, 114, 182, 0.4)'
              : 'rgba(255, 255, 255, 0.2)';
            let radius = 15;

            if (isCurrentNode) {
              fillColor = isGoldPink
                ? 'rgba(244, 63, 94, 0.98)'
                : isEmeraldMint
                ? 'rgba(16, 185, 129, 0.95)'
                : 'rgba(99, 102, 241, 0.9)';
              strokeColor = isGoldPink ? '#fde047' : isEmeraldMint ? '#34d399' : '#a5b4fc';
              radius = 21;
            } else if (isPastNode) {
              fillColor = isGoldPink
                ? 'rgba(245, 158, 11, 0.95)'
                : 'rgba(16, 185, 129, 0.85)';
              strokeColor = isGoldPink ? '#fef08a' : '#34d399';
              radius = 16;
            } else if (isStart) {
              fillColor = isGoldPink
                ? 'rgba(245, 158, 11, 0.95)'
                : 'rgba(16, 185, 129, 0.85)';
              strokeColor = isGoldPink ? '#fef08a' : '#34d399';
              radius = 18;
            } else if (isEnd) {
              fillColor = isGoldPink
                ? 'rgba(245, 158, 11, 0.98)'
                : isEmeraldMint
                ? 'rgba(20, 184, 166, 0.95)'
                : 'rgba(129, 140, 248, 0.9)';
              strokeColor = isGoldPink ? '#fef08a' : isEmeraldMint ? '#5eead4' : '#818cf8';
              radius = 21;
            } else if (isInPath) {
              fillColor = isGoldPink
                ? 'rgba(236, 72, 153, 0.88)'
                : isEmeraldMint
                ? 'rgba(5, 150, 105, 0.8)'
                : 'rgba(79, 70, 229, 0.7)';
              strokeColor = isGoldPink ? '#fbbf24' : isEmeraldMint ? '#34d399' : '#818cf8';
              radius = 16;
            }

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (activePath.includes(node.id)) {
                    const idx = activePath.indexOf(node.id);
                    if (onStepChange) onStepChange(idx);
                    else setInternalStepIndex(idx);
                  }
                }}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Outer Glassmorphic Pulse for Current & End Node */}
                {(isCurrentNode || isEnd) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 11}
                    fill={
                      isCurrentNode
                        ? isGoldPink
                          ? 'rgba(251, 191, 36, 0.35)'
                          : isEmeraldMint
                          ? 'rgba(16, 185, 129, 0.35)'
                          : 'rgba(99, 102, 241, 0.25)'
                        : isGoldPink
                        ? 'rgba(245, 158, 11, 0.35)'
                        : isEmeraldMint
                        ? 'rgba(20, 184, 166, 0.3)'
                        : 'rgba(56, 189, 248, 0.2)'
                    }
                    className="animate-ping origin-center"
                    style={{ animationDuration: '2.5s' }}
                  />
                )}

                {/* Main Node Bubble */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="3"
                  filter="url(#nodeGlow)"
                />

                {/* Inner Icon / Step Number */}
                {isPastNode ? (
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    ✓
                  </text>
                ) : isCurrentNode ? (
                  <circle cx={node.x} cy={node.y} r="4.5" fill="#ffffff" />
                ) : isStart ? (
                  <text
                    x={node.x}
                    y={node.y + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    START
                  </text>
                ) : isEnd ? (
                  <text
                    x={node.x}
                    y={node.y + 3.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="extrabold"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    LAB
                  </text>
                ) : (
                  <circle cx={node.x} cy={node.y} r="3" fill="rgba(255, 255, 255, 0.7)" />
                )}

                {/* Node Name Label Pill */}
                <g transform={`translate(${node.x}, ${node.y + radius + 14})`}>
                  <rect
                    x="-65"
                    y="-10"
                    width="130"
                    height="20"
                    rx="10"
                    fill={
                      isGoldPink
                        ? 'rgba(48, 14, 33, 0.88)'
                        : 'rgba(15, 23, 42, 0.82)'
                    }
                    stroke={
                      isCurrentNode
                        ? isGoldPink
                          ? 'rgba(251, 191, 36, 0.7)'
                          : 'rgba(129, 140, 248, 0.5)'
                        : isInPath
                        ? isGoldPink
                          ? 'rgba(244, 114, 182, 0.5)'
                          : 'rgba(255, 255, 255, 0.15)'
                        : isGoldPink
                        ? 'rgba(244, 114, 182, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)'
                    }
                    strokeWidth="1"
                    className="backdrop-blur-md"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isCurrentNode ? 'bold' : isInPath ? '600' : '400'}
                    fill={
                      isCurrentNode
                        ? '#ffffff'
                        : isInPath
                        ? isGoldPink
                          ? '#fde047'
                          : '#e0e7ff'
                        : isGoldPink
                        ? '#fbcfe8'
                        : '#94a3b8'
                    }
                    className="select-none pointer-events-none"
                  >
                    {node.name.length > 20 ? node.name.slice(0, 18) + '...' : node.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Real Device Location Radar Indicator (if GPS active) */}
          {isTracking && (
            <g transform={`translate(${pandaPos.x + 8}, ${pandaPos.y + 8})`}>
              <circle
                r="30"
                fill="none"
                stroke={isGoldPink ? 'rgba(251, 191, 36, 0.5)' : 'rgba(16, 185, 129, 0.4)'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-spin-slow"
              />
              <circle
                r="18"
                fill={isGoldPink ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.15)'}
                stroke={isGoldPink ? 'rgba(251, 191, 36, 0.7)' : 'rgba(16, 185, 129, 0.6)'}
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* THE THEME-ADAPTIVE NES PIXEL PANDA CHARACTER SPRITE! */}
          <NesPandaSprite
            x={pandaPos.x}
            y={pandaPos.y}
            facing={facing}
            isWalking={isWalking}
            scale={1.25}
            statusText={
              isCompleted
                ? 'Arrived! 🎉'
                : `Step ${stepIndex + 1}/${totalSteps}`
            }
          />
        </svg>

        {/* Celebration Overlay when Reaching Destination */}
        {showCelebration && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in zoom-in-95 duration-300">
            <div
              className={`w-16 h-16 rounded-3xl bg-gradient-to-tr ${celebrationBadgeStyle} p-1 mb-3 flex items-center justify-center animate-bounce`}
            >
              <Award className="w-9 h-9 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>You Have Arrived at Destination!</span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            </h3>
            <p className="text-xs text-slate-200 max-w-sm mt-1">
              NES Panda successfully navigated to{' '}
              <strong className={isGoldPink ? 'text-amber-300' : 'text-emerald-300'}>
                {destinationNode?.name}
              </strong>
              . All waypoints completed!
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setShowCelebration(false)}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-colors ${
                  isGoldPink
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 shadow-pink-500/35'
                    : isEmeraldMint
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                }`}
              >
                Continue In Lab
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs transition-colors"
              >
                Replay Walk
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Glassmorphic Interactive Step Progress & "Click Completed" Action Bar */}
      <div
        className={`relative z-10 px-4 sm:px-6 py-4 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${footerBarBg}`}
      >
        {/* Step Status Text & Progress Bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <div className="flex items-center gap-2">
              <Footprints
                className={`w-4 h-4 ${
                  isGoldPink
                    ? 'text-amber-300'
                    : isEmeraldMint
                    ? 'text-emerald-400'
                    : 'text-emerald-400'
                }`}
              />
              <span className="text-white">
                Step {stepIndex + 1} of {totalSteps}:{' '}
                <span
                  className={`font-bold ${
                    isGoldPink
                      ? 'text-amber-200'
                      : isEmeraldMint
                      ? 'text-emerald-300'
                      : 'text-indigo-300'
                  }`}
                >
                  {currentNode?.name || 'Departing'}
                </span>
              </span>
            </div>
            <span
              className={`font-mono font-bold ${
                isGoldPink
                  ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : isEmeraldMint
                  ? 'text-emerald-300'
                  : 'text-emerald-400'
              }`}
            >
              {progressPercent}% Completed
            </span>
          </div>

          {/* Glowing Glass Progress Track */}
          <div
            className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${
              isGoldPink
                ? 'bg-pink-950/60 border-pink-400/30'
                : 'bg-white/10 border-white/10'
            }`}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressBarGradient} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p
            className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${
              isGoldPink ? 'text-pink-200/80' : 'text-slate-400'
            }`}
          >
            <Info className={`w-3 h-3 shrink-0 ${isGoldPink ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>
              {isCompleted
                ? 'Destination reached. Ready for hardware check-in.'
                : nextNode
                ? `Next Waypoint: Proceed towards ${nextNode.name}`
                : 'Follow the glowing route line to destination.'}
            </span>
          </p>
        </div>

        {/* Action Button: "Mark Step Completed" */}
        <div className="flex items-center gap-3 shrink-0">
          {!isCompleted ? (
            <button
              onClick={handleNextStep}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${markCompletedBtnStyle}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Step Completed (I'm Here)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleReset}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isGoldPink
                  ? 'text-amber-200 bg-amber-500/25 border border-amber-400/50 hover:bg-amber-500/35 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Arrived! Walk Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
