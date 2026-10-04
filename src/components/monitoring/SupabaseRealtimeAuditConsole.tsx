import React, { useState } from 'react';
import {
  Activity,
  Radio,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Layers,
  Calendar,
  User,
  ArrowRight,
  Database,
  Send,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { useSupabaseAuditLog, useTheme } from '../../hooks';
import { Button } from '../common';

interface AuditPayloadData {
  bookingId?: string;
  labId?: string;
  labName?: string;
  userName?: string;
  email?: string;
  userEmail?: string;
  actorEmail?: string;
  date?: string;
  timeSlot?: string;
  purpose?: string;
  status?: string;
  workstationLabel?: string;
  arrivedAtWaypoint?: string;
  _recordedBy?: {
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    actorEmail?: string;
    email?: string;
  };
  [key: string]: unknown;
}

export const SupabaseRealtimeAuditConsole: React.FC = () => {
  const { logs, isLoading, isConnected, latestEntry, refetch, logActivity } =
    useSupabaseAuditLog(60);
  const { isGoldPink, isEmeraldMint } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Filter logs based on search and action
  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      selectedActionFilter === 'ALL' ||
      log.action.toUpperCase().includes(selectedActionFilter.toUpperCase());

    const searchLower = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(searchLower);
    const corrMatch = log.correlation_id?.toLowerCase().includes(searchLower);
    const payloadStr = JSON.stringify(log.after || {}).toLowerCase();
    const matchesSearch = !searchQuery || actionMatch || corrMatch || payloadStr.includes(searchLower);

    return matchesAction && matchesSearch;
  });

  // Quick live event simulation to verify real-time streaming
  const handleSimulateLiveBooking = async () => {
    setIsSimulating(true);
    const sampleLabs = [
      { id: 'lab_d03', name: 'Project & Research Hub - D-03' },
      { id: 'lab_d04', name: 'Data Center & Software Development - D-04' },
      { id: 'lab_d07', name: 'AI & Advanced Computing Center - D-07' },
      { id: 'lab_d11', name: 'High-Performance GPU Compute Cluster - D-11' },
    ];
    const pickedLab = sampleLabs[Math.floor(Math.random() * sampleLabs.length)];
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uniqueNum}`;

    await logActivity({
      action: 'LAB_RESERVATION_CONFIRMED',
      actorId: null,
      actorName: 'Student User (Live Realtime)',
      actorRole: 'student',
      actorEmail: '2553018@ritindia.edu',
      correlationId: `corr-${bookingId}`,
      before: null,
      after: {
        bookingId,
        email: '2553018@ritindia.edu',
        userEmail: '2553018@ritindia.edu',
        actorEmail: '2553018@ritindia.edu',
        labId: pickedLab.id,
        labName: pickedLab.name,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM - 12:00 PM',
        purpose: 'Deep Learning Model Acceleration & Hardware Verification',
        status: 'CONFIRMED',
        source: 'Supabase Realtime Console Trigger',
        timestamp: new Date().toISOString(),
      },
    });

    setIsSimulating(false);
  };

  // Helper for badge styling based on action
  const getActionBadge = (action: string) => {
    if (action.includes('CONFIRMED') || action.includes('APPROVED')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35';
    }
    if (action.includes('QUEUED') || action.includes('WAITLIST')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/35';
    }
    if (action.includes('CANCELLED') || action.includes('REJECTED')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/35';
    }
    if (action.includes('WORKSTATION')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/35';
    }
    if (action.includes('WAYFINDING')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/35';
    }
    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35';
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Realtime Connection Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Database className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Supabase Realtime `audit_log` Stream</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                public.audit_log
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Realtime event streaming for all user laboratory bookings, queue decisions, workstation allocations, and campus interactions.
          </p>
        </div>

        {/* Realtime Status Indicator & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live indicator badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-semibold text-emerald-300 text-[11px]">
              {isConnected ? 'Realtime Connected' : 'Connecting Stream...'}
            </span>
          </div>

          {/* Simulate Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateLiveBooking}
            isLoading={isSimulating}
            leftIcon={<Send className="w-3.5 h-3.5 text-amber-400" />}
          >
            Simulate Activity
          </Button>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            title="Refresh stream from Supabase"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Realtime KPI Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Total Audited Events</span>
          </span>
          <p className="text-xl font-black text-white font-mono">{logs.length}</p>
          <p className="text-[10px] text-slate-500">Persisted in Supabase table</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Stream Protocol</span>
          </span>
          <p className="text-xl font-black text-emerald-400 font-mono">WebSocket</p>
          <p className="text-[10px] text-slate-500">Postgres + Broadcast Channel</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Correlation Trace</span>
          </span>
          <p className="text-xl font-black text-amber-300 font-mono">100%</p>
          <p className="text-[10px] text-slate-500">Atomic correlation_id</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Latest Event</span>
          </span>
          <p className="text-xs font-bold text-slate-200 truncate font-mono">
            {latestEntry ? formatRelativeTime(latestEntry.created_at) : 'Listening...'}
          </p>
          <p className="text-[10px] text-slate-500 truncate">
            {latestEntry ? latestEntry.action : 'Waiting for activity'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, correlation ID, or lab..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action Type Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { label: 'All Activities', value: 'ALL' },
            { label: 'Bookings', value: 'RESERVATION' },
            { label: 'Cancellations', value: 'CANCELLED' },
            { label: 'Workstations', value: 'WORKSTATION' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedActionFilter(tab.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedActionFilter === tab.value
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream List */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
            <Radio className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <p className="text-sm font-semibold text-slate-300">Listening to Supabase Realtime stream...</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any time a student or faculty member books a lab, cancels a slot, or checks into a bench, the activity will appear here instantaneously.
            </p>
            <button
              onClick={handleSimulateLiveBooking}
              className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs hover:bg-indigo-600/30"
            >
              Click to emit sample activity
            </button>
          </div>
        ) : (
          filteredLogs.map((entry, idx) => {
            const isExpanded = expandedLogId === entry.id;
            const afterData = (entry.after || {}) as AuditPayloadData;
            const recordedBy = afterData._recordedBy || {};
            const actorName = String(
              afterData.userName ||
              recordedBy.actorName ||
              (entry.actor_id ? `User #${entry.actor_id.slice(0, 8)}` : 'Campus User')
            );
            const actorRole = String(recordedBy.actorRole || 'student');
            const actorEmail = String(
              afterData.email ||
              afterData.userEmail ||
              afterData.actorEmail ||
              recordedBy.email ||
              recordedBy.actorEmail ||
              (entry.before as any)?.email ||
              (entry.before as any)?.userEmail ||
              ''
            );
            const labName = String(
              afterData.labName || afterData.labId || 'General Facility'
            );
            const bookingId = afterData.bookingId ? String(afterData.bookingId) : undefined;
            const timeSlot = afterData.timeSlot ? String(afterData.timeSlot) : afterData.date ? String(afterData.date) : undefined;
            const purpose = afterData.purpose ? String(afterData.purpose) : undefined;

            return (
              <div
                key={entry.id || idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-2.5"
              >
                {/* Primary Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border uppercase tracking-wider ${getActionBadge(
                        entry.action
                      )}`}
                    >
                      {entry.action}
                    </span>

                    {/* Correlation ID */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {entry.correlation_id}
                    </span>

                    {/* Relative Time */}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatRelativeTime(entry.created_at)}</span>
                    </span>
                  </div>

                  {/* Expand / Details Toggle */}
                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold self-end sm:self-auto"
                  >
                    <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Summary Info */}
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-slate-300 text-xs">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <strong className="text-white">{actorName}</strong>
                    <span className="text-slate-500">
                      ({actorRole})
                    </span>
                  </span>

                  {/* Prominent User Activity Email Display */}
                  {actorEmail ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[11px] font-medium">
                      <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{actorEmail}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-800/40">
                      <Mail className="w-2.5 h-2.5 text-slate-500" />
                      <span>system</span>
                    </span>
                  )}

                  {bookingId && (
                    <span className="font-mono text-indigo-300 font-bold">
                      {bookingId}
                    </span>
                  )}

                  <span className="text-slate-400">
                    Facility: <strong className="text-slate-200">{labName}</strong>
                  </span>

                  {timeSlot && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Slot: {timeSlot}
                    </span>
                  )}
                </div>

                {purpose && (
                  <p className="text-[11px] text-slate-400 italic">
                    "{purpose}"
                  </p>
                )}

                {/* Expanded JSON Diff Viewer */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                      {/* Before State */}
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 overflow-x-auto">
                        <p className="font-bold text-slate-400 mb-1">Before State:</p>
                        <pre className="text-slate-500">
                          {entry.before ? JSON.stringify(entry.before, null, 2) : 'null (New Row Created)'}
                        </pre>
                      </div>

                      {/* After State */}
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 overflow-x-auto">
                        <p className="font-bold text-emerald-400 mb-1">After State (Recorded in Supabase):</p>
                        <pre className="text-emerald-300/90">
                          {JSON.stringify(entry.after, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Row UUID: {entry.id}</span>
                      <span>Recorded At: {entry.created_at}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
