import React from 'react';
import {
  ShieldCheck,
  User,
  Key,
  Database,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
  Layers,
  GraduationCap,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { Role } from '../../types';
import { Button } from './Button';
import { RITLogo } from './RITLogo';

interface AuthDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthDetailsModal: React.FC<AuthDetailsModalProps> = ({ isOpen, onClose }) => {
  const { user, role, token, switchDemoRole } = useAuth();

  if (!isOpen) return null;

  const permissionsByRole: Record<Role, string[]> = {
    student: [
      'Discover 12 Campus Laboratories & Real-Time Availability',
      'Reserve Workstations & Daily Timing Slots (09:00 AM - 05:15 PM)',
      'Interactive Campus Dijkstra Wayfinding Navigation',
      'View Personal Reservation History & Allocation Pass',
      'Instant Auto-Cancel & Reschedule Bookings',
    ],
    faculty: [
      'High-Priority Academic Practical & Capstone Slot Reservations',
      'Batch Multi-Workstation Reservations for Classes',
      'Faculty Departmental Curriculum & Laboratory Utilization Reports',
      'Scheduling Policy Selection (FCFS, Priority, SJF)',
      'Export Class Attendance & Session Records (CSV)',
    ],
    admin: [
      'Master Institutional Laboratory Audit & Asset Valuation (12 Labs, ₹3.42 Cr)',
      'Full 3NF Equipment Catalog Management (Workstations, PCs & Printers)',
      'Live Operational Telemetry & System Health Diagnostics',
      'Direct Supabase PostgreSQL Schema & Real-Time Slot Administration',
      'Financial Depreciation, Dead Stock & Warranty Tracking',
    ],
  };

  const currentPermissions = role ? permissionsByRole[role] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <RITLogo className="w-10 h-10 shadow-md shrink-0" variant="mark" rounded="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Authenticated Session Details</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                RIT SmartCampus &bull; Connected to Supabase PostgreSQL & WebSockets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
          {/* User Profile Card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{user?.name || 'Verified User'}</h4>
                <p className="text-xs text-slate-300 font-mono">{user?.email || 'user@ritindia.edu'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dept of Computer Science & Engineering
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Active Role</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  role === 'admin'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : role === 'faculty'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {role || 'Student'}
              </span>
            </div>
          </div>

          {/* Cloud Database & Realtime Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
              <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase text-slate-400 font-semibold block">Database Engine</span>
                <span className="text-xs font-bold text-slate-200">Supabase PostgreSQL 15</span>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[180px]">
                  ksecnwtqykmqfidspuzt.supabase.co
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
              <Radio className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[11px] uppercase text-slate-400 font-semibold block">Real-Time Sync</span>
                <span className="text-xs font-bold text-emerald-300">WebSockets Connected</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Instant postgres_changes listener</p>
              </div>
            </div>
          </div>

          {/* Access Permissions Grid */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Granted Role Privileges ({role?.toUpperCase()})</span>
            </h5>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              {currentPermissions.map((perm, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Switch Role Fast Tester */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Role Switcher (Test Faculty & Admin Access)</span>
              </span>
              <span className="text-[11px] text-slate-400">Preview without re-login</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={async () => {
                  await switchDemoRole('student');
                  onClose();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await switchDemoRole('faculty');
                  onClose();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  role === 'faculty'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await switchDemoRole('admin');
                  onClose();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
